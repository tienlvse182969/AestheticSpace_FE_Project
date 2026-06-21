import api from "./api";
import type { ApiResponse } from "../types/api.types";

export interface CreateReportRequest {
  title: string;
  content: string;
  type: string;
  attachmentUrl?: string;
  attachmentBase64?: string;
}

export interface ReportResponseDto {
  id: string;
  title: string;
  content: string;
  type: string;
  attachmentUrl?: string;
  status: string;
  createdAt: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const reportService = {
  submit: async (
    type: "feedback" | "bug",
    content: string,
    attachmentFile?: File,
  ): Promise<ReportResponseDto> => {
    const title = type === "feedback" ? "User Feedback" : "Bug Report";

    const body: CreateReportRequest = {
      title,
      content,
      type: type === "feedback" ? "Feedback" : "Bug",
    };

    if (attachmentFile) {
      body.attachmentBase64 = await fileToBase64(attachmentFile);
    }

    const { data } = await api.post<ApiResponse<ReportResponseDto>>("/reports", body);
    return data.data;
  },
};
