export interface GeneratePdfJobData {
  userId: number;
  startDate?: Date | string;
  endDate?: Date | string;
  reportId: string; // Unique ID for this report
}

export interface PdfJobResult {
  reportId: string;
  filePath: string;
  generatedAt: Date;
}
