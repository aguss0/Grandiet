// src/services/ventaService.js
import api from "./api";

export const ventaService = {
  listar: async (params = {}) => {
    const { data } = await api.get("/ventas", { params });
    return data;
  },
  registrar: async (body) => {
    const { data } = await api.post("/ventas", body);
    return data;
  },
};