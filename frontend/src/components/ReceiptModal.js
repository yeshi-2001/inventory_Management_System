import { formatLKR } from "../utils/currency";

export default function ReceiptModal({ bill, onNewSale }) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {/* Print-only receipt */}
      <style>{`
        @media print {
          body > *:not(#receipt-print) { display: none !important; }
          #receipt-print { display: block !important; position: static; }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-bold text-gray-800">Sale Complete</h2>
          <p className="text-2xl font-bold text-blue-600">{bill.billNumber}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium">{bill.customerName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{bill.customerEmail}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-green-600 text-base">{formatLKR(bill.total)}</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          📧 Bill sent to <strong>{bill.customerEmail}</strong>
        </p>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            🖨 Print receipt
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium"
          >
            New sale
          </button>
        </div>
      </div>

      {/* Hidden print-only receipt */}
      <div id="receipt-print" style={{ display: "none" }}>
        <div style={{ fontFamily: "monospace", maxWidth: 320, margin: "0 auto", padding: 16 }}>
          <h2 style={{ textAlign: "center" }}>{process.env.REACT_APP_SHOP_NAME || "Receipt"}</h2>
          <p style={{ textAlign: "center" }}>{bill.billNumber}</p>
          <p style={{ textAlign: "center" }}>{new Date(bill.createdAt).toLocaleString()}</p>
          <hr />
          {bill.items?.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{item.itemName} x{item.quantity}</span>
              <span>Rs. {Number(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
          <hr />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>TOTAL</span>
            <span>Rs. {Number(bill.total).toFixed(2)}</span>
          </div>
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12 }}>Thank you!</p>
        </div>
      </div>
    </div>
  );
}
