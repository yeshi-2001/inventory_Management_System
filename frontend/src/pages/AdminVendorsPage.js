import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { Spinner, Empty } from "../components/UI";
import toast from "react-hot-toast";

const BASE = process.env.REACT_APP_API_URL;
const authFetch = (path, opts = {}) => {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  }).then((r) => r.json());
};

function ReviewModal({ offer, onClose, onSaved }) {
  const [status, setStatus] = useState("accepted");
  const [notes,  setNotes]  = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const res = await authFetch(`/vendor/offers/${offer.id}/review`, {
      method: "PUT", body: JSON.stringify({ status, adminNotes: notes }),
    });
    setSaving(false);
    if (res.success) { toast.success(`Offer ${status}`); onSaved(); }
    else toast.error(res.error);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h2 className="font-semibold">Review Offer: {offer.itemName}</h2>
        <div className="flex gap-2">
          {["accepted","rejected"].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`flex-1 py-1.5 text-sm rounded-lg border ${status === s ? (s === "accepted" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600") : "bg-white text-gray-600"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Admin notes (optional)"
          className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
            {saving ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVendorsPage() {
  const { data: vendors, loading, reload } = useFetch(() => authFetch("/admin/users/vendors").then(r => r.data));
  const [selected, setSelected] = useState(null);
  const [offers,   setOffers]   = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const approve = async (id) => {
    const res = await authFetch(`/admin/users/vendors/${id}/approve`, { method: "PUT" });
    if (res.success) { toast.success("Vendor approved"); reload(); }
    else toast.error(res.error);
  };

  const deactivate = async (id) => {
    const res = await authFetch(`/admin/users/vendors/${id}/deactivate`, { method: "PUT" });
    if (res.success) { toast.success("Vendor deactivated"); reload(); }
    else toast.error(res.error);
  };

  const viewOffers = async (vendor) => {
    setSelected(vendor);
    const res = await authFetch(`/vendor/offers?vendorId=${vendor.id}`);
    setOffers(res.data || []);
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold">Vendor Management</h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{["Company", "Email", "Status", "Registered", "Actions"].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(vendors || []).map(v => (
              <tr key={v.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => viewOffers(v)}>
                <td className="px-4 py-2 font-medium">{v.companyName}</td>
                <td className="px-4 py-2 text-gray-500">{v.email}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {v.isActive ? "Active" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                  {!v.isActive
                    ? <button onClick={() => approve(v.id)} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-100">Approve</button>
                    : <button onClick={() => deactivate(v.id)} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-100">Deactivate</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Offers panel */}
      {selected && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3">Offers from {selected.companyName}</h3>
          {!offers ? <Spinner /> : !offers.length ? <Empty message="No offers yet." /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{["Item","Unit Price","Min Qty","Lead Time","Status","Action"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {offers.map(o => (
                  <tr key={o.id} className="border-b">
                    <td className="px-3 py-2">{o.itemName}</td>
                    <td className="px-3 py-2">Rs. {Number(o.unitPrice).toFixed(2)}</td>
                    <td className="px-3 py-2">{o.minOrderQty}</td>
                    <td className="px-3 py-2">{o.leadTimeDays}d</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        o.status === "accepted" ? "bg-green-100 text-green-700" :
                        o.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      {o.status === "pending" && (
                        <button onClick={() => setReviewing(o)} className="text-xs text-blue-600 hover:underline">Review</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {reviewing && (
        <ReviewModal offer={reviewing} onClose={() => setReviewing(null)}
          onSaved={() => { setReviewing(null); viewOffers(selected); }} />
      )}
    </div>
  );
}
