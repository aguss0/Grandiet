// src/services/authService.js
import api from "./api";

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};