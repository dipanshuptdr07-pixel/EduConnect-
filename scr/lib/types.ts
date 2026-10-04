export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Profile {
  id: string;
  school_id: string;
  role: Role;
  full_name: string;
  phone: string;
  avatar_url?: string | null;
  is_active: boolean;
}

export interface School {
  id: string;
  code: string;
  name: string;
  logo_url?: string | null;
  address?: string | null;
  contact_phone?: string | null;
  academic_year?: string | null;
}

export interface ClassRoom {
  id: string;
  school_id: string;
  name: string;
  grade: string;
}

export interface Section {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code?: string | null;
}

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  attachment_url?: string | null;
  status?: string;
}

export interface Notice {
  id: string;
  school_id: string;
  author_id: string;
  title: string;
  body: string;
  priority: Priority;
  publish_at: string;
  target_role?: Role | null;
  target_class_id?: string | null;
  target_section_id?: string | null;
  attachment_url?: string | null;
}

export interface Notification {
  id: string;
  school_id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Exam {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room?: string | null;
  notes?: string | null;
}

export interface Result {
  id: string;
  school_id: string;
  student_id: string;
  exam_id: string;
  subject_id: string;
  marks: number;
  max_marks: number;
  grade?: string | null;
  comments?: string | null;
  published: boolean;
}

export interface Fee {
  id: string;
  school_id: string;
  student_id: string;
  category: string;
  amount: number;
  due_date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  receipt_ref?: string | null;
}

export interface LeaveRequest {
  id: string;
  school_id: string;
  student_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: string | null;
}

export interface EventItem {
  id: string;
  school_id: string;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  image_url?: string | null;
}

export interface Ptm {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  teacher_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  instructions?: string | null;
}
