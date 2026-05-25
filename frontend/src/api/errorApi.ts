import type { ErrorData } from "../types/error";
import api from "./axios";

export const getErrors = async (
  projectId?: number
): Promise<ErrorData[]> => {
  const url = projectId
    ? `/errors?projectId=${projectId}`
    : "/errors";

  const response = await api.get(url);

  return response.data.data;
};

export const deleteError = async (errorId: number) => {
  const response = await api.delete(`/errors/${errorId}`);
  return response.data;
};