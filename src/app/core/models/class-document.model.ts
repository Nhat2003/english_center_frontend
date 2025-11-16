export interface ClassDocument {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt: string;
  classId: number;
  uploadedBy?: string;
}

export interface UploadDocumentRequest {
  classId: number;
  file: File;
}

export interface UpdateDocumentRequest {
  id: number;
  file: File;
}
