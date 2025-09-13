import stockService from './stockService';

class PollingService {
  constructor() {
    this.intervalId = null;
    this.subscribers = new Map(); // symbol -> Set of callbacks
    this.isPolling = false;
    this.pollingInterval = 10000; // 10 seconds default
    this.lastFetchTime = new Map(); // symbol -> timestamp
  }

  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol).add(callback);
    
    // Start polling if this is the first subscription
    if (!this.isPolling) {
      this.startPolling();
    }
    
    console.log(`📊 Polling service: Subscribed to ${symbol}`);
  }

  unsubscribe(symbol, callback) {
    if (this.subscribers.has(symbol)) {
      this.subscribers.get(symbol).delete(callback);
      
      // Remove symbol if no more callbacks
      if (this.subscribers.get(symbol).size === 0) {
        this.subscribers.delete(symbol);
        console.log(`📊 Polling service: Unsubscribed from ${symbol}`);
      }
    }
    
    // Stop polling if no more subscriptions
    if (this.subscribers.size === 0) {
      this.stopPolling();
    }
  }

  startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    console.log('🔄 Starting fallback polling service');
    
    // Initial fetch
    this.fetchData();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.fetchData();
    }, this.pollingInterval);
  }

  stopPolling() {
    if (!this.isPolling) return;
    
    console.log('⏹️ Stopping fallback polling service');
    this.isPolling = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async fetchData() {
    if (this.subscribers.size === 0) return;
    
    const symbols = Array.from(this.subscribers.keys());
    console.log(`📡 Polling data for ${symbols.length} symbols`);
    
    // Fetch data for all subscribed symbols
    const promises = symbols.map(async (symbol) => {
      try {
        const data = await stockService.getStockQuote(symbol);
        const now = Date.now();
        
        // Check if this is a significant change or enough time has passed
        const lastFetch = this.lastFetchTime.get(symbol) || 0;
        const timeDiff = now - lastFetch;
        
        // Always notify on first fetch or every 30 seconds
        if (timeDiff > 30000 || !this.lastFetchTime.has(symbol)) {
          this.lastFetchTime.set(symbol, now);
          
          // Notify all subscribers for this symbol
          const callbacks = this.subscribers.get(symbol);
          if (callbacks) {
            const quoteUpdate = {
              symbol: data.symbol,
              price: data.price,
              change: data.change,
              changePercent: data.changePercent,
              timestamp: now,
              source: 'polling'
            };
            
            callbacks.forEach(callback => {
              try {
                callback(quoteUpdate);
              } catch (error) {
                console.error(`Error in polling callback for ${symbol}:`, error);
              }
            });
          }
        }
        
        return data;
      } catch (error) {
        console.error(`Failed to fetch polling data for ${symbol}:`, error);
        return null;
      }
    });
    
    await Promise.allSettled(promises);
  }

  // Utility methods
  getSubscribedSymbols() {
    return Array.from(this.subscribers.keys());
  }

  getSubscriberCount(symbol) {
    return this.subscribers.get(symbol)?.size || 0;
  }

  setPollingInterval(interval) {
    this.pollingInterval = Math.max(interval, 5000); // Minimum 5 seconds
    
    // Restart polling with new interval if currently active
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
  }

  // Cleanup method
  destroy() {
    this.stopPolling();
    this.subscribers.clear();
    this.lastFetchTime.clear();
  }
}

// Create and export singleton instance
const pollingService = new PollingService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    pollingService.destroy();
  });
}

export default pollingService;
