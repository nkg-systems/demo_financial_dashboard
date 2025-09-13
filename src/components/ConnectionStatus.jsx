import React from 'react';
import { Wifi, WifiOff, AlertCircle, RotateCcw } from 'lucide-react';
import { useWebSocketConnection } from '../hooks/useWebSocket';
import { WS_CONNECTION_STATES } from '../services/websocketService';

const ConnectionStatus = ({ className = '' }) => {
  const { 
    connectionState, 
    isConnected, 
    isConnecting, 
    isReconnecting, 
    hasError, 
    reconnectInfo,
    connect 
  } = useWebSocketConnection();

  const getStatusConfig = () => {
    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTED:
        return {
          icon: Wifi,
          text: 'Live',
          subtext: 'Real-time data',
          color: 'text-profit-green',
          bgColor: 'bg-profit-green/20',
          borderColor: 'border-profit-green/30',
          pulse: true
        };
      
      case WS_CONNECTION_STATES.CONNECTING:
        return {
          icon: RotateCcw,
          text: 'Connecting',
          subtext: 'Establishing connection...',
          color: 'text-neutral-blue',
          bgColor: 'bg-neutral-blue/20',
          borderColor: 'border-neutral-blue/30',
          spin: true
        };
      
      case WS_CONNECTION_STATES.RECONNECTING:
        return {
          icon: RotateCcw,
          text: 'Reconnecting',
          subtext: reconnectInfo ? `Attempt ${reconnectInfo.attempt}/${reconnectInfo.maxAttempts}` : 'Retrying...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          spin: true
        };
      
      case WS_CONNECTION_STATES.ERROR:
        return {
          icon: AlertCircle,
          text: 'Error',
          subtext: 'Connection failed',
          color: 'text-loss-red',
          bgColor: 'bg-loss-red/20',
          borderColor: 'border-loss-red/30'
        };
      
      case WS_CONNECTION_STATES.DISCONNECTED:
      default:
        return {
          icon: WifiOff,
          text: 'Offline',
          subtext: 'Using cached data',
          color: 'text-dark-text-secondary',
          bgColor: 'bg-dark-surface',
          borderColor: 'border-dark-border'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleRetryClick = () => {
    if (hasError || connectionState === WS_CONNECTION_STATES.DISCONNECTED) {
      connect().catch(error => {
        console.error('Manual reconnection failed:', error);
      });
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Status Indicator */}
      <div className={`
        relative flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-300
        ${config.bgColor} ${config.borderColor}
      `}>
        <div className="relative">
          <Icon 
            className={`w-4 h-4 ${config.color} transition-colors duration-300 ${
              config.spin ? 'animate-spin' : ''
            }`} 
          />
          {config.pulse && (
            <div className="absolute inset-0 w-4 h-4 bg-profit-green rounded-full animate-ping opacity-20"></div>
          )}
        </div>
        
        <div className="text-sm">
          <div className={`font-medium ${config.color}`}>
            {config.text}
          </div>
          <div className="text-xs text-dark-text-secondary">
            {config.subtext}
          </div>
        </div>

        {/* Retry button for error states */}
        {(hasError || connectionState === WS_CONNECTION_STATES.DISCONNECTED) && (
          <button
            onClick={handleRetryClick}
            className="ml-2 p-1 rounded hover:bg-dark-card transition-colors"
            title="Retry connection"
          >
            <RotateCcw className="w-3 h-3 text-dark-text-secondary hover:text-dark-text" />
          </button>
        )}
      </div>

      {/* Detailed status tooltip */}
      <div className="hidden lg:block">
        {isConnected && (
          <div className="text-xs text-dark-text-secondary">
            WebSocket connected
          </div>
        )}
        {isReconnecting && reconnectInfo && (
          <div className="text-xs text-yellow-500">
            Retry in {Math.round(reconnectInfo.delay / 1000)}s
          </div>
        )}
      </div>
    </div>
  );
};

// Compact version for mobile/small spaces
export const CompactConnectionStatus = ({ className = '' }) => {
  const { connectionState } = useWebSocketConnection();

  const getIndicatorColor = () => {
    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTED:
        return 'bg-profit-green';
      case WS_CONNECTION_STATES.CONNECTING:
      case WS_CONNECTION_STATES.RECONNECTING:
        return 'bg-yellow-500';
      case WS_CONNECTION_STATES.ERROR:
        return 'bg-loss-red';
      default:
        return 'bg-dark-text-secondary';
    }
  };

  const shouldPulse = connectionState === WS_CONNECTION_STATES.CONNECTED;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div className={`
          w-2 h-2 rounded-full transition-colors duration-300
          ${getIndicatorColor()}
          ${shouldPulse ? 'animate-pulse' : ''}
        `}></div>
        {shouldPulse && (
          <div className="absolute inset-0 w-2 h-2 bg-profit-green rounded-full animate-ping opacity-40"></div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
