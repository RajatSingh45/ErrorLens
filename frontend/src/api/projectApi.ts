import api from "./axios";

export const getProjects = async () => {
  const response = await api.get("/project");

  return response.data.data;
};

export const createProject = async (name: string) => {
  const response = await api.post("/project", {
    name,
  });

  return response.data.data;
};

export const deleteProject = async (projectId: number) => {
  const response = await api.delete(`/project/${projectId}`);
  return response.data;
};