// src/components/portfolio/TransactionForm.tsx
import { useState, useEffect, FormEvent } from 'react';

type TransactionType = 'buy' | 'sell';

type Stock = {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
};

type Props = {
  type: TransactionType;
  stock?: Stock;
  onSubmit: (data: {
    type: TransactionType;
    symbol: string;
    name: string;
    quantity: number;
    price: number;
  }) => void;
  onCancel: () => void;
};

export default function TransactionForm({ type, stock, onSubmit, onCancel }: Props) {
  const [symbol, setSymbol] = useState<string>(stock ? stock.symbol : '');
  const [name, setName] = useState<string>(stock ? stock.name : '');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>(stock ? stock.currentPrice.toString() : '');

  useEffect(() => {
    if (stock) {
      setSymbol(stock.symbol);
      setName(stock.name);
      setPrice(stock.currentPrice.toString());
    }
  }, [stock]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!symbol || !quantity || !price) {
      alert('Please fill all required fields');
      return;
    }

    if (isNaN(Number(quantity)) || isNaN(Number(price)) || Number(quantity) <= 0 || Number(price) <= 0) {
      alert('Quantity and price must be positive numbers');
      return;
    }

    onSubmit({
      type,
      symbol,
      name,
      quantity: Number(quantity),
      price: Number(price),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700">
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            disabled={type === 'sell'}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {type === 'buy' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          {type === 'sell' && stock && (
            <p className="text-sm text-gray-500 mt-1">Available: {stock.quantity} shares</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            {type === 'buy' ? 'Buy Price (NPR)' : 'Sell Price (NPR)'}
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="pt-2">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${
                type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'buy' ? 'focus:ring-green-500' : 'focus:ring-red-500'
              }`}
            >
              {type === 'buy' ? 'Buy Stock' : 'Sell Stock'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
