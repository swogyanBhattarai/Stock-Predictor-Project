// src/app/page.tsx
"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // adjust path as needed

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold mb-6">
        Welcome to NEPSE Stock Predictor
      </h1>
      <p className="text-xl mb-8 max-w-2xl">
        Upload your NEPSE trading data, get AI-powered predictions, and manage
        your stock portfolio easily.
      </p>

      {!isAuthenticated ? (
        <div className="flex gap-4">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg"
          >
            Register
          </Link>
        </div>
      ) : (
        <div>
          {/* <Link
            href="/portfolio"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 m-5 rounded-md font-medium"
          >
            Go to Portfolio
          </Link> */}
          <Link
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 m-5 rounded-md font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Upload Trading Data</h3>
          <p>
            Upload your NEPSE trading data in CSV format and get instant
            analysis.
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">AI-Powered Predictions</h3>
          <p>
            Get accurate predictions based on LSTM model trained on your data.
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Portfolio Management</h3>
          <p>
            Track your stock transactions and monitor your portfolio
            performance.
          </p>
        </div>
      </div>
    </div>
  );
}
