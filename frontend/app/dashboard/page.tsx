"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stock = {
  id: number;
  symbol: string;
  name: string;
  total_quantity: number;
  average_buy_price: number;
  current_price: number;
  latest_accuracy: number | null;
  latest_trained_model_id: number | null;
};

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/dashboard", {
      headers: { Authorization: token },
    })
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(setStocks)
      .catch(console.error);
  }, [token, router]);

  const addStock = async () => {
    if (!symbol) return alert("Symbol required");
    const res = await fetch("http://localhost:5000/api/stocks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify({ symbol, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to add stock");
      return;
    }
    setSymbol("");
    setName("");
    const newStock = await res.json();
    setStocks((prev) => [...prev, newStock.stock]);
  };

  const deleteStock = async (stockId: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this stock?")) return;

    const res = await fetch(`http://localhost:5000/api/stocks/${stockId}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to delete stock");
      return;
    }

    setStocks((prev) => prev.filter((stock) => stock.id !== stockId));
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">My Stocks</h1>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="border rounded p-2 w-28 md:w-36 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded p-2 flex-grow min-w-[180px] md:min-w-[280px] focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={addStock}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded transition"
        >
          Add Stock
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-green-100">
            <tr>
              <th className="text-left p-4 font-semibold">Symbol</th>
              <th className="text-left p-4 font-semibold">Name</th>
              <th className="text-right p-4 font-semibold">Total Qty</th>
              <th className="text-right p-4 font-semibold">Avg Buy Price</th>
              <th className="text-right p-4 font-semibold">
                Latest Model Accuracy
              </th>
              <th className="text-center p-4 font-semibold">Actions</th>{" "}
              {/* New column */}
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.id}
                className="hover:bg-green-50 border-b last:border-none transition"
              >
                <td
                  className="p-4 font-semibold text-green-700 cursor-pointer"
                  onClick={() => router.push(`/dashboard/${stock.id}`)}
                >
                  {stock.symbol}
                </td>
                <td
                  className="p-4 cursor-pointer"
                  onClick={() => router.push(`/dashboard/${stock.id}`)}
                >
                  {stock.name}
                </td>
                <td className="p-4 text-right">{stock.total_quantity}</td>
                <td className="p-4 text-right">
                  {stock.average_buy_price
                    ? stock.average_buy_price.toFixed(2)
                    : "0.00"}
                </td>
                <td className="p-4 text-right">
                  {stock.latest_accuracy
                    ? `${stock.latest_accuracy.toFixed(2)}%`
                    : "-"}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent row click
                      deleteStock(stock.id);
                    }}
                    className="text-red-600 hover:text-red-800 font-semibold"
                    title="Delete Stock"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
