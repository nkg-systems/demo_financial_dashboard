import React, { useState } from 'react';
import { TrendingUp, RefreshCw, BarChart3, Settings } from 'lucide-react';
import StockCard from './components/StockCard';
import StockChart from './components/StockChart';
import SearchBar from './components/SearchBar';
import { useWatchlist, useStockData, useHistoricalData } from './hooks/useStockData';

function App() {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const { watchlist, stocks, loading: watchlistLoading, refetch: refetchWatchlist } = useWatchlist();
  const { stock: selectedStockData, loading: stockLoading } = useStockData(selectedStock);
  const { data: chartData, loading: chartLoading } = useHistoricalData(selectedStock);

  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
  };

  const handleRefresh = () => {
    refetchWatchlist();
  };

  return (
    <div className="min-h-screen bg-dark-bg dark">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-neutral-blue rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-dark-text font-bold text-xl font-mono">
                  Financial Dashboard
                </h1>
                <p className="text-dark-text-secondary text-sm">
                  Real-time stock market data
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <SearchBar onSelect={handleStockSelect} />
              
              <button
                onClick={handleRefresh}
                className="p-2 text-dark-text-secondary hover:text-dark-text hover:bg-dark-card rounded-lg transition-all duration-200"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-dark-text-secondary hover:text-dark-text hover:bg-dark-card rounded-lg transition-all duration-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar - Watchlist */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-dark-text font-semibold text-lg font-mono">
                  Watchlist
                </h2>
                <div className="flex items-center text-sm text-dark-text-secondary">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {watchlist.length} stocks
                </div>
              </div>
              
              <div className="space-y-3">
                {watchlistLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-dark-surface rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  watchlist.map(symbol => {
                    const stock = stocks[symbol];
                    if (!stock) return null;
                    
                    return (
                      <div 
                        key={symbol}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-all duration-200 border
                          ${selectedStock === symbol 
                            ? 'bg-neutral-blue/20 border-neutral-blue' 
                            : 'bg-dark-surface border-dark-border hover:border-dark-text-secondary'
                          }
                        `}
                        onClick={() => handleStockSelect(symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-dark-text font-mono font-semibold">
                              {stock.symbol}
                            </div>
                            <div className="text-dark-text-secondary text-sm">
                              ${stock.price?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                          <div className={`text-sm font-mono ${
                            (stock.change || 0) >= 0 ? 'text-profit-green' : 'text-loss-red'
                          }`}>
                            {(stock.change || 0) >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2) || '0.00'}%
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-8 xl:col-span-9 space-y-8">
            
            {/* Selected Stock Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedStockData && (
                <StockCard 
                  stock={selectedStockData} 
                  className="md:col-span-2 xl:col-span-1"
                />
              )}
              
              {/* Additional metrics cards */}
              {selectedStockData && (
                <>
                  <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                    <h3 className="text-dark-text-secondary text-sm mb-3">52 Week Range</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-dark-text-secondary text-sm">High</span>
                        <span className="text-dark-text font-mono">
                          ${selectedStockData.high52?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-text-secondary text-sm">Low</span>
                        <span className="text-dark-text font-mono">
                          ${selectedStockData.low52?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-dark-surface rounded-full h-2 mt-3">
                        <div 
                          className="bg-neutral-blue h-2 rounded-full"
                          style={{
                            width: selectedStockData.high52 && selectedStockData.low52 ?
                              `${((selectedStockData.price - selectedStockData.low52) / 
                                (selectedStockData.high52 - selectedStockData.low52)) * 100}%` :
                              '50%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                    <h3 className="text-dark-text-secondary text-sm mb-3">Key Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-dark-text-secondary text-sm">P/E Ratio</span>
                        <span className="text-dark-text font-mono">
                          {selectedStockData.pe || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-text-secondary text-sm">Dividend</span>
                        <span className="text-dark-text font-mono">
                          {selectedStockData.dividend ? `$${selectedStockData.dividend}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-text-secondary text-sm">Market Cap</span>
                        <span className="text-dark-text font-mono">
                          {selectedStockData.marketCap || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stock Chart */}
            <StockChart 
              data={chartData} 
              symbol={selectedStock}
              className="animate-fade-in"
            />

            {/* Market Status */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-dark-text font-semibold text-lg font-mono">
                  Market Status
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-profit-green rounded-full animate-pulse"></div>
                  <span className="text-dark-text-secondary text-sm">Live (Demo Mode)</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark-surface rounded-lg">
                  <div className="text-dark-text-secondary text-sm mb-1">NYSE</div>
                  <div className="text-profit-green font-mono font-semibold">Open</div>
                </div>
                <div className="text-center p-4 bg-dark-surface rounded-lg">
                  <div className="text-dark-text-secondary text-sm mb-1">NASDAQ</div>
                  <div className="text-profit-green font-mono font-semibold">Open</div>
                </div>
                <div className="text-center p-4 bg-dark-surface rounded-lg">
                  <div className="text-dark-text-secondary text-sm mb-1">Last Update</div>
                  <div className="text-dark-text font-mono font-semibold">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
