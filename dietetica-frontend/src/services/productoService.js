// src/services/productoService.js
import api from "./api";

export const productoService = {
  listar: async (params = {}) => {
    const { data } = await api.get("/productos", { params });
    return data;
  },
  obtener: async (id) => {
    const { data } = await api.get(`/productos/${id}`);
    return data;
  },
  crear: async (body) => {
    const { data } = await api.post("/productos", body);
    return data;
  },
  editar: async (id, body) => {
    const { data } = await api.patch(`/productos/${id}`, body);
    return data;
  },
  desactivar: async (id) => {
    const { data } = await api.delete(`/productos/${id}`);
    return data;
  },
};