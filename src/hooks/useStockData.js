import { useState, useEffect, useCallback } from 'react';
import stockService from '../services/stockService';

export const useStockData = (symbol) => {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStock = useCallback(async (stockSymbol) => {
    if (!stockSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await stockService.getStockQuote(stockSymbol);
      setStock(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (symbol) {
      fetchStock(symbol);
    }
  }, [symbol, fetchStock]);

  return { stock, loading, error, refetch: () => fetchStock(symbol) };
};

export const useHistoricalData = (symbol, days = 30) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistoricalData = useCallback(async (stockSymbol, period) => {
    if (!stockSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const historicalData = await stockService.getHistoricalData(stockSymbol, period);
      setData(historicalData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (symbol) {
      fetchHistoricalData(symbol, days);
    }
  }, [symbol, days, fetchHistoricalData]);

  return { data, loading, error, refetch: () => fetchHistoricalData(symbol, days) };
};

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const symbols = stockService.getWatchlistStocks();
    setWatchlist(symbols);
  }, []);

  const fetchWatchlistData = useCallback(async () => {
    if (watchlist.length === 0) return;
    
    setLoading(true);
    const stocksData = {};
    
    try {
      const promises = watchlist.map(async (symbol) => {
        const data = await stockService.getStockQuote(symbol);
        stocksData[symbol] = data;
      });
      
      await Promise.all(promises);
      setStocks(stocksData);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchWatchlistData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWatchlistData, 30000);
    return () => clearInterval(interval);
  }, [fetchWatchlistData]);

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setStocks(prev => {
      const newStocks = { ...prev };
      delete newStocks[symbol];
      return newStocks;
    });
  };

  return {
    watchlist,
    stocks,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    refetch: fetchWatchlistData
  };
};
