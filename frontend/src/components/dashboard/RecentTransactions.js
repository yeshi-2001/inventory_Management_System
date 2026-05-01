import { useFetch } from "../../hooks/useFetch";
import { billing } from "../../api";
import { formatLKR } from "../../utils/currency";
import { SkeletonRow } from "../ui/SkeletonCard";
import { Link } from "react-router-dom";

export default function RecentTransactions() {
  const { data, loading } = useFetch(() =>
    billing.getBills({ page: 1, limit: 8 }).then((r) => r.data || [])
  );

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>Recent Transactions</h3>
        <Link to="/billing/history" className="text-xs hover:underline" style={{ color: "var(--color-ocean)" }}>
          View all →
        </Link>
      </div>

      {loading ? (
        <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b" style={{ borderColor: "var(--color-border)" }}>
              {["Time", "Bill No.", "Customer", "Items", "Amount", "Status"].map((h) => (
                <th key={h} className="pb-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data || []).map((bill, idx) => (
              <tr
                key={bill.id}
                className="border-b transition"
                style={{
                  borderColor: "var(--color-border)",
                  background: idx % 2 === 0 ? "#fff" : "#f8fefe",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#f8fefe"}
              >
                <td className="py-2.5 text-xs text-gray-400">
                  {new Date(bill.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-2.5 font-mono text-xs hover:underline cursor-pointer"
                  style={{ color: "var(--color-ocean)" }}>
                  {bill.billNumber}
                </td>
                <td className="py-2.5 text-gray-600 text-xs truncate max-w-[100px]">{bill.customerEmail}</td>
                <td className="py-2.5 text-gray-600">{bill.items?.length ?? 0}</td>
                <td className="py-2.5 font-medium" style={{ color: "var(--color-navy)" }}>
                  {formatLKR(bill.total)}
                </td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={bill.status === "paid"
                      ? { background: "#e6fdf8", color: "#0f6e56" }
                      : { background: "#fef2f2", color: "#991b1b" }
                    }>
                    {bill.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-gray-400">Showing {data?.length || 0} recent bills</p>
    </div>
  );
}
