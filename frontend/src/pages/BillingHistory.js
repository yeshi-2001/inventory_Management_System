import { useState, useEffect } from "react";
import { billing } from "../api";
import { formatLKR } from "../utils/currency";
import { StatCard, Spinner } from "../components/UI";
import BillDetailPanel from "../components/BillDetailPanel";

export default function BillingHistory() {
  const [bills,       setBills]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [loading,     setLoading]     = useState(false);
  const [summary,     setSummary]     = useState(null);
  const [selected,    setSelected]    = useState(null);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await billing.getBills({ page, limit, search, startDate, endDate });
      setBills(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, search, startDate, endDate]); // eslint-disable-line
  useEffect(() => {
    billing.getSummary().then(setSummary).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Bills today"       value={summary.totalBills}     color="blue"   />
          <StatCard label="Revenue today"     value={formatLKR(summary.totalRevenue)} color="blue" />
          <StatCard label="Items sold today"  value={summary.totalItemsSold} color="gray"   />
          <StatCard label="Top item today"    value={summary.mostSoldItem || "—"} color="yellow" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-56"
          placeholder="Search bill no. or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm" />
        {(search || startDate || endDate) && (
          <button
            onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); setPage(1); }}
            className="text-xs text-gray-500 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                {["Bill No.", "Customer Email", "Items", "Total", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr
                  key={bill.id}
                  onClick={() => setSelected(bill)}
                  className="border-b hover:bg-blue-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-blue-600">{bill.billNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{bill.customerEmail}</td>
                  <td className="px-4 py-3">{bill.items?.length ?? 0}</td>
                  <td className="px-4 py-3 font-medium">{formatLKR(bill.total)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(bill.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      bill.status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bills found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end text-sm">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40">← Prev</button>
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40">Next →</button>
        </div>
      )}

      {selected && <BillDetailPanel bill={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
