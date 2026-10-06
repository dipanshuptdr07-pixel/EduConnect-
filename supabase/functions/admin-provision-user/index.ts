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

function safeEmailPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);
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

    const authorization =
      req.headers.get('Authorization') ?? '';

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
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
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

    const { data: owner, error: ownerError } =
      await service
        .from('platform_owners')
        .select('id, is_active')
        .eq('id', user.id)
        .maybeSingle();

    if (
      ownerError ||
      !owner ||
      owner.is_active !== true
    ) {
      return json(
        { error: 'Platform owner access required.' },
        403,
      );
    }

    const input = await req.json();

    const schoolId = String(input.school_id ?? '').trim();
    const fullName = String(input.full_name ?? '').trim();
    const phone = normalizePhone(String(input.phone ?? ''));
    const password = String(input.password ?? '');

    if (!schoolId) {
      return json({ error: 'school_id is required.' }, 400);
    }

    if (fullName.length < 2) {
      return json({ error: 'Valid admin name is required.' }, 400);
    }

    const phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.length < 10) {
      return json({ error: 'Valid phone number is required.' }, 400);
    }

    if (password.length < 8) {
      return json(
        { error: 'Password must contain at least 8 characters.' },
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

    const validation = await service.rpc(
      'validate_school_admin_setup',
      {
        p_school_id: schoolId,
        p_full_name: fullName,
        p_phone: phone,
        p_password: password,
      },
    );

    if (validation.error) {
      throw validation.error;
    }

    const email =
      `admin.${safeEmailPart(school.code)}.${phoneDigits}` +
      `@accounts.educonnect.app`;

    const {
      data: created,
      error: createError,
    } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        account_type: 'SCHOOL_ADMIN',
        school_id: schoolId,
      },
    });

    if (createError) {
      throw createError;
    }

    if (!created.user) {
      throw new Error('Auth user creation failed.');
    }

    createdUserId = created.user.id;

    const { error: profileError } =
      await service
        .from('profiles')
        .insert({
          id: createdUserId,
          school_id: schoolId,
          role: 'ADMIN',
          full_name: fullName,
          phone,
          auth_email: email,
          is_active: true,
        });

    if (profileError) {
      throw profileError;
    }

    const { error: adminError } =
      await service
        .from('school_admins')
        .insert({
          school_id: schoolId,
          profile_id: createdUserId,
          is_primary: true,
        });

    if (adminError) {
      throw adminError;
    }

    await service.rpc(
      'initialize_school_settings',
      {
        p_school_id: schoolId,
      },
    );

    return json({
      ok: true,
      user_id: createdUserId,
      school_id: schoolId,
      role: 'ADMIN',
    });
  } catch (error) {
    if (createdUserId) {
      try {
        const service = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        );

        await service.auth.admin.deleteUser(
          createdUserId,
        );
      } catch {
        // Cleanup is best-effort.
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
