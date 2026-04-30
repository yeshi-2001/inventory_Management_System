import { useState } from "react";
import { api } from "../api";

const EMPTY = {
  itemId: "", itemName: "", category: "", quantity: 0,
  minQuantity: 0, unitPrice: 0, vendorEmail: "", vendorName: "",
  warehouseLocation: "", dailySales: [],
};

export default function ItemModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) await api.put(`/inventory/${item.itemId}`, form);
      else await api.post("/inventory", form);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    ["itemId", "Item ID"], ["itemName", "Item Name"], ["category", "Category"],
    ["quantity", "Quantity", "number"], ["minQuantity", "Min Quantity", "number"],
    ["unitPrice", "Unit Price", "number"], ["vendorEmail", "Vendor Email", "email"],
    ["vendorName", "Vendor Name"], ["warehouseLocation", "Location"],
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{item ? "Edit Item" : "Add Item"}</h2>
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          {fields.map(([key, label, type = "text"]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, type === "number" ? +e.target.value : e.target.value)}
                className="border rounded px-2 py-1.5 text-sm"
                required={["itemId", "itemName", "quantity", "minQuantity"].includes(key)}
              />
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
