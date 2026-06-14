// src/services/stockService.js
import api from "./api";

export const stockService = {
  movimientos: async (params = {}) => {
    const { data } = await api.get("/stock/movimientos", { params });
    return data;
  },
  ingreso: async (body) => {
    const { data } = await api.post("/stock/ingresos", body);
    return data;
  },
  ajuste: async (body) => {
    const { data } = await api.post("/stock/ajuste", body);
    return data;
  },
};