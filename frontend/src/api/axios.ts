import axios from "axios";

const api = axios.create({
 baseURL: import.meta.env.VITE_API_URL,
 withCredentials: true, // This sends cookies with every request
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

export default api;