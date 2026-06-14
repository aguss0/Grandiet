// src/services/reporteService.js
import api from "./api";

export const reporteService = {
  resumen: async () => {
    const { data } = await api.get("/reportes/resumen");
    return data;
  },
  ventas: async (params = {}) => {
    const { data } = await api.get("/reportes/ventas", { params });
    return data;
  },
  ranking: async (params = {}) => {
    const { data } = await api.get("/reportes/ranking", { params });
    return data;
  },
  ganancias: async (params = {}) => {
    const { data } = await api.get("/reportes/ganancias", { params });
    return data;
  },
  alertas: async () => {
    const { data } = await api.get("/reportes/alertas");
    return data;
  },
};

export const categoriaService = {
  listar: async () => {
    const { data } = await api.get("/categorias");
    return data;
  },
};