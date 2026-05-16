export type Note = {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
  tags: string[]
  linked_book_id?: string | null
  linked_contact_id?: string | null
}