import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Wifi, Activity, Settings } from 'lucide-react';
import { useWebSocketConnection, useRealTimeQuotes } from '../hooks/useWebSocket';
import ConnectionStatus, { CompactConnectionStatus } from './ConnectionStatus';
import { WS_CONNECTION_STATES } from '../services/websocketService';

const WebSocketDemo = () => {
  const [testSymbols, setTestSymbols] = useState(['AAPL', 'GOOGL', 'MSFT']);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { connectionState, connect, disconnect, isConnected, lastError, reconnectInfo } = useWebSocketConnection();
  const { quotes, lastUpdated, getQuote, dataSource } = useRealTimeQuotes(testSymbols);

  const handleToggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTED: return 'text-profit-green';
      case WS_CONNECTION_STATES.CONNECTING: return 'text-yellow-500';
      case WS_CONNECTION_STATES.RECONNECTING: return 'text-orange-500';
      case WS_CONNECTION_STATES.ERROR: return 'text-loss-red';
      default: return 'text-dark-text-secondary';
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-neutral-blue" />
          <div>
            <h3 className="text-dark-text font-semibold text-lg font-mono">
              WebSocket Demo
            </h3>
            <p className="text-dark-text-secondary text-sm">
              Real-time stock data testing
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="p-2 text-dark-text-secondary hover:text-dark-text hover:bg-dark-surface rounded-lg transition-all"
            title="Toggle debug info"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-surface rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-dark-text font-medium">Connection Status</h4>
            <CompactConnectionStatus />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-dark-text-secondary text-sm">State:</span>
              <span className={`text-sm font-mono ${getConnectionStatusColor()}`}>
                {connectionState}
              </span>
            </div>
            
            {reconnectInfo && (
              <div className="flex justify-between">
                <span className="text-dark-text-secondary text-sm">Retry:</span>
                <span className="text-sm font-mono text-yellow-500">
                  {reconnectInfo.attempt}/{reconnectInfo.maxAttempts}
                </span>
              </div>
            )}
            
            {lastError && (
              <div className="text-loss-red text-xs font-mono bg-loss-red/10 p-2 rounded">
                Error: {lastError.message || 'Connection failed'}
              </div>
            )}
          </div>
          
          <button
            onClick={handleToggleConnection}
            className={`
              mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
              ${isConnected 
                ? 'bg-loss-red/20 text-loss-red hover:bg-loss-red/30' 
                : 'bg-profit-green/20 text-profit-green hover:bg-profit-green/30'
              }
            `}
          >
            {isConnected ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Disconnect</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Connect</span>
              </>
            )}
          </button>
        </div>

        {/* Live Data Preview */}
        <div className="bg-dark-surface rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-dark-text font-medium">Live Data</h4>
            <div className="flex items-center space-x-1">
              {isConnected && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-profit-green rounded-full animate-pulse"></div>
                  <span className="text-xs text-profit-green font-mono">LIVE</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {testSymbols.map(symbol => {
              const quote = getQuote(symbol);
              const updated = lastUpdated[symbol];
              
              return (
                <div key={symbol} className="flex justify-between items-center p-2 bg-dark-card rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-dark-text font-mono font-medium">{symbol}</span>
                    {quote?.dataSource === 'websocket' && (
                      <Wifi className="w-3 h-3 text-profit-green" />
                    )}
                  </div>
                  
                  <div className="text-right">
                    {quote ? (
                      <>
                        <div className="text-dark-text font-mono">
                          ${quote.price?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-dark-text-secondary">
                          {formatTimestamp(updated)}
                        </div>
                      </>
                    ) : (
                      <div className="text-dark-text-secondary text-sm">
                        No data
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="bg-dark-surface rounded-lg p-4">
          <h4 className="text-dark-text font-medium mb-3 flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Debug Information</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="text-dark-text-secondary font-medium mb-2">Data Sources:</h5>
              <div className="space-y-1">
                {testSymbols.map(symbol => (
                  <div key={symbol} className="flex justify-between">
                    <span className="font-mono">{symbol}:</span>
                    <span className={`font-mono ${
                      dataSource[symbol] === 'websocket' ? 'text-profit-green' : 'text-yellow-500'
                    }`}>
                      {dataSource[symbol] || 'none'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-dark-text-secondary font-medium mb-2">Raw Data:</h5>
              <div className="bg-dark-card p-2 rounded text-xs font-mono overflow-auto max-h-32">
                <pre>{JSON.stringify({
                  connectionState,
                  isConnected,
                  quotes: Object.keys(quotes).reduce((acc, key) => {
                    acc[key] = { 
                      price: quotes[key]?.price, 
                      timestamp: quotes[key]?.timestamp,
                      source: dataSource[key]
                    };
                    return acc;
                  }, {})
                }, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
        <h4 className="text-dark-text font-medium mb-2">How to Test:</h4>
        <ul className="text-dark-text-secondary text-sm space-y-1">
          <li>• <strong>Demo Mode:</strong> Uses mock WebSocket data with realistic price changes</li>
          <li>• <strong>Connection Toggle:</strong> Use the Connect/Disconnect button to test reconnection</li>
          <li>• <strong>Real-time Updates:</strong> Prices update automatically every 1-3 seconds</li>
          <li>• <strong>Fallback:</strong> When disconnected, switches to polling mode automatically</li>
          <li>• <strong>Status Indicators:</strong> Green dot = live data, Yellow = fallback</li>
        </ul>
      </div>
    </div>
  );
};

export default WebSocketDemo;
