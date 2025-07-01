"use client";

import CandlestickChart from "@/components/dashboard/CandlestickChart";

interface Prediction {
  date: string;
  close: number;
  lowerBound: number;
  upperBound: number;
}

interface PredictionResultsProps {
  predictions: Prediction[];
  modelAccuracy: number;
}

export default function PredictionResults({
  predictions,
  modelAccuracy,
}: PredictionResultsProps) {
  console.log("Prediction results:", predictions);
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Future Predictions</h3>
          <div className="bg-gray-100 p-6 rounded border text-center">
            <p className="text-gray-500"></p>

            <div className="mt-4">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Date</th>
                    <th className="py-2 px-4 border-b">Predicted Close</th>
                    <th className="py-2 px-4 border-b">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions &&
                    predictions.map((item, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : ""}
                      >
                        <td className="py-2 px-4 border-b">{item.date}</td>
                        <td className="py-2 px-4 border-b">
                          {item.close.toFixed(2)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {item.lowerBound.toFixed(2)} -{" "}
                          {item.upperBound.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Prediction Analysis</h3>
          <div className="bg-white p-6 rounded border shadow-sm">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">
                  Prediction Accuracy
                </h4>
                <div className="mt-1 h-4 bg-gray-200 rounded-full">
                  <div
                    className="h-4 bg-green-500 rounded-full"
                    style={{ width: `${modelAccuracy}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {modelAccuracy}% accuracy based on historical testing
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Model Confidence</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">Low</span>
                  <div className="mx-2 flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${modelAccuracy}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">High</span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-700">Recommendation</h4>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-blue-800">
                    Based on the prediction model, there's a potential for
                    growth in the next 5 trading days. Consider reviewing your
                    portfolio strategy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Technical Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border shadow-sm">
            <h4 className="font-medium text-gray-700">Moving Average</h4>
            <p className="text-2xl font-bold mt-2">1,045.23</p>
            <p className="text-sm text-green-600 flex items-center">
              <span>↑ 2.3%</span>
              <span className="ml-1">above 50-day MA</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded border shadow-sm">
            <h4 className="font-medium text-gray-700">RSI (14)</h4>
            <p className="text-2xl font-bold mt-2">58.7</p>
            <p className="text-sm text-gray-600">Neutral</p>
          </div>

          <div className="bg-white p-4 rounded border shadow-sm">
            <h4 className="font-medium text-gray-700">MACD</h4>
            <p className="text-2xl font-bold mt-2">12.4</p>
            <p className="text-sm text-green-600">Bullish Signal</p>
          </div>
        </div>
      </div> */}
    </div>
  );
}
