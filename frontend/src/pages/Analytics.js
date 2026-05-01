import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAnalytics from "../hooks/useAnalytics";
import SummaryCards from "../components/SummaryCards";
import AnalyticsTable from "../components/AnalyticsTable";
import { Spinner } from "../components/UI";
import toast from "react-hot-toast";

const PERIODS = [
  { label: "7 days",      value: "7"     },
  { label: "30 days",     value: "30"    },
  { label: "90 days",     value: "90"    },
  { label: "Custom range",value: "custom"},
];

export default function Analytics() {
  const [searchParams] = useSearchParams();
  const [period,    setPeriod]    = useState(searchParams.get("startDate") ? "custom" : "30");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate,   setEndDate]   = useState(searchParams.get("endDate")   || "");
  const [search,    setSearch]    = useState("");
  const [exporting, setExporting] = useState(null);

  const { report, summary, chartData, loading, error, runReport, fetchSummary, fetchChartData, exportReport } = useAnalytics();

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Auto-run if navigated from billing history with pre-filled dates
  useEffect(() => {
    const sd = searchParams.get("startDate");
    const ed = searchParams.get("endDate");
    if (sd && ed) runReport("custom", sd, ed);
  }, []); // eslint-disable-line

  const handleRun = () => {
    if (period === "custom" && (!startDate || !endDate)) {
      toast.error("Please select both start and end dates");
      return;
    }
    runReport(period, startDate, endDate);
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const url = exportReport(period, startDate, endDate, format);
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error("Export failed");
    } finally {
      setTimeout(() => setExporting(null), 1500);
    }
  };

  const handleRowExpand = (inventoryId) => {
    const end   = endDate   || new Date().toISOString().split("T")[0];
    const start = startDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() - Number(period === "custom" ? 30 : period));
      return d.toISOString().split("T")[0];
    })();
    fetchChartData(inventoryId, start, end);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Section 1: Controls ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex gap-1">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  period === value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-sm"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
          )}

          {/* Search */}
          <input
            className="border rounded-lg px-3 py-1.5 text-sm w-48"
            placeholder="Filter by item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={loading}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</> : "Run Analysis"}
          </button>

          {/* Export buttons */}
          {report && (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => handleExport("csv")}
                disabled={exporting === "csv"}
                className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting === "csv" ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={exporting === "pdf"}
                className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting === "pdf" ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* ── Section 2: Summary Cards ─────────────────────────────────────────── */}
      <SummaryCards summary={summary} />

      {/* ── Section 3 + 4: Table with expandable charts ──────────────────────── */}
      {loading
        ? <div className="flex justify-center py-12"><Spinner /></div>
        : <AnalyticsTable
            items={report}
            chartData={chartData}
            onRowExpand={handleRowExpand}
            search={search}
          />
      }
    </div>
  );
}
