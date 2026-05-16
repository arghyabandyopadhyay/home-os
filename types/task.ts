export type Task = {
  id: string
  title: string
  completed: boolean
  due_date: string | null
  created_at: string
  priority: 'low' | 'medium' | 'high' | null
  updated_at: string
}