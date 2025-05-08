"use client";

import React, { useState, useEffect } from "react";
import PlotlyChart from "@/components/PlotlyChart";

interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  title: string;
}

export default function CandlestickChart({
  data,
  title,
}: CandlestickChartProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{title}</h3>

      {/* Placeholder for chart */}
      <div className="bg-gray-100 p-6 rounded border text-center">
        <PlotlyChart />
        {/* <p className="mt-2 text-sm text-gray-400">
          For production, implement using Chart.js, Recharts, or a financial
          chart library
        </p> */}

        {/* Display data in a table format as fallback */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Open</th>
                <th className="py-2 px-4 border-b">High</th>
                <th className="py-2 px-4 border-b">Low</th>
                <th className="py-2 px-4 border-b">Close</th>
                <th className="py-2 px-4 border-b">Volume</th>
              </tr>
            </thead>
            <tbody>
              {data &&
                data.slice(0, 5).map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <td className="py-2 px-4 border-b">{item.date}</td>
                    <td className="py-2 px-4 border-b">{"N/A"}</td>
                    <td className="py-2 px-4 border-b">
                      {item.high.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {item.low.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {item.close.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b">{item.volume}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {data && data.length > 5 && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              Showing 5 of {data.length} records
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
