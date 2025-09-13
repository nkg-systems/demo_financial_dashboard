// Simple EventEmitter implementation for browser compatibility
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  removeAllListeners() {
    this.events = {};
  }
}

// WebSocket connection states
export const WS_CONNECTION_STATES = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR'
};

// WebSocket events
export const WS_EVENTS = {
  CONNECTION_STATE_CHANGED: 'connection_state_changed',
  QUOTE_UPDATE: 'quote_update',
  ERROR: 'error',
  RECONNECT_ATTEMPT: 'reconnect_attempt'
};

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.connectionState = WS_CONNECTION_STATES.DISCONNECTED;
    this.subscribedSymbols = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.pingInterval = null;
    this.pingTimeout = null;
    this.apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    
    // Mock data for demo mode
    this.mockMode = !this.apiKey || this.apiKey === 'demo';
    this.mockInterval = null;
    
    // Bind methods to maintain context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  setConnectionState(state) {
    if (this.connectionState !== state) {
      const previousState = this.connectionState;
      this.connectionState = state;
      this.emit(WS_EVENTS.CONNECTION_STATE_CHANGED, {
        currentState: state,
        previousState
      });
      console.log(`WebSocket state changed: ${previousState} → ${state}`);
    }
  }

  connect() {
    if (this.connectionState === WS_CONNECTION_STATES.CONNECTING || 
        this.connectionState === WS_CONNECTION_STATES.CONNECTED) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (this.mockMode) {
        console.log('🔄 Starting WebSocket in demo mode with mock data');
        this.setConnectionState(WS_CONNECTION_STATES.CONNECTED);
        this.startMockUpdates();
        resolve();
        return;
      }

      this.setConnectionState(WS_CONNECTION_STATES.CONNECTING);

      try {
        // Finnhub WebSocket URL
        const wsUrl = `wss://ws.finnhub.io?token=${this.apiKey}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected to Finnhub');
          this.setConnectionState(WS_CONNECTION_STATES.CONNECTED);
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Resubscribe to symbols
          this.subscribedSymbols.forEach(symbol => {
            this.sendSubscription(symbol, 'subscribe');
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.setConnectionState(WS_CONNECTION_STATES.ERROR);
          this.emit(WS_EVENTS.ERROR, error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.setConnectionState(WS_CONNECTION_STATES.DISCONNECTED);
          this.stopHeartbeat();
          
          // Auto-reconnect if not manually closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.setConnectionState(WS_CONNECTION_STATES.ERROR);
        this.emit(WS_EVENTS.ERROR, error);
        reject(error);
      }
    });
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (this.mockMode) {
      this.stopMockUpdates();
      this.setConnectionState(WS_CONNECTION_STATES.DISCONNECTED);
      return;
    }

    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.setConnectionState(WS_CONNECTION_STATES.DISCONNECTED);
  }

  subscribe(symbol) {
    if (!symbol) return;
    
    console.log(`📊 Subscribing to ${symbol}`);
    this.subscribedSymbols.add(symbol);
    
    if (this.connectionState === WS_CONNECTION_STATES.CONNECTED) {
      if (this.mockMode) {
        // In mock mode, we're already generating updates for all symbols
        return;
      }
      this.sendSubscription(symbol, 'subscribe');
    }
  }

  unsubscribe(symbol) {
    if (!symbol) return;
    
    console.log(`📊 Unsubscribing from ${symbol}`);
    this.subscribedSymbols.delete(symbol);
    
    if (this.connectionState === WS_CONNECTION_STATES.CONNECTED && !this.mockMode) {
      this.sendSubscription(symbol, 'unsubscribe');
    }
  }

  sendSubscription(symbol, action) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: action,
        symbol: symbol
      };
      this.ws.send(JSON.stringify(message));
      console.log(`📡 Sent ${action} for ${symbol}`);
    }
  }

  handleMessage(data) {
    if (data.type === 'trade' && data.data && data.data.length > 0) {
      // Finnhub trade data format
      data.data.forEach(trade => {
        const quoteUpdate = {
          symbol: trade.s,
          price: trade.p,
          timestamp: trade.t,
          volume: trade.v
        };
        
        this.emit(WS_EVENTS.QUOTE_UPDATE, quoteUpdate);
      });
    } else if (data.type === 'ping') {
      // Respond to ping with pong
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'pong' }));
      }
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.setConnectionState(WS_CONNECTION_STATES.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState(WS_CONNECTION_STATES.RECONNECTING);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
    
    this.emit(WS_EVENTS.RECONNECT_ATTEMPT, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: this.reconnectDelay
    });

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        this.scheduleReconnect();
      });
    }, this.reconnectDelay);
  }

  startHeartbeat() {
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // Set timeout for pong response
        this.pingTimeout = setTimeout(() => {
          console.warn('⚠️ No pong response, connection may be stale');
          this.ws.close();
        }, 5000);
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  // Mock data generation for demo mode
  startMockUpdates() {
    const mockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC'];
    
    this.mockInterval = setInterval(() => {
      // Generate updates for subscribed symbols
      this.subscribedSymbols.forEach(symbol => {
        if (mockSymbols.includes(symbol)) {
          const basePrice = this.getMockBasePrice(symbol);
          const volatility = 0.002; // 0.2% volatility
          const change = (Math.random() - 0.5) * 2 * volatility;
          const newPrice = basePrice * (1 + change);
          
          const quoteUpdate = {
            symbol: symbol,
            price: Math.round(newPrice * 100) / 100,
            timestamp: Date.now(),
            volume: Math.floor(Math.random() * 1000000) + 100000
          };
          
          this.emit(WS_EVENTS.QUOTE_UPDATE, quoteUpdate);
        }
      });
    }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds
  }

  stopMockUpdates() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  getMockBasePrice(symbol) {
    const prices = {
      'AAPL': 175.43,
      'GOOGL': 138.21,
      'MSFT': 414.78,
      'TSLA': 248.50,
      'NVDA': 118.11,
      'AMZN': 185.45,
      'META': 521.18,
      'NFLX': 682.34,
      'AMD': 144.67,
      'INTC': 21.78
    };
    return prices[symbol] || 100;
  }

  // Utility methods
  getConnectionState() {
    return this.connectionState;
  }

  isConnected() {
    return this.connectionState === WS_CONNECTION_STATES.CONNECTED;
  }

  getSubscribedSymbols() {
    return Array.from(this.subscribedSymbols);
  }

  // Cleanup method
  destroy() {
    this.disconnect();
    this.removeAllListeners();
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
  }
}

// Create and export singleton instance
const websocketService = new WebSocketService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    websocketService.destroy();
  });
}

export default websocketService;
