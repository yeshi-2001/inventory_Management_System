import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import toast from "react-hot-toast";

const schema = z.object({
  itemName:          z.string().trim().min(2, "Min 2 characters").max(100, "Max 100 characters"),
  category:          z.string().optional(),
  quantity:          z.coerce.number().int().min(0, "Quantity must be 0 or more"),
  minQuantity:       z.coerce.number().int().min(0, "Min quantity must be 0 or more"),
  unitPrice:         z.coerce.number().min(0).optional().or(z.literal("")),
  warehouseLocation: z.string().optional(),
  vendorId:          z.coerce.number().int().positive().optional().or(z.literal("")),
});

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default function InventoryForm({ item, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const { data: vendors } = useFetch(() => api.get("/vendors"));

  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      itemName:          item?.itemName          ?? item?.item_name          ?? "",
      category:          item?.category          ?? "",
      quantity:          item?.quantity          ?? 0,
      minQuantity:       item?.minQuantity        ?? item?.min_quantity       ?? 10,
      unitPrice:         item?.unitPrice          ?? item?.unit_price         ?? "",
      warehouseLocation: item?.warehouseLocation  ?? item?.warehouse_location ?? "",
      vendorId:          item?.vendorId           ?? item?.vendor_id          ?? "",
    },
  });

  const qty    = Number(watch("quantity"));
  const minQty = Number(watch("minQuantity"));
  const showWarning = !isNaN(qty) && !isNaN(minQty) && qty < minQty;

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        unitPrice: values.unitPrice === "" ? undefined : Number(values.unitPrice),
        vendorId:  values.vendorId  === "" ? undefined : Number(values.vendorId),
      };
      if (isEdit) await api.put(`/inventory/${item.id}`, payload);
      else        await api.post("/inventory", payload);
      toast.success(isEdit ? "Item updated!" : "Item created!");
      onSaved();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? "Edit Item" : "Add Item"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Item Name *" error={errors.itemName?.message}>
              <input {...register("itemName")} className="border rounded px-2 py-1.5 text-sm w-full" />
            </Field>
          </div>

          <Field label="Category" error={errors.category?.message}>
            <input {...register("category")} className="border rounded px-2 py-1.5 text-sm" />
          </Field>

          <Field label="Warehouse Location" error={errors.warehouseLocation?.message}>
            <input {...register("warehouseLocation")} className="border rounded px-2 py-1.5 text-sm" />
          </Field>

          <Field label="Quantity *" error={errors.quantity?.message}>
            <input type="number" {...register("quantity")} className="border rounded px-2 py-1.5 text-sm" />
          </Field>

          <Field label="Min Quantity *" error={errors.minQuantity?.message}>
            <input type="number" {...register("minQuantity")} className="border rounded px-2 py-1.5 text-sm" />
          </Field>

          <Field label="Unit Price (Rs.)" error={errors.unitPrice?.message}>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rs.</span>
              <input type="number" step="0.01" {...register("unitPrice")} className="border rounded pl-8 pr-2 py-1.5 text-sm w-full" />
            </div>
          </Field>

          <Field label="Vendor" error={errors.vendorId?.message}>
            <select {...register("vendorId")} className="border rounded px-2 py-1.5 text-sm bg-white">
              <option value="">— No vendor —</option>
              {(vendors || []).map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </Field>

          {showWarning && (
            <div className="col-span-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-amber-800">
              ⚠️ Warning: quantity is below minimum. Saving will trigger a low-stock alert.
            </div>
          )}

          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
