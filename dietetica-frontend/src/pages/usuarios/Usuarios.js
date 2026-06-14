// src/pages/usuarios/Usuarios.js
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Select } from "../../components/ui/Input";
import api from "../../services/api";

const usuarioService = {
  listar:  async () => { const { data } = await api.get("/usuarios");          return data; },
  crear:   async (b) => { const { data } = await api.post("/usuarios", b);      return data; },
  editar:  async (id, b) => { const { data } = await api.patch(`/usuarios/${id}`, b); return data; },
};

function fmtFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function ModalUsuario({ usuario, onClose, onGuardado }) {
  const esEdicion = !!usuario;
  const [form, setForm] = useState({
    nombre:   usuario?.nombre || "",
    email:    usuario?.email  || "",
    password: "",
    rolId:    usuario?.rol?.id || 2,
  });

  const set = campo => e => setForm(f => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (esEdicion) {
        const data = { nombre: form.nombre, rolId: Number(form.rolId) };
        await usuarioService.editar(usuario.id, data);
        toast.success("Usuario actualizado");
      } else {
        await usuarioService.crear({ ...form, rolId: Number(form.rolId) });
        toast.success("Usuario creado");
      }
      onGuardado();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: 24, width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{esEdicion ? "Editar usuario" : "Nuevo usuario"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <Input label="Nombre *" value={form.nombre} onChange={set("nombre")} required />
          {!esEdicion && <Input label="Email *" type="email" value={form.email} onChange={set("email")} required />}
          {!esEdicion && (
            <Input label="Contraseña *" type="password" value={form.password} onChange={set("password")}
              placeholder="Mínimo 6 caracteres" required minLength={6} />
          )}
          <Select label="Rol *" value={form.rolId} onChange={set("rolId")}>
            <option value={2}>Empleado</option>
            <option value={1}>Administrador</option>
          </Select>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Usuarios() {
  const [modal, setModal]   = useState(false);
  const [editando, setEditando] = useState(null);
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn:  usuarioService.listar,
  });

  const { mutate: toggleActivo } = useMutation({
    mutationFn: ({ id, activo }) => usuarioService.editar(id, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries(["usuarios"]);
      toast.success("Usuario actualizado");
    },
  });

  const onGuardado = () => queryClient.invalidateQueries(["usuarios"]);
  const abrirNuevo  = () => { setEditando(null); setModal(true); };
  const abrirEditar = (u) => { setEditando(u);   setModal(true); };
  const cerrar      = () => { setModal(false);   setEditando(null); };

  return (
    <Layout titulo="Gestión de usuarios">
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={abrirNuevo}>+ Nuevo usuario</Button>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Usuario", "Rol", "Creado", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, color: "var(--muted)", borderBottom: "2px solid var(--border)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Cargando…</td></tr>
              )}
              {usuarios?.map(u => {
                const iniciales = u.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.rol?.nombre === "administrador" ? "var(--orange)" : "var(--green-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff", flexShrink: 0 }}>
                          {iniciales}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.nombre}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={u.rol?.nombre === "administrador" ? "orange" : "green"}>
                        {u.rol?.nombre === "administrador" ? "Administrador" : "Empleado"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 12 }}>
                      {fmtFecha(u.creadoEn)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={u.activo ? "green" : "gray"}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => abrirEditar(u)}>Editar</Button>
                        <Button
                          size="sm" variant="ghost"
                          style={{ color: u.activo ? "var(--danger)" : "var(--green)", borderColor: u.activo ? "var(--danger)" : "var(--green)" }}
                          onClick={() => {
                            if (window.confirm(`¿${u.activo ? "Suspender" : "Activar"} a ${u.nombre}?`)) {
                              toggleActivo({ id: u.id, activo: !u.activo });
                            }
                          }}
                        >
                          {u.activo ? "Suspender" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && <ModalUsuario usuario={editando} onClose={cerrar} onGuardado={onGuardado} />}
    </Layout>
  );
}