import { useState, useEffect, useRef, useCallback } from "react";
import { api, billing } from "../api";
import { formatLKR } from "../utils/currency";
import ReceiptModal from "../components/ReceiptModal";
import toast from "react-hot-toast";

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Item search panel ─────────────────────────────────────────────────────────
function ItemSearch({ onAdd, cartIds, stockStatuses }) {
  const [query, setQuery]   = useState("");
  const [items, setItems]   = useState([]);
  const debouncedQ          = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQ.trim()) { setItems([]); return; }
    api.get(`/inventory?search=${encodeURIComponent(debouncedQ)}`)
      .then(setItems)
      .catch(() => {});
  }, [debouncedQ]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <input
        className="border rounded-lg px-3 py-2 text-sm"
        placeholder="Search items..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 && query && (
          <p className="text-center text-gray-400 text-sm py-8">No items found</p>
        )}
        {items.map((item) => {
          const outOfStock = item.quantity === 0;
          const isLow      = item.quantity > 0 && item.quantity <= item.minQuantity;
          const status     = stockStatuses[item.id];
          const isAlert    = status === "urgent" || status === "low_stock";

          return (
            <button
              key={item.id}
              disabled={outOfStock}
              onClick={() => onAdd(item)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                outOfStock
                  ? "opacity-50 cursor-not-allowed bg-gray-50"
                  : "hover:border-blue-400 hover:bg-blue-50 bg-white"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">
                    {item.itemName}
                    {isAlert && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        ⚠ {status === "urgent" ? "Urgent" : "Low stock"}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{item.category || "—"}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-semibold text-gray-700">{formatLKR(item.unitPrice)}</p>
                  <p className={`text-xs font-medium ${outOfStock ? "text-red-500" : isLow ? "text-amber-500" : "text-green-600"}`}>
                    {outOfStock ? "Out of stock" : `${item.quantity} in stock`}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Cart ──────────────────────────────────────────────────────────────────────
function Cart({ cart, onQtyChange, onRemove, taxRate, onTaxChange, onClear }) {
  const subtotal = cart.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
  const taxAmt   = subtotal * (taxRate / 100);
  const total    = subtotal + taxAmt;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Cart ({cart.length})</h2>
        {cart.length > 0 && (
          <button onClick={onClear} className="text-xs text-red-500 hover:underline">Clear cart</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-3xl mb-2">🛒</span>
            <p className="text-sm">Cart is empty</p>
          </div>
        )}
        {cart.map((item) => {
          const maxQty = item.maxQty;
          const qtyErr = item.quantity > maxQty;
          return (
            <div key={item.id} className="bg-white border rounded-lg p-3 text-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">{item.itemName}</p>
                <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500">{formatLKR(item.unitPrice)} each</p>
                  {qtyErr && (
                    <p className="text-xs text-red-500 mt-0.5">Only {maxQty} available</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={item.quantity}
                    onChange={(e) => onQtyChange(item.id, Number(e.target.value))}
                    className={`w-16 border rounded px-2 py-1 text-sm text-center ${qtyErr ? "border-red-400" : ""}`}
                  />
                  <span className="text-gray-700 font-medium w-24 text-right">
                    {formatLKR(item.quantity * Number(item.unitPrice))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{formatLKR(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Tax (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={taxRate}
              onChange={(e) => onTaxChange(Number(e.target.value))}
              className="w-16 border rounded px-2 py-1 text-sm text-center"
            />
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax amount</span><span>{formatLKR(taxAmt)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total</span><span className="text-green-600">{formatLKR(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Billing() {
  const [cart,          setCart]          = useState([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName,  setCustomerName]  = useState("");
  const [taxRate,       setTaxRate]       = useState(0);
  const [submitting,    setSubmitting]    = useState(false);
  const [successBill,   setSuccessBill]   = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [stockStatuses, setStockStatuses] = useState({});

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  const cartValid  = cart.length > 0 && cart.every((i) => i.quantity >= 1 && i.quantity <= i.maxQty);
  const canSubmit  = cartValid && emailValid && !submitting;

  // Fetch analytics statuses for items in cart (integration: show urgent/low_stock badge)
  useEffect(() => {
    if (cart.length === 0) return;
    api.get("/inventory")
      .then((all) => {
        const map = {};
        all.forEach((item) => {
          if (item.quantity === 0) map[item.id] = "urgent";
          else if (item.quantity <= item.minQuantity) map[item.id] = "low_stock";
        });
        setStockStatuses(map);
      })
      .catch(() => {});
  }, [cart.length]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: Math.min(c.quantity + 1, c.maxQty) } : c
        );
      }
      return [...prev, { ...item, quantity: 1, maxQty: item.quantity }];
    });
  };

  const updateQty = (id, qty) =>
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)));

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const clearCart = () => setCart([]);

  const handleCheckout = async () => {
    setCheckoutError("");
    setSubmitting(true);
    try {
      const bill = await billing.checkout({
        customerEmail,
        customerName: customerName || undefined,
        items: cart.map(({ id, quantity }) => ({ inventoryId: id, quantity })),
      });
      setSuccessBill(bill);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setSuccessBill(null);
    setCart([]);
    setCustomerEmail("");
    setCustomerName("");
    setTaxRate(0);
    setCheckoutError("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — Item search */}
      <div className="w-72 border-r bg-gray-50 p-4 flex flex-col">
        <h2 className="font-semibold text-gray-700 mb-3">Items</h2>
        <ItemSearch
          onAdd={addToCart}
          cartIds={cart.map((i) => i.id)}
          stockStatuses={stockStatuses}
        />
      </div>

      {/* Middle — Cart */}
      <div className="flex-1 p-4 flex flex-col bg-white border-r">
        <Cart
          cart={cart}
          onQtyChange={updateQty}
          onRemove={removeItem}
          taxRate={taxRate}
          onTaxChange={setTaxRate}
          onClear={clearCart}
        />
      </div>

      {/* Right — Customer & checkout */}
      <div className="w-72 p-4 flex flex-col gap-4 bg-gray-50">
        <h2 className="font-semibold text-gray-700">Customer</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name (optional)</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email *</label>
            <input
              type="email"
              className={`border rounded-lg px-3 py-2 text-sm w-full ${
                customerEmail && !emailValid ? "border-red-400" : ""
              }`}
              placeholder="customer@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              disabled={submitting}
            />
            {customerEmail && !emailValid && (
              <p className="text-xs text-red-500 mt-1">Enter a valid email</p>
            )}
          </div>
        </div>

        {checkoutError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
            {checkoutError}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={!canSubmit}
          className="mt-auto bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            "✓ Confirm & send bill"
          )}
        </button>
      </div>

      {successBill && <ReceiptModal bill={successBill} onNewSale={handleNewSale} />}
    </div>
  );
}
