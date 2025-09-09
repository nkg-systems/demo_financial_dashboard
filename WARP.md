# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a modern financial dashboard built with React, Vite, and Tailwind CSS. It displays real-time stock market data with interactive charts and a sleek dark theme. The application fetches stock data from financial APIs and presents it in a clean, minimalistic interface.

## Technology Stack

- **Frontend Framework**: React 18 with Vite for fast development
- **Styling**: Tailwind CSS with custom dark theme colors
- **Charts**: Recharts for interactive financial data visualization
- **Icons**: Lucide React for modern, consistent icons
- **API Client**: Axios for HTTP requests
- **Stock Data**: Finnhub API (with fallback to mock data for demo)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── StockCard.jsx   # Individual stock display card
│   ├── StockChart.jsx  # Interactive price chart
│   └── SearchBar.jsx   # Stock search functionality
├── hooks/              # Custom React hooks
│   └── useStockData.js # Stock data state management
├── services/           # API services
│   └── stockService.js # Stock data fetching logic
├── App.jsx            # Main application component
├── main.jsx           # Application entry point
└── index.css          # Global styles and Tailwind directives
```

## API Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# For real data, get a free API key from https://finnhub.io
VITE_FINNHUB_API_KEY=your_api_key_here

# Leave as 'demo' to use mock data
VITE_FINNHUB_API_KEY=demo
```

### Stock Data Service
The `stockService.js` handles:
- Real-time stock quotes
- Historical price data (30-day charts)
- Stock search functionality
- Automatic fallback to mock data for demos

## Architecture

### Component Architecture
- **App.jsx**: Main dashboard layout with sidebar and content areas
- **StockCard**: Displays individual stock information with price, change, and metrics
- **StockChart**: Interactive line chart showing historical price data
- **SearchBar**: Auto-complete search for adding stocks to watchlist

### State Management
- **useWatchlist**: Manages watchlist stocks with auto-refresh every 30 seconds
- **useStockData**: Fetches and caches individual stock quotes
- **useHistoricalData**: Manages chart data for selected stocks

### Dark Theme Design
Custom Tailwind colors optimized for financial data:
- `dark-bg`: Deep background color (#0a0a0f)
- `dark-surface`: Card backgrounds (#1a1a23)
- `dark-card`: Component backgrounds (#252530)
- `profit-green`: Positive changes (#22c55e)
- `loss-red`: Negative changes (#ef4444)

## Security Considerations

Financial applications require special attention to:
- Data encryption in transit and at rest
- Input validation and sanitization
- Secure API authentication (JWT, OAuth)
- Audit logging for financial transactions
- Compliance with financial regulations (depending on jurisdiction)

## Development Workflow

### Adding New Stocks
1. Use the search bar in the header to find stocks
2. Click on search results to view detailed information
3. Stocks are automatically added to the main view

### Customizing the Watchlist
- Default watchlist includes: AAPL, GOOGL, MSFT, TSLA, NVDA
- Modify `stockService.getWatchlistStocks()` to change default stocks
- Watchlist auto-refreshes every 30 seconds

### Adding New Components
- Place React components in `/src/components/`
- Use Tailwind classes with the custom dark theme colors
- Follow the established pattern of card-based layouts

### Data Handling
- All financial data uses proper decimal precision
- Price changes show both absolute and percentage values
- Mock data is realistic and includes proper financial metrics

## Key Features

### Current Implementation
- **Real-time Stock Data**: Live quotes with price changes and percentages
- **Interactive Charts**: 30-day price history with hover tooltips
- **Watchlist Management**: Track multiple stocks with auto-refresh
- **Stock Search**: Find and add new stocks to monitor
- **Dark Theme UI**: Optimized for extended viewing with minimal eye strain
- **Responsive Design**: Works on desktop and mobile devices

### Dashboard Components
- **Header**: Navigation with search and refresh controls
- **Sidebar**: Watchlist with quick stock selection
- **Main Panel**: Selected stock details, metrics, and price chart
- **Market Status**: Real-time market information display

## Deployment

### Development
```bash
npm run dev    # Start development server on http://localhost:5173
```

### Production Build
```bash
npm run build     # Build optimized production bundle
npm run preview   # Preview production build locally
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Add your Finnhub API key (or leave as 'demo' for mock data)
3. Run `npm install` and `npm run dev`

## Customization

### Theme Colors
Modify `tailwind.config.js` to customize the dark theme colors:
- Background colors: `dark-bg`, `dark-surface`, `dark-card`
- Text colors: `dark-text`, `dark-text-secondary`
- Financial colors: `profit-green`, `loss-red`, `neutral-blue`

### Stock Data
- **Mock Mode**: Uses realistic sample data for 5 major stocks
- **Live Mode**: Integrates with Finnhub API for real market data
- **Extensible**: Easy to add support for additional data providers

---

*The dashboard is fully functional and ready for development or deployment.*
