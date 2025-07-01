"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Transaction = {
  id: number;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  timestamp: string;
};

type TrainedModel = {
  id: number;
  filename: string;
  accuracy: number;
  upload_time: string;
};

export default function StockDetailsPage() {
  const { stockId } = useParams();
  const router = useRouter();
  const [stockName, setStockName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [averageBuyPrice, setAverageBuyPrice] = useState(0);

  const [transType, setTransType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  const [uploading, setUploading] = useState(false);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // This runs only in the browser
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    fetch(`http://localhost:5000/api/stocks/${stockId}`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => {
        setStockName(data.name);
        setSymbol(data.symbol);
        setTransactions(data.transactions);
        setTrainedModels(data.trained_models);
        setTotalQuantity(data.total_quantity);
        setAverageBuyPrice(data.average_buy_price);
      })
      .catch(console.error);
  }, [stockId, token]);

  const addTransaction = async () => {
    if (quantity <= 0 || price <= 0) {
      alert("Quantity and price must be positive");
      return;
    }

    const res = await fetch(
      `http://localhost:5000/api/stocks/${stockId}/transaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({ type: transType, quantity, price }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to add transaction");
      return;
    }

    const refreshed = await fetch(
      `http://localhost:5000/api/stocks/${stockId}`,
      {
        headers: { Authorization: token as string },
      }
    ).then((r) => r.json());

    setTransactions(refreshed.transactions);
    setTotalQuantity(refreshed.total_quantity);
    setAverageBuyPrice(refreshed.average_buy_price);
    setQuantity(0);
    setPrice(0);
  };

  //   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (!e.target.files?.length) return;
  //   const files = e.target.files; // get all selected files
  //   setUploading(true);

  //   const formData = new FormData();
  //   // Append all files under the same key "file"
  //   for (let i = 0; i < files.length; i++) {
  //     formData.append("file", files[i]);
  //   }

  //   const res = await fetch(`http://localhost:5000/api/stocks/${stockId}/upload`, {
  //     method: "POST",
  //     headers: { Authorization: token || "" },
  //     body: formData,
  //   });

  //   if (!res.ok) {
  //     alert("Upload failed");
  //     setUploading(false);
  //     return;
  //   }

  //   const data = await res.json();
  //   alert(`Upload success! Accuracy: ${data.accuracy}`);

  //   const refreshed = await fetch(`http://localhost:5000/api/stocks/${stockId}`, {
  //     headers: { Authorization: token as string },
  //   }).then((r) => r.json());

  //   setTrainedModels(refreshed.trained_models);
  //   setUploading(false);
  // };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = e.target.files; // get all selected files
    setUploading(true);

    const formData = new FormData();
    // Append all files under the same key "file"
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }

    const res = await fetch(
      `http://localhost:5000/api/stocks/${stockId}/upload`,
      {
        method: "POST",
        headers: { Authorization: token || "" },
        body: formData,
      }
    );

    if (!res.ok) {
      alert("Upload failed");
      setUploading(false);
      return;
    }

    const data = await res.json();
    alert(`Upload success! Accuracy: ${data.accuracy}`);

    const refreshed = await fetch(
      `http://localhost:5000/api/stocks/${stockId}`,
      {
        headers: { Authorization: token as string },
      }
    ).then((r) => r.json());

    setTrainedModels(refreshed.trained_models);
    setUploading(false);
  };

  // Calculate profit/loss
  let totalInvested = 0;
  let totalEarned = 0;

  transactions.forEach((t) => {
    if (t.type === "buy") {
      totalInvested += t.quantity * t.price;
    } else if (t.type === "sell") {
      totalEarned += t.quantity * t.price;
    }
  });

  const profitLoss = totalEarned - totalInvested;
  const profitColor = profitLoss >= 0 ? "text-green-600" : "text-red-600";

  const deleteTrainedModel = async (modelId: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this trained model?")) return;

    const res = await fetch(
      `http://localhost:5000/api/trained-models/${modelId}`,
      {
        method: "DELETE",
        headers: { Authorization: token },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to delete trained model");
      return;
    }

    setTrainedModels((prev) => prev.filter((m) => m.id !== modelId));
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">
        {symbol} - {stockName}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">Total Quantity</h2>
          <p className="text-2xl font-bold">{totalQuantity}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">
            Average Buy Price
          </h2>
          <p className="text-2xl font-bold">Rs. {averageBuyPrice.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">Profit / Loss</h2>
          <p className={`text-2xl font-bold ${profitColor}`}>
            Rs. {profitLoss.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow md:col-span-4">
          <h2 className="text-gray-500 text-sm font-medium">Add Transaction</h2>
          <div className="mt-4 flex flex-wrap md:flex-nowrap items-center gap-4">
            <select
              value={transType}
              onChange={(e) => setTransType(e.target.value as "buy" | "sell")}
              className="border p-3 rounded w-32"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={quantity > 0 ? quantity : ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border p-3 rounded w-40"
            />

            <input
              type="number"
              placeholder="Price (Rs.)"
              value={price > 0 ? price : ""}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="border p-3 rounded w-44"
            />

            <button
              onClick={addTransaction}
              className="bg-blue-600 text-white px-5 py-3 rounded whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <h3 className="text-xl font-semibold p-6 border-b">Transactions</h3>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Quantity</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-gray-100">
                <td className="p-4">{t.type}</td>
                <td className="p-4">{t.quantity}</td>
                <td className="p-4">{t.price.toFixed(2)}</td>
                <td className="p-4">
                  {new Date(t.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Upload CSV to train model
        </h3>
        <label
          htmlFor="file-upload"
          className="flex items-center cursor-pointer border-2 border-dashed border-green-500 rounded-lg p-4 text-green-600 hover:bg-green-50 transition w-full"
        >
          <svg
            className="w-6 h-6 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M4 12h16"
            ></path>
          </svg>
          <span className="flex-grow">
            {uploading
              ? "Uploading & Processing..."
              : "Click to select a CSV file"}
          </span>
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Trained Models</h3>
        {trainedModels.length === 0 && <p>No trained models uploaded yet.</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainedModels.map((m) => (
            <div key={m.id} className="border rounded-lg p-6 relative bg-white">
              <h4
                className="font-semibold mb-2 cursor-pointer truncate w-full"
                title={m.filename}
                onClick={() => router.push(`/dashboard/${stockId}/${m.id}`)}
              >
                {m.filename}
              </h4>
              <p className="text-gray-600 mb-1">
                Accuracy: {m.accuracy.toFixed(2)}%
              </p>
              <p className="text-gray-600 text-sm">
                Uploaded: {new Date(m.upload_time).toLocaleString()}
              </p>
              <button
                onClick={() => deleteTrainedModel(m.id)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-semibold"
                title="Delete Trained Model"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
