import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ROLES = ["Admin", "Employee", "Vendor"];

export default function LoginPage() {
  const [role,     setRole]     = useState("Admin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password, role.toLowerCase());
      if (user.role === "vendor")   navigate("/vendor/portal");
      else if (user.role === "admin")    navigate("/");
      else navigate("/billing");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mt-1" style={{ color: "var(--color-navy)" }}>Inventory WMS</h1>
          <p className="text-xs text-gray-400">Warehouse Management System</p>
        </div>

        {/* Role tabs */}
        <div className="flex rounded-lg overflow-hidden border mb-6" style={{ borderColor: "var(--color-border)" }}>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setError(""); }}
              className="flex-1 py-2 text-sm font-medium transition"
              style={role === r
                ? { background: "var(--color-navy)", color: "#fff" }
                : { background: "#fff", color: "var(--color-ocean)" }
              }
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: "var(--color-border)", outlineColor: "var(--color-teal)" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none"
                style={{ borderColor: "var(--color-border)" }}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--color-ocean)" }}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "var(--color-navy)" }}
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {role === "Vendor" && (
          <p className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium hover:underline" style={{ color: "var(--color-ocean)" }}>Register as a vendor</Link>
          </p>
        )}

        <p className="text-center text-xs text-gray-400 mt-3">
          <Link to="/register" className="hover:underline" style={{ color: "var(--color-ocean)" }}>Back to registration page</Link>
        </p>
      </div>
    </div>
  );
}
