// src/pages/auth/Login.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)",
    }}>
      <div style={{
        background: "var(--card)", borderRadius: 12,
        padding: "40px 36px", width: "100%", maxWidth: 380,
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,.08)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, background: "var(--green)",
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28, margin: "0 auto 12px",
          }}>
            🌿
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>NaturaSur</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Sistema de gestión interno
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div style={{
              background: "#fee2e2", color: "var(--danger)",
              padding: "8px 12px", borderRadius: 6,
              fontSize: 13, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            Ingresar
          </Button>
        </form>

        <div style={{ marginTop: 20, padding: "12px", background: "var(--bg)", borderRadius: 6, fontSize: 12, color: "var(--muted)" }}>
          <strong>Admin:</strong> admin@dietetica.com / admin123<br />
          <strong>Empleado:</strong> laura@dietetica.com / empleado123
        </div>
      </div>
    </div>
  );
}