import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { Spinner } from "../components/UI";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";

const BASE = process.env.REACT_APP_API_URL;
const authFetch = (path, opts = {}) => {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  }).then((r) => r.json());
};

const ROLE_BADGE = { admin: "bg-purple-100 text-purple-700", employee: "bg-blue-100 text-blue-700" };

function AddUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "employee" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await authFetch("/admin/users", { method: "POST", body: JSON.stringify(form) });
    setSaving(false);
    if (res.success) { toast.success("User created"); onSaved(); }
    else toast.error(res.error);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold mb-4">Add User</h2>
        <form onSubmit={save} className="space-y-3">
          {[["fullName","Full Name"],["email","Email"],["password","Password"]].map(([k,l]) => (
            <div key={k}>
              <label className="text-xs text-gray-500">{l}</label>
              <input type={k === "password" ? "password" : k === "email" ? "email" : "text"}
                value={form[k]} onChange={e => set(k, e.target.value)} required
                className="mt-0.5 w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500">Role</label>
            <select value={form.role} onChange={e => set("role", e.target.value)} className="mt-0.5 w-full border rounded px-2 py-1.5 text-sm bg-white">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const { data: users, loading, reload } = useFetch(() => authFetch("/admin/users").then(r => r.data));
  const [showModal, setShowModal] = useState(false);

  const toggleActive = async (u) => {
    if (u.id === me.id) { toast.error("You cannot deactivate your own account"); return; }
    const res = await authFetch(`/admin/users/${u.id}`, { method: "PUT", body: JSON.stringify({ isActive: !u.isActive }) });
    if (res.success) { toast.success(u.isActive ? "User deactivated" : "User reactivated"); reload(); }
    else toast.error(res.error);
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">User Management</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">+ Add User</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{["Name","Email","Role","Status","Last Login","Actions"].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(users || []).map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{u.fullName} {u.id === me.id && <span className="text-xs text-gray-400">(you)</span>}</td>
                <td className="px-4 py-2 text-gray-500">{u.email}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}</td>
                <td className="px-4 py-2">
                  {u.id !== me.id && (
                    <button onClick={() => toggleActive(u)}
                      className={`text-xs border rounded px-2 py-1 ${u.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}>
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <AddUserModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); reload(); }} />}
    </div>
  );
}
