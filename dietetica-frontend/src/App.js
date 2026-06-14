// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import { Login }      from "./pages/auth/Login";
import { Dashboard }  from "./pages/reportes/Dashboard";
import { Productos }  from "./pages/productos/Productos";
import { Ventas }     from "./pages/ventas/Ventas";
import { Stock }      from "./pages/stock/Stock";
import { Reportes }   from "./pages/reportes/Reportes";
import { Movimientos } from "./pages/stock/Movimientos";
import { Usuarios }   from "./pages/usuarios/Usuarios";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
}

function RutaAdmin({ children }) {
  const { esAdmin } = useAuth();
  return esAdmin ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"            element={<RutaProtegida><Dashboard /></RutaProtegida>} />
      <Route path="/productos"   element={<RutaProtegida><Productos /></RutaProtegida>} />
      <Route path="/ventas"      element={<RutaProtegida><Ventas /></RutaProtegida>} />
      <Route path="/stock"       element={<RutaProtegida><Stock /></RutaProtegida>} />
      <Route path="/reportes"    element={<RutaProtegida><RutaAdmin><Reportes /></RutaAdmin></RutaProtegida>} />
      <Route path="/movimientos" element={<RutaProtegida><RutaAdmin><Movimientos /></RutaAdmin></RutaProtegida>} />
      <Route path="/usuarios"    element={<RutaProtegida><RutaAdmin><Usuarios /></RutaAdmin></RutaProtegida>} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}