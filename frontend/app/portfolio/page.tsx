"use client";
// src/app/portfolio/page.tsx
import { useState } from "react";
import StockList from "@/components/portfolio/StockList";
import TransactionForm from "@/components/portfolio/TransactionForm";

type Stock = {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
};

type Transaction = {
  type: "buy" | "sell" | "";
  symbol: string;
  name?: string;
  quantity: number;
  price: number;
};

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<Stock[]>([
    {
      id: 1,
      symbol: "NABIL",
      name: "Nabil Bank Ltd.",
      quantity: 50,
      avgBuyPrice: 950,
      currentPrice: 1020,
    },
    {
      id: 2,
      symbol: "HIDCL",
      name: "Hydropower Investment & Development Company Ltd.",
      quantity: 100,
      avgBuyPrice: 245,
      currentPrice: 270,
    },
    {
      id: 3,
      symbol: "NTC",
      name: "Nepal Telecom",
      quantity: 25,
      avgBuyPrice: 875,
      currentPrice: 840,
    },
  ]);

  const [showTransactionForm, setShowTransactionForm] =
    useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<"buy" | "sell" | "">(
    ""
  );
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>(
    undefined
  );

  const handleAddTransaction = (transaction: Transaction) => {
    if (transaction.type === "buy") {
      const existingStockIndex = portfolio.findIndex(
        (stock) => stock.symbol === transaction.symbol
      );

      if (existingStockIndex >= 0) {
        const existingStock = portfolio[existingStockIndex];
        const totalShares = existingStock.quantity + transaction.quantity;
        const totalCost =
          existingStock.quantity * existingStock.avgBuyPrice +
          transaction.quantity * transaction.price;
        const newAvgPrice = totalCost / totalShares;

        const updatedPortfolio = [...portfolio];
        updatedPortfolio[existingStockIndex] = {
          ...existingStock,
          quantity: totalShares,
          avgBuyPrice: newAvgPrice,
        };

        setPortfolio(updatedPortfolio);
      } else {
        const newStock: Stock = {
          id: Date.now(),
          symbol: transaction.symbol,
          name: transaction.name || transaction.symbol,
          quantity: transaction.quantity,
          avgBuyPrice: transaction.price,
          currentPrice: transaction.price,
        };

        setPortfolio([...portfolio, newStock]);
      }
    } else if (transaction.type === "sell") {
      const existingStockIndex = portfolio.findIndex(
        (stock) => stock.symbol === transaction.symbol
      );

      if (existingStockIndex >= 0) {
        const existingStock = portfolio[existingStockIndex];

        if (existingStock.quantity < transaction.quantity) {
          alert("You don't have enough shares to sell!");
          return;
        }

        const remainingShares = existingStock.quantity - transaction.quantity;

        if (remainingShares === 0) {
          setPortfolio(
            portfolio.filter((stock) => stock.id !== existingStock.id)
          );
        } else {
          const updatedPortfolio = [...portfolio];
          updatedPortfolio[existingStockIndex] = {
            ...existingStock,
            quantity: remainingShares,
          };

          setPortfolio(updatedPortfolio);
        }
      }
    }

    setShowTransactionForm(false);
  };

  const handleBuyClick = () => {
    setTransactionType("buy");
    setSelectedStock(undefined);
    setShowTransactionForm(true);
  };

  const handleSellClick = (stock: Stock) => {
    setTransactionType("sell");
    setSelectedStock(stock);
    setShowTransactionForm(true);
  };

  const totalValue = portfolio.reduce(
    (sum, stock) => sum + stock.quantity * stock.currentPrice,
    0
  );

  const totalInvested = portfolio.reduce(
    (sum, stock) => sum + stock.quantity * stock.avgBuyPrice,
    0
  );

  const totalGainLoss = totalValue - totalInvested;
  const gainLossPercent = (totalGainLoss / totalInvested) * 100;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">My Stock Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Value</h3>
          <p className="text-2xl font-bold">
            NPR {totalValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Invested</h3>
          <p className="text-2xl font-bold">
            NPR {totalInvested.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Gain/Loss</h3>
          <p
            className={`text-2xl font-bold ${
              totalGainLoss >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            NPR {totalGainLoss.toLocaleString()} ({gainLossPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold">My Stocks</h2>
          <button
            onClick={handleBuyClick}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Add Stock
          </button>
        </div>

        <StockList stocks={portfolio} onSellClick={handleSellClick} />
      </div>

      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {transactionType === "buy" ? "Buy Stock" : "Sell Stock"}
            </h2>

            {(transactionType === "buy" || transactionType === "sell") && (
              <TransactionForm
                type={transactionType}
                stock={selectedStock}
                onSubmit={handleAddTransaction}
                onCancel={() => setShowTransactionForm(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
