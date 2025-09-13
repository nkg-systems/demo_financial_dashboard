import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import websocketService, { WS_CONNECTION_STATES, WS_EVENTS } from '../services/websocketService';
import pollingService from '../services/pollingService';

// Hook for managing WebSocket connection state
export const useWebSocketConnection = () => {
  const [connectionState, setConnectionState] = useState(websocketService.getConnectionState());
  const [lastError, setLastError] = useState(null);
  const [reconnectInfo, setReconnectInfo] = useState(null);

  useEffect(() => {
    const handleStateChange = ({ currentState }) => {
      setConnectionState(currentState);
    };

    const handleError = (error) => {
      setLastError(error);
    };

    const handleReconnectAttempt = (info) => {
      setReconnectInfo(info);
    };

    // Listen to WebSocket events
    websocketService.on(WS_EVENTS.CONNECTION_STATE_CHANGED, handleStateChange);
    websocketService.on(WS_EVENTS.ERROR, handleError);
    websocketService.on(WS_EVENTS.RECONNECT_ATTEMPT, handleReconnectAttempt);

    // Cleanup listeners
    return () => {
      websocketService.off(WS_EVENTS.CONNECTION_STATE_CHANGED, handleStateChange);
      websocketService.off(WS_EVENTS.ERROR, handleError);
      websocketService.off(WS_EVENTS.RECONNECT_ATTEMPT, handleReconnectAttempt);
    };
  }, []);

  const connect = useCallback(() => {
    return websocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setLastError(null);
    setReconnectInfo(null);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === WS_CONNECTION_STATES.CONNECTED,
    isConnecting: connectionState === WS_CONNECTION_STATES.CONNECTING,
    isReconnecting: connectionState === WS_CONNECTION_STATES.RECONNECTING,
    hasError: connectionState === WS_CONNECTION_STATES.ERROR,
    lastError,
    reconnectInfo,
    connect,
    disconnect
  };
};

// Hook for real-time stock quotes with fallback polling
export const useRealTimeQuotes = (symbols = []) => {
  const [quotes, setQuotes] = useState({});
  const [lastUpdated, setLastUpdated] = useState({});
  const [dataSource, setDataSource] = useState({}); // Track data source per symbol
  const subscribedSymbolsRef = useRef(new Set());
  const { isConnected } = useWebSocketConnection();

  // Handle quote updates from both WebSocket and polling
  const handleQuoteUpdate = useCallback((quoteData) => {
    const { symbol, price, timestamp, source = 'websocket' } = quoteData;
    
    setQuotes(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        price,
        timestamp,
        // Calculate change if we have previous data
        ...(prev[symbol]?.price ? {
          change: price - prev[symbol].price,
          changePercent: ((price - prev[symbol].price) / prev[symbol].price) * 100
        } : {})
      }
    }));

    setLastUpdated(prev => ({
      ...prev,
      [symbol]: timestamp
    }));

    setDataSource(prev => ({
      ...prev,
      [symbol]: source
    }));
  }, []);

  // Subscribe to WebSocket quote updates
  useEffect(() => {
    websocketService.on(WS_EVENTS.QUOTE_UPDATE, handleQuoteUpdate);

    return () => {
      websocketService.off(WS_EVENTS.QUOTE_UPDATE, handleQuoteUpdate);
    };
  }, [handleQuoteUpdate]);

  // Manage subscriptions when symbols change
  useEffect(() => {
    const currentSymbols = new Set(symbols);
    const previousSymbols = subscribedSymbolsRef.current;

    // Unsubscribe from symbols no longer in the list
    previousSymbols.forEach(symbol => {
      if (!currentSymbols.has(symbol)) {
        websocketService.unsubscribe(symbol);
        pollingService.unsubscribe(symbol, handleQuoteUpdate);
      }
    });

    // Subscribe to new symbols
    currentSymbols.forEach(symbol => {
      if (!previousSymbols.has(symbol)) {
        websocketService.subscribe(symbol);
        // Always subscribe to polling as fallback
        pollingService.subscribe(symbol, handleQuoteUpdate);
      }
    });

    subscribedSymbolsRef.current = currentSymbols;

    // Cleanup on unmount
    return () => {
      subscribedSymbolsRef.current.forEach(symbol => {
        websocketService.unsubscribe(symbol);
        pollingService.unsubscribe(symbol, handleQuoteUpdate);
      });
      subscribedSymbolsRef.current.clear();
    };
  }, [symbols, handleQuoteUpdate]);

  const getQuote = useCallback((symbol) => {
    const quote = quotes[symbol];
    if (!quote) return null;
    
    return {
      ...quote,
      isRealTime: dataSource[symbol] === 'websocket' && isConnected,
      dataSource: dataSource[symbol] || 'unknown'
    };
  }, [quotes, dataSource, isConnected]);

  const getLastUpdated = useCallback((symbol) => {
    return lastUpdated[symbol] || null;
  }, [lastUpdated]);

  return {
    quotes,
    lastUpdated,
    dataSource,
    getQuote,
    getLastUpdated,
    isConnected
  };
};

// Hook for combining real-time data with fallback REST data
export const useHybridStockData = (symbol) => {
  const { quotes, getQuote } = useRealTimeQuotes([symbol]);
  const { isConnected } = useWebSocketConnection();
  const [fallbackData, setFallbackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Import stockService dynamically to avoid circular dependencies
  const fetchFallbackData = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      setError(null);
      
      // Dynamic import to avoid circular dependency
      const { default: stockService } = await import('../services/stockService');
      const data = await stockService.getStockQuote(symbol);
      setFallbackData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Fetch fallback data on mount or when WebSocket is disconnected
  useEffect(() => {
    if (!isConnected) {
      fetchFallbackData();
    }
  }, [isConnected, fetchFallbackData]);

  // Combine real-time and fallback data
  const combinedData = useMemo(() => {
    const realtimeQuote = getQuote(symbol);
    
    if (realtimeQuote && isConnected) {
      // Use real-time data as primary source
      return {
        ...fallbackData,
        ...realtimeQuote,
        symbol,
        isRealTime: true
      };
    }
    
    // Fall back to REST API data
    return fallbackData ? { ...fallbackData, isRealTime: false } : null;
  }, [realtimeQuote, fallbackData, isConnected, symbol]);

  return {
    stock: combinedData,
    loading,
    error,
    isRealTime: isConnected && !!getQuote(symbol),
    refetch: fetchFallbackData
  };
};

// Hook for real-time watchlist with WebSocket integration
export const useRealTimeWatchlist = (watchlistSymbols = []) => {
  const { quotes } = useRealTimeQuotes(watchlistSymbols);
  const { isConnected } = useWebSocketConnection();
  const [fallbackData, setFallbackData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch fallback data for watchlist
  const fetchWatchlistData = useCallback(async () => {
    if (watchlistSymbols.length === 0) return;

    try {
      setLoading(true);
      
      // Dynamic import to avoid circular dependency
      const { default: stockService } = await import('../services/stockService');
      const stocksData = {};

      const promises = watchlistSymbols.map(async (symbol) => {
        try {
          const data = await stockService.getStockQuote(symbol);
          stocksData[symbol] = data;
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      });

      await Promise.all(promises);
      setFallbackData(stocksData);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
    } finally {
      setLoading(false);
    }
  }, [watchlistSymbols]);

  // Fetch fallback data on mount or when not connected
  useEffect(() => {
    if (!isConnected || Object.keys(quotes).length === 0) {
      fetchWatchlistData();
    }
  }, [isConnected, fetchWatchlistData, quotes]);

  // Combine real-time and fallback data
  const combinedStocks = useMemo(() => {
    const combined = {};
    
    watchlistSymbols.forEach(symbol => {
      const realtimeQuote = quotes[symbol];
      const fallback = fallbackData[symbol];
      
      if (realtimeQuote && isConnected) {
        // Prefer real-time data
        combined[symbol] = {
          ...fallback,
          ...realtimeQuote,
          symbol,
          isRealTime: true
        };
      } else if (fallback) {
        // Use fallback data
        combined[symbol] = {
          ...fallback,
          isRealTime: false
        };
      }
    });
    
    return combined;
  }, [quotes, fallbackData, watchlistSymbols, isConnected]);

  return {
    watchlist: watchlistSymbols,
    stocks: combinedStocks,
    loading,
    isRealTime: isConnected,
    refetch: fetchWatchlistData
  };
};

// Hook for managing connection lifecycle
export const useWebSocketManager = () => {
  const connection = useWebSocketConnection();

  // Auto-connect on mount
  useEffect(() => {
    if (connection.connectionState === WS_CONNECTION_STATES.DISCONNECTED) {
      connection.connect().catch(error => {
        console.error('Failed to establish WebSocket connection:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (connection.isConnected) {
        connection.disconnect();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return connection;
};
