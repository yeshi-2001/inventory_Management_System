import { useState, Fragment } from "react";
import ItemCharts from "./ItemCharts";

const STATUS_BADGE = {
  urgent:     "bg-red-100 text-red-700",
  low_stock:  "bg-amber-100 text-amber-700",
  normal:     "bg-green-100 text-green-700",
  overstock:  "bg-blue-100 text-blue-700",
  dead_stock: "bg-gray-100 text-gray-600",
};

const STATUS_ORDER = { urgent: 0, low_stock: 1, dead_stock: 2, overstock: 3, normal: 4 };

const sortItems = (items) =>
  [...items].sort((a, b) => {
    const so = (STATUS_ORDER[a.stockStatus] ?? 5) - (STATUS_ORDER[b.stockStatus] ?? 5);
    if (so !== 0) return so;
    return (a.daysToStockout ?? Infinity) - (b.daysToStockout ?? Infinity);
  });

const reorderMailto = (item) => {
  const subject = encodeURIComponent(`Reorder Request: ${item.itemName}`);
  const body = encodeURIComponent(
    `Dear Vendor,\n\nPlease process a reorder for:\n\nItem: ${item.itemName}\nCurrent Stock: ${item.currentQuantity}\nRequested Qty: ${item.recommendedOrderQty}\n\nRegards,\nWarehouse Team`
  );
  return `mailto:?subject=${subject}&body=${body}`;
};

export default function AnalyticsTable({ items, chartData, onRowExpand, search }) {
  const [expanded, setExpanded] = useState(null);

  const filtered = sortItems(
    (items || []).filter((i) =>
      i.itemName.toLowerCase().includes((search || "").toLowerCase())
    )
  );

  const toggle = (item) => {
    const next = expanded === item.inventoryId ? null : item.inventoryId;
    setExpanded(next);
    if (next) onRowExpand(item.inventoryId);
  };

  if (!filtered.length)
    return <p className="text-sm text-gray-400 text-center py-8">No results. Run an analysis first.</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {["Item Name", "Avg Daily Sales", "Days to Stockout", "Reorder Qty", "Status", "Insight", ""].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <Fragment key={item.inventoryId}>
              <tr
                onClick={() => toggle(item)}
                className="border-b hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium">{item.itemName}</td>
                <td className="px-4 py-3">{item.avgDailySales}</td>
                <td className="px-4 py-3">
                  {item.daysToStockout != null ? `${item.daysToStockout}d` : "N/A"}
                </td>
                <td className="px-4 py-3">{item.recommendedOrderQty}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.stockStatus] || "bg-gray-100 text-gray-600"}`}>
                    {item.stockStatus.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{item.insight}</td>
                <td className="px-4 py-3">
                  {(item.stockStatus === "urgent" || item.stockStatus === "low_stock") && (
                    <a
                      href={reorderMailto(item)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-100 whitespace-nowrap"
                    >
                      Reorder now
                    </a>
                  )}
                </td>
              </tr>
              {expanded === item.inventoryId && (
                <tr>
                  <td colSpan={7} className="px-4 py-2">
                    <ItemCharts
                      inventoryId={item.inventoryId}
                      minQuantity={item.minQuantity}
                      chartData={chartData}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
