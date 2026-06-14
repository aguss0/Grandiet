// src/pages/productos/Productos.js
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Select } from "../../components/ui/Input";
import { productoService } from "../../services/productoService";
import { categoriaService } from "../../services/reporteService";

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-AR");
}

function calcMargen(pc, pv) {
  if (!pv || pv == 0) return 0;
  return Math.round(((pv - pc) / pv) * 100);
}

// ── Modal Nuevo/Editar Producto ──────────────────────────────
function ModalProducto({ producto, categorias, onClose, onGuardado }) {
  const esEdicion = !!producto;
  const [form, setForm] = useState({
    nombre:       producto?.nombre       || "",
    categoriaId:  producto?.categoriaId  || "",
    marca:        producto?.marca        || "",
    descripcion:  producto?.descripcion  || "",
    precioCompra: producto?.precioCompra || "",
    precioVenta:  producto?.precioVenta  || "",
    stockActual:  producto?.stockActual  || 0,
    stockMinimo:  producto?.stockMinimo  || 0,
    unidad:       producto?.unidad       || "unidades",
  });

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (esEdicion) {
        await productoService.editar(producto.id, form);
        toast.success("Producto actualizado");
      } else {
        await productoService.crear(form);
        toast.success("Producto creado");
      }
      onGuardado();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
  };
  const modal = {
    background: "var(--card)", borderRadius: 12, padding: 24,
    width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
  };
  const row = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{esEdicion ? "Editar producto" : "Nuevo producto"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={row}>
            <Input label="Nombre *" value={form.nombre} onChange={set("nombre")} required />
            <Input label="Marca" value={form.marca} onChange={set("marca")} />
          </div>
          <div style={row}>
            <Select label="Categoría *" value={form.categoriaId} onChange={set("categoriaId")} required>
              <option value="">— Seleccionar —</option>
              {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
            <Select label="Unidad" value={form.unidad} onChange={set("unidad")}>
              <option value="unidades">Unidades</option>
              <option value="kg">Kilogramos</option>
              <option value="g">Gramos</option>
              <option value="litros">Litros</option>
              <option value="ml">Mililitros</option>
            </Select>
          </div>
          <div style={row}>
            <Input label="Precio compra *" type="number" value={form.precioCompra} onChange={set("precioCompra")} min="0" required />
            <Input label="Precio venta *"  type="number" value={form.precioVenta}  onChange={set("precioVenta")}  min="0" required />
          </div>
          <div style={row}>
            <Input label="Stock inicial" type="number" value={form.stockActual} onChange={set("stockActual")} min="0" />
            <Input label="Stock mínimo"  type="number" value={form.stockMinimo} onChange={set("stockMinimo")} min="0" />
          </div>
          <Input label="Descripción" value={form.descripcion} onChange={set("descripcion")} />

          {/* Preview margen */}
          {form.precioCompra && form.precioVenta && (
            <div style={{ background: "var(--green-light)", borderRadius: 6, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
              Margen estimado: <strong style={{ color: "var(--green)" }}>{calcMargen(form.precioCompra, form.precioVenta)}%</strong>
              {" · "}Ganancia unit.: <strong style={{ color: "var(--green)" }}>{fmt(form.precioVenta - form.precioCompra)}</strong>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar producto</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Pantalla principal ───────────────────────────────────────
export function Productos() {
  const [buscar, setBuscar]           = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [modalAbierto, setModalAbierto]   = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const queryClient = useQueryClient();

  const params = {};
  if (buscar)       params.buscar      = buscar;
  if (categoriaId)  params.categoriaId = categoriaId;
  if (soloStockBajo) params.stockBajo  = true;

  const { data: productos, isLoading } = useQuery({
    queryKey: ["productos", params],
    queryFn:  () => productoService.listar(params),
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn:  categoriaService.listar,
  });

  const { mutate: desactivar } = useMutation({
    mutationFn: (id) => productoService.desactivar(id),
    onSuccess: () => {
      toast.success("Producto desactivado");
      queryClient.invalidateQueries(["productos"]);
    },
    onError: () => toast.error("Error al desactivar"),
  });

  const onGuardado = () => queryClient.invalidateQueries(["productos"]);

  const abrirNuevo  = () => { setProductoEditar(null); setModalAbierto(true); };
  const abrirEditar = (p) => { setProductoEditar(p);   setModalAbierto(true); };
  const cerrar      = () => { setModalAbierto(false);  setProductoEditar(null); };

  return (
    <Layout titulo="Gestión de productos">

      {/* ── Barra de búsqueda y filtros ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "inherit" }}
          placeholder="Buscar por nombre, marca…"
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <select
          style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "inherit", background: "var(--card)" }}
          value={categoriaId}
          onChange={e => setCategoriaId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={soloStockBajo} onChange={e => setSoloStockBajo(e.target.checked)} />
          Solo stock bajo
        </label>
        <Button onClick={abrirNuevo}>+ Nuevo producto</Button>
      </div>

      {/* ── Tabla ── */}
      <Card style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Producto", "Categoría", "Stock", "P. Compra", "P. Venta", "Margen", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "2px solid var(--border)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Cargando productos…</td></tr>
              )}
              {!isLoading && productos?.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No se encontraron productos</td></tr>
              )}
              {productos?.map(p => {
                const pct  = Math.min(100, Math.round((p.stockActual / Math.max(p.stockMinimo * 2, 1)) * 100));
                const bajo = p.stockActual <= p.stockMinimo;
                const mg   = calcMargen(p.precioCompra, p.precioVenta);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.marca}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Badge color="green">{p.categoria?.nombre}</Badge>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 500, color: bajo ? "var(--danger)" : "var(--text)" }}>
                        {p.stockActual} {p.unidad}
                      </div>
                      <div style={{ width: 70, height: 5, background: "#e5e7eb", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                        <div style={{ width: pct + "%", height: "100%", borderRadius: 3, background: bajo ? "var(--danger)" : pct < 50 ? "var(--warn)" : "var(--green)" }} />
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>{fmt(p.precioCompra)}</td>
                    <td style={{ padding: "10px 12px" }}>{fmt(p.precioVenta)}</td>
                    <td style={{ padding: "10px 12px", color: "var(--green)", fontWeight: 500 }}>{mg}%</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Badge color={p.activo ? "green" : "gray"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Button size="sm" variant="ghost" onClick={() => abrirEditar(p)}>Editar</Button>
                        {p.activo && (
                          <Button size="sm" variant="ghost"
                            style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                            onClick={() => { if (window.confirm("¿Desactivar este producto?")) desactivar(p.id); }}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modal ── */}
      {modalAbierto && (
        <ModalProducto
          producto={productoEditar}
          categorias={categorias}
          onClose={cerrar}
          onGuardado={onGuardado}
        />
      )}
    </Layout>
  );
}