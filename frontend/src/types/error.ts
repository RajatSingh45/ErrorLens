export interface ErrorData{
  id:number,
  error_text: string;
  analysis?: string;
  fix_suggestion?: string;
  created_at: string;
  status: string;
  retry_count?: number;
  service?: string;
  stack?:string;
  occurrence_count: number;
}