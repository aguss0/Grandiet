// src/pages/stock/Stock.js
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { stockService } from "../../services/stockService";
import { productoService } from "../../services/productoService";

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-AR");
}

export function Stock() {
  const [items, setItems]           = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad]     = useState(1);
  const [precio, setPrecio]         = useState("");
  const [obs, setObs]               = useState("");
  const [fecha, setFecha]           = useState(new Date().toISOString().split("T")[0]);
  const [ingresoOk, setIngresoOk]   = useState(null);
  const queryClient = useQueryClient();

  const { data: productos } = useQuery({
    queryKey: ["productos", { activo: true }],
    queryFn:  () => productoService.listar({ activo: true }),
  });

  const producto = productos?.find(p => p.id === Number(productoId));

  // Totales
  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);
  const totalCosto    = items.reduce((s, i) => s + (i.precio * i.cantidad), 0);

  const agregarItem = (e) => {
    e.preventDefault();
    if (!producto) return toast.error("Seleccioná un producto");
    if (cantidad < 1) return toast.error("La cantidad debe ser mayor a 0");

    const nuevoItem = {
      productoId:  producto.id,
      nombre:      producto.nombre,
      unidad:      producto.unidad,
      stockActual: producto.stockActual,
      cantidad:    Number(cantidad),
      precio:      precio ? Number(precio) : Number(producto.precioCompra),
      precioCustom: !!precio,
    };

    const existe = items.findIndex(i => i.productoId === producto.id);
    if (existe >= 0) {
      const nuevos = [...items];
      nuevos[existe].cantidad += Number(cantidad);
      setItems(nuevos);
      toast.success("Cantidad actualizada en el listado");
    } else {
      setItems([...items, nuevoItem]);
    }

    setProductoId("");
    setCantidad(1);
    setPrecio("");
  };

  const quitarItem = (productoId) => {
    setItems(items.filter(i => i.productoId !== productoId));
  };

  const editarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setItems(items.map(i =>
      i.productoId === productoId ? { ...i, cantidad: nuevaCantidad } : i
    ));
  };

  const { mutate: registrar, isLoading } = useMutation({
    mutationFn: () =>
      Promise.all(
        items.map(item =>
          stockService.ingreso({
            productoId:       item.productoId,
            cantidad:         item.cantidad,
            precioReferencia: item.precioCustom ? item.precio : undefined,
            observaciones:    obs || undefined,
          })
        )
      ),
    onSuccess: () => {
      toast.success(`Ingreso registrado — ${items.length} producto${items.length > 1 ? "s" : ""}`);
      setIngresoOk({ items: [...items], total: totalUnidades, costo: totalCosto });
      setItems([]);
      setObs("");
      queryClient.invalidateQueries(["productos"]);
      queryClient.invalidateQueries(["resumen"]);
      setTimeout(() => setIngresoOk(null), 8000);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Error al registrar el ingreso");
    },
  });

  const inputStyle = {
    width: "100%", padding: "8px 10px",
    border: "1px solid var(--border)", borderRadius: "var(--radius)",
    fontSize: 13, fontFamily: "inherit", background: "var(--card)",
  };

  return (
    <Layout titulo="Ingreso de stock">
      <div style={{ maxWidth: 660 }}>

        {/* ── Confirmación ── */}
        {ingresoOk && (
          <div style={{ background: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div style={{ fontWeight: 500, color: "var(--green-dark)" }}>Ingreso registrado correctamente</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 20 }}>
              <span>{ingresoOk.items.length} producto{ingresoOk.items.length > 1 ? "s" : ""}</span>
              <span>Total unidades: <strong>{ingresoOk.total}</strong></span>
              {ingresoOk.costo > 0 && <span>Costo total: <strong>{fmt(ingresoOk.costo)}</strong></span>}
            </div>
          </div>
        )}

        {/* ── Agregar producto ── */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Agregar producto</div>

          <form onSubmit={agregarItem}>
            {/* Fecha */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Fecha de ingreso</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                style={{ ...inputStyle, width: "auto" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Producto *</label>
              <select
                style={inputStyle}
                value={productoId}
                onChange={e => { setProductoId(e.target.value); setPrecio(""); setCantidad(1); }}
              >
                <option value="">— Seleccionar producto —</option>
                {/* Alertas de stock bajo primero */}
                {productos?.filter(p => p.stockActual <= p.stockMinimo).length > 0 && (
                  <optgroup label="⚠ Stock bajo">
                    {productos?.filter(p => p.stockActual <= p.stockMinimo).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (stock: {p.stockActual} — mín: {p.stockMinimo})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Todos los productos">
                  {productos?.filter(p => p.stockActual > p.stockMinimo).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (stock: {p.stockActual})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Info del producto */}
            {producto && (
              <div style={{ background: "#fdf0e4", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 12, display: "flex", gap: 20 }}>
                <span>Stock actual: <strong>{producto.stockActual} {producto.unidad}</strong></span>
                <span>P. compra actual: <strong>{fmt(producto.precioCompra)}</strong></span>
                {producto.stockActual <= producto.stockMinimo && (
                  <span style={{ color: "var(--danger)", fontWeight: 500 }}>⚠ Stock bajo mínimo</span>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Cantidad *</label>
                <input
                  type="number" min="1"
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                  Precio de compra <span style={{ fontWeight: 400, color: "var(--muted)" }}>(opcional)</span>
                </label>
                <input
                  type="number" min="0"
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  placeholder={producto ? fmt(producto.precioCompra) : "Actual"}
                  style={inputStyle}
                />
              </div>
              <Button type="submit" disabled={!productoId}>
                + Agregar
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Listado de items ── */}
        {items.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 14 }}>
              Productos a ingresar — {items.length} ítem{items.length > 1 ? "s" : ""}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Producto", "Stock actual", "Cant. a ingresar", "Stock resultante", "P. compra", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.productoId} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px" }}>
                      <div style={{ fontWeight: 500 }}>{item.nombre}</div>
                    </td>
                    <td style={{ padding: "8px", color: "var(--muted)" }}>
                      {item.stockActual} {item.unidad}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => editarCantidad(item.productoId, item.cantidad - 1)}
                          style={{ width: 22, height: 22, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >−</button>
                        <span style={{ minWidth: 28, textAlign: "center", fontWeight: 500, color: "var(--green)" }}>+{item.cantidad}</span>
                        <button
                          onClick={() => editarCantidad(item.productoId, item.cantidad + 1)}
                          style={{ width: 22, height: 22, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >+</button>
                      </div>
                    </td>
                    <td style={{ padding: "8px", fontWeight: 500, color: "var(--green)" }}>
                      {item.stockActual + item.cantidad} {item.unidad}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {item.precioCustom
                        ? <span style={{ color: "var(--orange)" }}>{fmt(item.precio)} <span style={{ fontSize: 10 }}>(nuevo)</span></span>
                        : <span style={{ color: "var(--muted)" }}>{fmt(item.precio)}</span>
                      }
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button
                        onClick={() => quitarItem(item.productoId)}
                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 16 }}
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resumen */}
            <div style={{ borderTop: "2px solid var(--border)", marginTop: 8, paddingTop: 10 }}>
              <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>
                  Total unidades a ingresar: <strong style={{ color: "var(--green)" }}>+{totalUnidades}</strong>
                </span>
                {totalCosto > 0 && (
                  <span style={{ color: "var(--muted)" }}>
                    Costo total estimado: <strong>{fmt(totalCosto)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Observaciones y confirmar */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                Observaciones <span style={{ fontWeight: 400 }}>(proveedor, factura, etc.)</span>
              </label>
              <input
                style={{ ...inputStyle, marginBottom: 12 }}
                placeholder="Ej: Factura #001234 — Proveedor NaturVida"
                value={obs}
                onChange={e => setObs(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button variant="ghost" onClick={() => setItems([])}>Limpiar</Button>
                <Button loading={isLoading} onClick={() => registrar()}>
                  🚚 Confirmar ingreso ({items.length} producto{items.length > 1 ? "s" : ""})
                </Button>
              </div>
            </div>
          </Card>
        )}

        {items.length === 0 && !ingresoOk && (
          <div style={{ textAlign: "center", padding: 32, color: "var(--muted)", fontSize: 13 }}>
            Agregá productos para registrar el ingreso de mercadería
          </div>
        )}

      </div>
    </Layout>
  );
}