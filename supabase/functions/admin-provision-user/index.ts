import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cors,
  });
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

function safePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let createdUserId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Server configuration is incomplete.');
    }

    const authorization = req.headers.get('Authorization') ?? '';

    if (!authorization.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const service = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: admin, error: adminError } =
      await service
        .from('profiles')
        .select(
          'id, school_id, role, is_active, full_name, phone',
        )
        .eq('id', user.id)
        .maybeSingle();

    if (
      adminError ||
      !admin ||
      admin.role !== 'ADMIN' ||
      admin.is_active !== true
    ) {
      return json(
        { error: 'Active school admin access required.' },
        403,
      );
    }

    const input = await req.json();

    const role = String(input.role ?? '').toUpperCase();
    const fullName = String(input.full_name ?? '').trim();
    const rawPhone = String(input.phone ?? '').trim();
    const password = String(input.password ?? '');

    // IMPORTANT:
    // Never trust school_id sent by frontend.
    // Always use the logged-in admin's school.
    const schoolId = admin.school_id;

    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return json(
        {
          error:
            'Only STUDENT or TEACHER accounts can be created here.',
        },
        400,
      );
    }

    if (fullName.length < 2) {
      return json(
        { error: 'Valid full name is required.' },
        400,
      );
    }

    const phone = normalizePhone(rawPhone);
    const phoneDigits = phone.replace(/\D/g, '');

    if (
      phoneDigits.length !== 10 &&
      !(
        phoneDigits.length === 12 &&
        phoneDigits.startsWith('91')
      )
    ) {
      return json(
        { error: 'Valid Indian phone number is required.' },
        400,
      );
    }

    if (password.length < 6) {
      return json(
        {
          error:
            'Password must contain at least 6 characters.',
        },
        400,
      );
    }

    const { data: school, error: schoolError } =
      await service
        .from('schools')
        .select('id, code, name, status')
        .eq('id', schoolId)
        .maybeSingle();

    if (
      schoolError ||
      !school ||
      school.status !== 'ACTIVE'
    ) {
      return json(
        { error: 'Active school not found.' },
        400,
      );
    }

    /*
     * =========================================================
     * STUDENT
     * =========================================================
     */

    if (role === 'STUDENT') {
      const classId =
        String(input.class_id ?? '').trim() || null;

      const sectionId =
        String(input.section_id ?? '').trim() || null;

      const streamId =
        String(input.stream_id ?? '').trim() || null;

      const admissionNo =
        String(input.admission_no ?? '').trim();

      if (!admissionNo) {
        return json(
          { error: 'Admission number is required.' },
          400,
        );
      }

      if (!classId || !sectionId) {
        return json(
          {
            error:
              'Class and section are required.',
          },
          400,
        );
      }

      const { data: classRow } =
        await service
          .from('classes')
          .select('id, school_id')
          .eq('id', classId)
          .eq('school_id', schoolId)
          .maybeSingle();

      if (!classRow) {
        return json(
          { error: 'Selected class is invalid.' },
          400,
        );
      }

      const { data: sectionRow } =
        await service
          .from('sections')
          .select(
            'id, school_id, class_id, stream_id',
          )
          .eq('id', sectionId)
          .eq('school_id', schoolId)
          .maybeSingle();

      if (
        !sectionRow ||
        sectionRow.class_id !== classId
      ) {
        return json(
          {
            error:
              'Selected section is invalid for this class.',
          },
          400,
        );
      }

      if (
        streamId &&
        sectionRow.stream_id &&
        sectionRow.stream_id !== streamId
      ) {
        return json(
          {
            error:
              'Selected stream does not match the section.',
          },
          400,
        );
      }

      const { data: existingAdmission } =
        await service
          .from('student_profiles')
          .select('id')
          .eq('school_id', schoolId)
          .eq('admission_no', admissionNo)
          .maybeSingle();

      if (existingAdmission) {
        return json(
          {
            error:
              'Admission number already exists.',
          },
          409,
        );
      }

      const email =
        `student.${safePart(school.code)}.` +
        `${crypto.randomUUID().replaceAll('-', '')}` +
        `@accounts.educonnect.app`;

      const {
        data: created,
        error: createError,
      } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          account_type: 'STUDENT',
          school_id: schoolId,
        },
      });

      if (createError || !created.user) {
        throw (
          createError ??
          new Error('Auth user creation failed.')
        );
      }

      createdUserId = created.user.id;

      const { error: profileError } =
        await service
          .from('profiles')
          .insert({
            id: createdUserId,
            school_id: schoolId,
            role: 'STUDENT',
            full_name: fullName,
            phone,
            auth_email: email,
            is_active: true,
          });

      if (profileError) {
        throw profileError;
      }

      const { error: studentError } =
        await service
          .from('student_profiles')
          .insert({
            school_id: schoolId,
            profile_id: createdUserId,
            admission_no: admissionNo,
            class_id: classId,
            section_id: sectionId,
            stream_id: streamId,
            login_phone: phone,
            account_status: 'ACTIVE',
          });

      if (studentError) {
        throw studentError;
      }

      return json({
        ok: true,
        user_id: createdUserId,
        role: 'STUDENT',
        school_id: schoolId,
      });
    }

    /*
     * =========================================================
     * TEACHER
     * =========================================================
     */

    const employeeNo =
      String(input.employee_no ?? '').trim();

    if (!employeeNo) {
      return json(
        { error: 'Employee number is required.' },
        400,
      );
    }

    const { data: existingEmployee } =
      await service
        .from('teacher_profiles')
        .select('id')
        .eq('school_id', schoolId)
        .eq('employee_no', employeeNo)
        .maybeSingle();

    if (existingEmployee) {
      return json(
        {
          error:
            'Employee number already exists.',
        },
        409,
      );
    }

    const email =
      `teacher.${safePart(school.code)}.` +
      `${crypto.randomUUID().replaceAll('-', '')}` +
      `@accounts.educonnect.app`;

    const {
      data: created,
      error: createError,
    } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        account_type: 'TEACHER',
        school_id: schoolId,
      },
    });

    if (createError || !created.user) {
      throw (
        createError ??
        new Error('Auth user creation failed.')
      );
    }

    createdUserId = created.user.id;

    const { error: profileError } =
      await service
        .from('profiles')
        .insert({
          id: createdUserId,
          school_id: schoolId,
          role: 'TEACHER',
          full_name: fullName,
          phone,
          auth_email: email,
          is_active: true,
        });

    if (profileError) {
      throw profileError;
    }

    const {
      data: teacher,
      error: teacherError,
    } = await service
      .from('teacher_profiles')
      .insert({
        school_id: schoolId,
        profile_id: createdUserId,
        employee_no: employeeNo,
      })
      .select('id')
      .single();

    if (teacherError || !teacher) {
      throw (
        teacherError ??
        new Error(
          'Teacher profile creation failed.',
        )
      );
    }

    const { error: permissionError } =
      await service
        .from('teacher_permissions')
        .insert({
          school_id: schoolId,
          teacher_id: teacher.id,
          can_manage_students: false,
          can_manage_attendance: true,
          can_manage_homework: true,
          can_manage_results: false,
          can_manage_notices: false,
          can_manage_ptm: false,
        });

    if (permissionError) {
      throw permissionError;
    }

    return json({
      ok: true,
      user_id: createdUserId,
      role: 'TEACHER',
      school_id: schoolId,
    });
  } catch (error) {
    /*
     * Best-effort rollback.
     */
    if (createdUserId) {
      try {
        const supabaseUrl =
          Deno.env.get('SUPABASE_URL')!;

        const serviceRoleKey =
          Deno.env.get(
            'SUPABASE_SERVICE_ROLE_KEY',
          )!;

        const cleanup = createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        );

        await cleanup
          .from('student_profiles')
          .delete()
          .eq('profile_id', createdUserId);

        await cleanup
          .from('teacher_profiles')
          .delete()
          .eq('profile_id', createdUserId);

        await cleanup
          .from('profiles')
          .delete()
          .eq('id', createdUserId);

        await cleanup.auth.admin.deleteUser(
          createdUserId,
        );
      } catch {
        // Best-effort cleanup only.
      }
    }

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Provisioning failed.',
      },
      400,
    );
  }
});
