import axios from 'axios';

// Using Finnhub API (free tier available)
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';
const BASE_URL = 'https://finnhub.io/api/v1';

// Mock data for demo purposes (when API key is not available)
const mockStockData = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.43,
    change: 2.34,
    changePercent: 1.35,
    marketCap: '2.75T',
    volume: '45.2M',
    pe: 28.5,
    dividend: 0.96,
    high52: 198.23,
    low52: 124.17
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 138.21,
    change: -0.89,
    changePercent: -0.64,
    marketCap: '1.74T',
    volume: '28.1M',
    pe: 25.2,
    dividend: 0.00,
    high52: 153.78,
    low52: 83.34
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 414.78,
    change: 5.67,
    changePercent: 1.39,
    marketCap: '3.08T',
    volume: '19.8M',
    pe: 32.1,
    dividend: 3.00,
    high52: 468.35,
    low52: 309.45
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.50,
    change: -3.21,
    changePercent: -1.27,
    marketCap: '791B',
    volume: '67.3M',
    pe: 62.8,
    dividend: 0.00,
    high52: 299.29,
    low52: 138.80
  },
  'NVDA': {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 118.11,
    change: 1.89,
    changePercent: 1.63,
    marketCap: '2.91T',
    volume: '312.5M',
    pe: 65.7,
    dividend: 0.16,
    high52: 140.76,
    low52: 39.23
  }
};

// Generate mock historical data
const generateMockHistoricalData = (symbol, days = 30) => {
  const basePrice = mockStockData[symbol]?.price || 100;
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic price movement
    const volatility = 0.02; // 2% daily volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const price = basePrice * (1 + randomChange * (days - i) / days);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 50000000) + 10000000
    });
  }
  
  return data;
};

class StockService {
  async getStockQuote(symbol) {
    try {
      if (FINNHUB_API_KEY === 'demo') {
        // Return mock data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        return mockStockData[symbol] || mockStockData['AAPL'];
      }

      const response = await axios.get(`${BASE_URL}/quote`, {
        params: {
          symbol: symbol,
          token: FINNHUB_API_KEY
        }
      });

      const profileResponse = await axios.get(`${BASE_URL}/stock/profile2`, {
        params: {
          symbol: symbol,
          token: FINNHUB_API_KEY
        }
      });

      const quote = response.data;
      const profile = profileResponse.data;

      return {
        symbol: symbol,
        name: profile.name,
        price: quote.c, // Current price
        change: quote.d, // Change
        changePercent: quote.dp, // Change percent
        high: quote.h, // High price of the day
        low: quote.l, // Low price of the day
        open: quote.o, // Open price of the day
        previousClose: quote.pc, // Previous close price
        marketCap: profile.marketCapitalization,
        volume: quote.v // Volume
      };
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      // Fallback to mock data
      return mockStockData[symbol] || mockStockData['AAPL'];
    }
  }

  async getHistoricalData(symbol, days = 30) {
    try {
      if (FINNHUB_API_KEY === 'demo') {
        // Return mock historical data
        await new Promise(resolve => setTimeout(resolve, 300));
        return generateMockHistoricalData(symbol, days);
      }

      const to = Math.floor(Date.now() / 1000);
      const from = to - (days * 24 * 60 * 60);

      const response = await axios.get(`${BASE_URL}/stock/candle`, {
        params: {
          symbol: symbol,
          resolution: 'D',
          from: from,
          to: to,
          token: FINNHUB_API_KEY
        }
      });

      const data = response.data;
      
      if (data.s === 'ok') {
        return data.t.map((timestamp, index) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          price: data.c[index], // Close price
          open: data.o[index],
          high: data.h[index],
          low: data.l[index],
          volume: data.v[index]
        }));
      }
      
      // Fallback to mock data
      return generateMockHistoricalData(symbol, days);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return generateMockHistoricalData(symbol, days);
    }
  }

  async searchStocks(query) {
    try {
      if (FINNHUB_API_KEY === 'demo') {
        // Return filtered mock data
        await new Promise(resolve => setTimeout(resolve, 200));
        const results = Object.values(mockStockData)
          .filter(stock => 
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase())
          );
        return results.slice(0, 5);
      }

      const response = await axios.get(`${BASE_URL}/search`, {
        params: {
          q: query,
          token: FINNHUB_API_KEY
        }
      });

      return response.data.result.slice(0, 10).map(item => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type
      }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  getWatchlistStocks() {
    // Default watchlist
    return ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
  }
}

export default new StockService();
