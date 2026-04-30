def analyze_inventory(items):
    """
    Analyzes inventory items and returns predictions.
    Each item should have: inventoryId, itemName, dailySales (list of ints), quantity, minQuantity
    """
    avgs = []
    for item in items:
        sales = item.get("dailySales", [])
        avg = sum(sales) / len(sales) if sales else 0
        avgs.append(avg)

    avgs_sorted = sorted(avgs, reverse=True)
    top20_threshold = avgs_sorted[max(0, len(avgs_sorted) // 5 - 1)] if avgs_sorted else 0

    results = []
    for item, avg in zip(items, avgs):
        sales = item.get("dailySales", [])
        quantity = item.get("quantity", 0)
        min_qty = item.get("minQuantity", 0)

        last7 = sales[-7:] if len(sales) >= 7 else sales
        moving_avg = sum(last7) / len(last7) if last7 else 0

        days_until_stockout = round(quantity / moving_avg, 1) if moving_avg > 0 else None
        reorder_qty = max(0, round((moving_avg * 30) - quantity))

        last14_sum = sum(sales[-14:]) if len(sales) >= 14 else sum(sales)
        is_dead = last14_sum == 0

        if is_dead:
            classification = "dead_stock"
        elif days_until_stockout is not None and days_until_stockout <= 7:
            classification = "urgent"
        elif avg >= top20_threshold and not is_dead:
            classification = "fast_mover"
        else:
            classification = "normal"

        if classification == "dead_stock":
            insight = f"No sales in the last 14 days. Consider discounting or returning to vendor."
        elif classification == "urgent":
            insight = f"Stock will run out in ~{days_until_stockout} days. Reorder {reorder_qty} units immediately."
        elif classification == "fast_mover":
            insight = f"Top seller with avg {round(moving_avg, 1)} units/day. Keep well stocked."
        else:
            insight = f"Stock levels are healthy. Reorder {reorder_qty} units when needed." if reorder_qty > 0 else "Stock levels are healthy."

        results.append({
            "inventoryId": item.get("inventoryId"),
            "itemName": item.get("itemName"),
            "avgDailySales": round(moving_avg, 2),
            "daysUntilStockout": days_until_stockout,
            "reorderQty": reorder_qty,
            "classification": classification,
            "insight": insight,
        })

    return results
