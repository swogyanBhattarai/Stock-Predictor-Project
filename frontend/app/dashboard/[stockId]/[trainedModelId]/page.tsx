"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CandlestickChart from "@/components/dashboard/CandlestickChart";
import PredictionResults from "@/components/dashboard/PredictionResults";

type PredictionDetails = {
  id: number;
  filename: string;
  accuracy: number;
  upload_time: string;
  original: any[]; // Replace with accurate type if possible
  prediction: any[]; // Replace with accurate type if possible
};

export default function TrainedModelPage() {
  const { trainedModelId } = useParams();
  const [data, setData] = useState<PredictionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setError("Unauthorized. Please log in.");
      setLoading(false);
      return;
    }
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch(`http://localhost:5000/api/trained-models/${trainedModelId}`, {
      headers: { Authorization: token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch trained model data.");
        return res.json();
      })
      .then((json) => {
        console.log("Trained model JSON response:", json);
        const parsedOriginal =
          typeof json.original === "string"
            ? JSON.parse(json.original)
            : json.original;

        const fullData = {
          ...json,
          original: parsedOriginal,
        };

        setData(fullData);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Something went wrong.");
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [trainedModelId, token]);

  if (loading)
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-gray-600">
          Loading trained model data...
        </p>
      </div>
    );

  console.log("Trained model json loaded:", data);
  console.log("Prediction data json:", data?.prediction);
  console.log("Original data json:", data?.original);

  if (error)
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-red-600 font-semibold">{error}</p>
      </div>
    );

  if (!data)
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-gray-600">
          No trained model data found.
        </p>
      </div>
    );

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-2">{data.filename}</h1>
        <p className="text-gray-700 mb-1">
          Accuracy: {data.accuracy.toFixed(2)}%
        </p>
        <p className="text-gray-600 text-sm">
          Uploaded: {new Date(data.upload_time).toLocaleString()}
        </p>
      </div>

      {/* Historical Candlestick Chart */}
      {data.original?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Historical Stock Data</h2>
          <CandlestickChart
            data={data.original}
            title="Historical Stock Prices"
          />
        </div>
      )}

      {/* Prediction Chart */}
      {data.prediction?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>
          <PredictionResults
            predictions={data.prediction}
            modelAccuracy={data.accuracy}
          />
        </div>
      )}

      {data.prediction?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-4">Predicted Stock Prices</h2>
          <CandlestickChart
            data={data.prediction}
            title="Predicted Stock Prices"
          />
        </div>
      )}
    </div>
  );
}
