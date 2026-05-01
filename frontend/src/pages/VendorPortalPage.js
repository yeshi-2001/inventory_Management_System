import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { Spinner, Empty } from "../components/UI";
import { formatLKR } from "../utils/currency";
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

const STATUS_BADGE = {
  pending:  "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function OfferModal({ offer, onClose, onSaved }) {
  const [form, setForm] = useState(offer || { itemName: "", category: "", unitPrice: "", minOrderQty: "", leadTimeDays: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = offer
        ? await authFetch(`/vendor/offers/${offer.id}`, { method: "PUT", body: JSON.stringify(form) })
        : await authFetch("/vendor/offers", { method: "POST", body: JSON.stringify(form) });
      if (!res.success) throw new Error(res.error);
      toast.success(offer ? "Offer updated" : "Offer submitted");
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{offer ? "Edit Offer" : "Submit New Offer"}</h2>
        <form onSubmit={save} className="space-y-3">
          {[["itemName","Item Name"],["category","Category (optional)"],["unitPrice","Unit Price (Rs.)"],["minOrderQty","Min Order Qty"],["leadTimeDays","Lead Time (days)"]].map(([k, l]) => (
            <div key={k}>
              <label className="text-xs text-gray-500">{l}</label>
              <input value={form[k] || ""} onChange={(e) => setForm(f => ({...f, [k]: e.target.value}))}
                className="mt-0.5 w-full border rounded px-2 py-1.5 text-sm" required={k !== "category"} />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500">Notes (optional)</label>
            <textarea value={form.notes || ""} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))}
              className="mt-0.5 w-full border rounded px-2 py-1.5 text-sm" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VendorPortalPage() {
  const { user } = useAuth();
  const { data: profile } = useFetch(() => authFetch("/vendor/profile").then(r => r.data));
  const { data: offers, loading, reload } = useFetch(() => authFetch("/vendor/offers").then(r => r.data));
  const [modal, setModal] = useState(null);

  const deleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    const res = await authFetch(`/vendor/offers/${id}`, { method: "DELETE" });
    if (res.success) { toast.success("Offer deleted"); reload(); }
    else toast.error(res.error);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Profile card */}
      {profile && (
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{profile.companyName}</h2>
            <p className="text-sm text-gray-500">{profile.contactName} · {profile.email}</p>
            {profile.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {profile.isActive ? "Approved" : "Pending Approval"}
          </span>
        </div>
      )}

      {/* Offers table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-700">My Stock Offers</h3>
          <button onClick={() => setModal("new")} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">+ Submit Offer</button>
        </div>
        {loading ? <Spinner /> : !offers?.length ? <Empty message="No offers submitted yet." /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{["Item", "Category", "Unit Price", "Min Qty", "Lead Time", "Status", ""].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{o.itemName}</td>
                  <td className="px-4 py-2 text-gray-500">{o.category || "—"}</td>
                  <td className="px-4 py-2">{formatLKR(o.unitPrice)}</td>
                  <td className="px-4 py-2">{o.minOrderQty}</td>
                  <td className="px-4 py-2">{o.leadTimeDays}d</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[o.status]}`}>{o.status}</span>
                    {o.status === "accepted" && <p className="text-xs text-green-600 mt-0.5">Added to inventory ✓</p>}
                  </td>
                  <td className="px-4 py-2">
                    {o.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => setModal(o)} className="text-xs text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => deleteOffer(o.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <OfferModal
          offer={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}
    </div>
  );
}
