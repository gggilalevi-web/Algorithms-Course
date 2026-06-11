export type UserRole = 'student' | 'admin'
export type LessonType = 'lesson' | 'qa'

export interface Topic {
  id: string
  name: string
  description: string | null
  price: number
  order_index: number
  created_at: string
}

export interface Section {
  id: string
  topic_id: string
  name: string
  order_index: number
  created_at: string
}

export interface Lesson {
  id: string
  topic_id: string
  section_id: string | null
  type: LessonType
  title: string
  video_url: string | null
  intro_text: string | null
  image_url: string | null
  order_index: number
  created_at: string
}

export interface PDF {
  id: string
  topic_id: string
  name: string
  storage_path: string
  created_at: string
}

export interface Profile {
  id: string
  name: string | null
  role: UserRole
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  topic_id: string | null
  is_full_course: boolean
  created_at: string
}
