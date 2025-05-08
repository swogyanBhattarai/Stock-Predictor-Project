"use client";

import { useState } from "react";
import FileUpload from "@/components/dashboard/FileUpload";
import CandlestickChart from "@/components/dashboard/CandlestickChart";
import PredictionResults from "@/components/dashboard/PredictionResults";

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  lowerBound?: number;
  upperBound?: number;
}

interface Prediction extends StockData {
  lowerBound: number;
  upperBound: number;
}

export default function Dashboard() {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictionData, setPredictionData] = useState<Prediction[] | null>(
    null
  );
  const [originalData, setOriginalData] = useState<StockData[] | null>(null);
  const [modelAccuracy, setModelAccuracy] = useState<number | null>(null);

  const handleFileUpload = async (file: File): Promise<void> => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json(); // { original, prediction }

      setOriginalData(data.original);
      setPredictionData(data.prediction);

      const accuracyRes = await fetch("http://localhost:5000/accuracy");
      if (!accuracyRes.ok) {
        throw new Error("Failed to fetch model accuracy");
      }
      const accuracyData = await accuracyRes.json(); // { accuracy: 85 }
      setModelAccuracy(accuracyData.accuracy);

      setIsUploaded(true);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to upload and process the file." + err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Stock Prediction Dashboard</h1>

      {!isUploaded ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Upload Trading Data</h2>
          <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Historical Stock Data
            </h2>
            {originalData && (
              <CandlestickChart
                data={originalData}
                title="Historical Stock Prices"
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>
            {predictionData && (
              <PredictionResults
                predictions={predictionData}
                modelAccuracy={modelAccuracy as number}
              />
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setIsUploaded(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
            >
              Upload New Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
