export type ProcessingStatus = "pending" | "processing" | "ready" | "failed"

export type PipelineStage = "scanning" | "ocr" | "text_extraction" | "indexing"

export type DocumentProcessingState = {
  status: ProcessingStatus
  current_stage: PipelineStage | null
  completed_stages: PipelineStage[]
  failed_stage: PipelineStage | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
}

export type Document = {
  id: string
  user_id: string
  title: string
  file_path: string
  file_size: number | null
  tags: string[]
  thumbnail_url: string | null
  processing: DocumentProcessingState
  created_at: string
  updated_at: string
}

export type DocumentContent = {
  document_id: string
  extracted_text: string | null
  ocr_text: string | null
  word_count: number
  page_count: number
}

export type DocumentSearchResult = {
  document: Document
  matched_field: "title" | "tags" | "content"
  snippet: string | null
  highlights: string[]
}
