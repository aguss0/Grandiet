// src/pages/ventas/Ventas.js
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ventaService } from "../../services/ventaService";
import { productoService } from "../../services/productoService";

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-AR");
}

export function Ventas() {
  const [items, setItems]           = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad]     = useState(1);
  const [pvCustom, setPvCustom]     = useState("");
  const [obs, setObs]               = useState("");
  const [ventaOk, setVentaOk]       = useState(null);
  const queryClient = useQueryClient();

  const { data: productos } = useQuery({
    queryKey: ["productos", { activo: true }],
    queryFn:  () => productoService.listar({ activo: true }),
  });

  const producto = productos?.find(p => p.id === Number(productoId));
  const pv       = pvCustom ? Number(pvCustom) : Number(producto?.precioVenta || 0);
  const pc       = Number(producto?.precioCompra || 0);

  // Stock disponible considerando lo ya agregado al carrito
  const yaEnCarrito   = items.find(i => i.productoId === Number(productoId));
  const stockDisponible = producto
    ? producto.stockActual - (yaEnCarrito?.cantidad || 0)
    : 0;
  const stockOk = producto && stockDisponible >= Number(cantidad);

  // Totales del carrito
  const totalVenta    = items.reduce((s, i) => s + i.subtotal, 0);
  const totalGanancia = items.reduce((s, i) => s + i.ganancia, 0);

  const agregarItem = (e) => {
    e.preventDefault();
    if (!producto)  return toast.error("Seleccioná un producto");
    if (!stockOk)   return toast.error("Stock insuficiente");

    const nuevoItem = {
      productoId:  producto.id,
      nombre:      producto.nombre,
      unidad:      producto.unidad,
      stockActual: producto.stockActual,
      cantidad:    Number(cantidad),
      precioVenta: pv,
      precioCompra: pc,
      pvCustom:    !!pvCustom,
      subtotal:    pv * Number(cantidad),
      ganancia:    (pv - pc) * Number(cantidad),
    };

    // Si el producto ya está en el carrito, actualizar cantidad
    const existe = items.findIndex(i => i.productoId === producto.id);
    if (existe >= 0) {
      const nuevos = [...items];
      nuevos[existe].cantidad    += Number(cantidad);
      nuevos[existe].subtotal    += nuevoItem.subtotal;
      nuevos[existe].ganancia    += nuevoItem.ganancia;
      setItems(nuevos);
    } else {
      setItems([...items, nuevoItem]);
    }

    // Resetear selector
    setProductoId("");
    setCantidad(1);
    setPvCustom("");
  };

  const quitarItem = (productoId) => {
    setItems(items.filter(i => i.productoId !== productoId));
  };

  const editarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    const prod = productos?.find(p => p.id === productoId);
    if (prod && nuevaCantidad > prod.stockActual) {
      return toast.error(`Stock máximo: ${prod.stockActual}`);
    }
    setItems(items.map(i => {
      if (i.productoId !== productoId) return i;
      return {
        ...i,
        cantidad: nuevaCantidad,
        subtotal: i.precioVenta * nuevaCantidad,
        ganancia: (i.precioVenta - i.precioCompra) * nuevaCantidad,
      };
    }));
  };

  const { mutate: registrar, isLoading } = useMutation({
    mutationFn: () =>
      // Registrar cada item como venta individual (el backend maneja transacciones por producto)
      Promise.all(
        items.map(item =>
          ventaService.registrar({
            productoId:   item.productoId,
            cantidad:     item.cantidad,
            precioVenta:  item.pvCustom ? item.precioVenta : undefined,
            observaciones: obs || undefined,
          })
        )
      ),
    onSuccess: () => {
      toast.success(`Venta registrada — ${items.length} producto${items.length > 1 ? "s" : ""}`);
      setVentaOk({ items: [...items], total: totalVenta, ganancia: totalGanancia });
      setItems([]);
      setObs("");
      queryClient.invalidateQueries(["productos"]);
      queryClient.invalidateQueries(["resumen"]);
      setTimeout(() => setVentaOk(null), 8000);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Error al registrar la venta");
    },
  });

  const inputStyle = {
    width: "100%", padding: "8px 10px",
    border: "1px solid var(--border)", borderRadius: "var(--radius)",
    fontSize: 13, fontFamily: "inherit", background: "var(--card)",
  };

  return (
    <Layout titulo="Registrar venta">
      <div style={{ maxWidth: 660 }}>

        {/* ── Confirmación ── */}
        {ventaOk && (
          <div style={{ background: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div style={{ fontWeight: 500, color: "var(--green-dark)" }}>Venta registrada correctamente</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 20 }}>
              <span>{ventaOk.items.length} producto{ventaOk.items.length > 1 ? "s" : ""}</span>
              <span>Total: <strong>{fmt(ventaOk.total)}</strong></span>
              <span>Ganancia: <strong style={{ color: "var(--green)" }}>{fmt(ventaOk.ganancia)}</strong></span>
            </div>
          </div>
        )}

        {/* ── Agregar producto al carrito ── */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Agregar producto</div>

          <form onSubmit={agregarItem}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Producto *</label>
              <select
                style={inputStyle}
                value={productoId}
                onChange={e => { setProductoId(e.target.value); setPvCustom(""); setCantidad(1); }}
              >
                <option value="">— Seleccionar producto —</option>
                {productos?.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stockActual === 0}>
                    {p.nombre} {p.stockActual === 0 ? "(sin stock)" : `(stock: ${p.stockActual})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Info rápida del producto */}
            {producto && (
              <div style={{ background: "var(--green-light)", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 12, display: "flex", gap: 20 }}>
                <span>Stock: <strong style={{ color: stockDisponible <= 0 ? "var(--danger)" : "var(--green)" }}>{stockDisponible} {producto.unidad}</strong></span>
                <span>Precio: <strong>{fmt(producto.precioVenta)}</strong></span>
                <span>Ganancia unit.: <strong style={{ color: "var(--green)" }}>{fmt(Number(producto.precioVenta) - Number(producto.precioCompra))}</strong></span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Cantidad *</label>
                <input
                  type="number" min="1"
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                  style={{ ...inputStyle, borderColor: !stockOk && producto ? "var(--danger)" : "var(--border)" }}
                />
                {!stockOk && producto && (
                  <span style={{ fontSize: 11, color: "var(--danger)" }}>Máximo: {stockDisponible}</span>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Precio personalizado</label>
                <input
                  type="number" min="0"
                  value={pvCustom}
                  onChange={e => setPvCustom(e.target.value)}
                  placeholder={producto ? fmt(producto.precioVenta) : "Automático"}
                  style={inputStyle}
                />
              </div>
              <Button type="submit" disabled={!stockOk || !productoId}>
                + Agregar
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Carrito ── */}
        {items.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 14 }}>
              Carrito — {items.length} producto{items.length > 1 ? "s" : ""}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Producto", "Cant.", "Precio unit.", "Subtotal", "Ganancia", ""].map(h => (
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
                    <td style={{ padding: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => editarCantidad(item.productoId, item.cantidad - 1)}
                          style={{ width: 22, height: 22, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >−</button>
                        <span style={{ minWidth: 24, textAlign: "center" }}>{item.cantidad}</span>
                        <button
                          onClick={() => editarCantidad(item.productoId, item.cantidad + 1)}
                          style={{ width: 22, height: 22, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >+</button>
                      </div>
                    </td>
                    <td style={{ padding: "8px" }}>{fmt(item.precioVenta)}</td>
                    <td style={{ padding: "8px", fontWeight: 500 }}>{fmt(item.subtotal)}</td>
                    <td style={{ padding: "8px", color: "var(--green)", fontWeight: 500 }}>{fmt(item.ganancia)}</td>
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

            {/* Totales */}
            <div style={{ borderTop: "2px solid var(--border)", marginTop: 8, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Total venta:</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: "var(--green)" }}>{fmt(totalVenta)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>Ganancia estimada:</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--green-dark)" }}>{fmt(totalGanancia)}</span>
              </div>
            </div>

            {/* Observaciones y confirmar */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Observaciones</label>
              <input
                style={{ ...inputStyle, marginBottom: 12 }}
                placeholder="Opcional…"
                value={obs}
                onChange={e => setObs(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button variant="ghost" onClick={() => setItems([])}>Vaciar carrito</Button>
                <Button variant="orange" loading={isLoading} onClick={() => registrar()}>
                  ✓ Confirmar venta ({items.length} producto{items.length > 1 ? "s" : ""})
                </Button>
              </div>
            </div>
          </Card>
        )}

        {items.length === 0 && !ventaOk && (
          <div style={{ textAlign: "center", padding: 32, color: "var(--muted)", fontSize: 13 }}>
            Agregá productos al carrito para registrar la venta
          </div>
        )}

      </div>
    </Layout>
  );
}