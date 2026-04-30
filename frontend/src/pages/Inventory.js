import { useState } from "react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Spinner, Empty } from "../components/UI";
import InventoryForm from "../components/InventoryForm";
import { formatLKR } from "../utils/currency";
import toast from "react-hot-toast";

// ─── Status badge logic ───────────────────────────────────────────────────────
const getStatus = (item) => {
  if (item.quantity === 0)                    return "out";
  if (item.quantity <= item.minQuantity)      return "low";
  return "in";
};

const STATUS_BADGE = {
  out: { label: "Out of stock", cls: "bg-red-100 text-red-700" },
  low: { label: "Low stock",    cls: "bg-amber-100 text-amber-700" },
  in:  { label: "In stock",     cls: "bg-green-100 text-green-700" },
};

const ROW_BORDER = {
  out: "border-l-4 border-red-500",
  low: "border-l-4 border-amber-400",
  in:  "",
};

const StatusBadge = ({ status }) => {
  const { label, cls } = STATUS_BADGE[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

// ─── Inventory Table ──────────────────────────────────────────────────────────
const InventoryTable = ({ items, onEdit, onDelete }) => {
  const [search, setSearch] = useState("");

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.itemName || i.item_name || "").toLowerCase().includes(q) ||
      (i.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <input
        className="border rounded-lg px-3 py-2 text-sm w-64"
        placeholder="Search by name or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              {["Item Name", "Category", "Quantity", "Min Qty", "Unit Price", "Status", "Vendor", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status = getStatus(item);
              return (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${ROW_BORDER[status]}`}>
                  <td className="px-4 py-2 font-medium">{item.itemName || item.item_name}</td>
                  <td className="px-4 py-2 text-gray-500">{item.category || "—"}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{item.minQuantity ?? item.min_quantity}</td>
                  <td className="px-4 py-2 text-gray-700">{item.unitPrice != null ? formatLKR(item.unitPrice) : "—"}</td>
                  <td className="px-4 py-2"><StatusBadge status={status} /></td>
                  <td className="px-4 py-2 text-gray-500">{item.vendor?.name || "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => onEdit(item)} className="text-blue-600 text-xs hover:underline">Edit</button>
                      <button onClick={() => onDelete(item.id)} className="text-red-500 text-xs hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">No items match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABS = ["All", "Low Stock", "Dead Stock", "Fast Movers"];

export default function Inventory() {
  const { data: inventory, loading, reload } = useFetch(() => api.get("/inventory"));
  const [tab, setTab]     = useState("All");
  const [modal, setModal] = useState(null); // null | "add" | item

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success("Item deleted");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const tabFiltered = (inventory || []).filter((i) => {
    if (tab === "Low Stock")   return i.quantity <= (i.minQuantity ?? i.min_quantity);
    if (tab === "Dead Stock")  return (i.dailySales || []).slice(-14).every((d) => (d.quantitySold ?? d) === 0);
    if (tab === "Fast Movers") {
      const avg = (i.dailySales || []).reduce((s, d) => s + (d.quantitySold ?? d), 0) / ((i.dailySales?.length) || 1);
      return avg > 5;
    }
    return true;
  });

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-full text-sm ${tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal("add")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Add Item
        </button>
      </div>

      {tabFiltered.length === 0
        ? <Empty message="No items match your filter." />
        : <InventoryTable items={tabFiltered} onEdit={setModal} onDelete={deleteItem} />
      }

      {modal && (
        <InventoryForm
          item={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}
    </div>
  );
}
