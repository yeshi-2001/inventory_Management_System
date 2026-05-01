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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-3xl">📦</p>
          <h1 className="text-xl font-bold text-gray-800 mt-1">Inventory WMS</h1>
          <p className="text-xs text-gray-400">Warehouse Management System</p>
        </div>

        {/* Role tabs */}
        <div className="flex rounded-lg overflow-hidden border mb-6">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium transition ${
                role === r ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
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
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {role === "Vendor" && (
          <p className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Register as a vendor</Link>
          </p>
        )}

        <p className="text-center text-xs text-gray-400 mt-3">
          <Link to="/register" className="hover:underline">← Back to registration page</Link>
        </p>
      </div>
    </div>
  );
}
