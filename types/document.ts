export type Document = {
  id: string
  user_id: string
  title: string
  file_path: string
  file_size: number | null
  tags: string[]
  created_at: string
  updated_at: string
}
