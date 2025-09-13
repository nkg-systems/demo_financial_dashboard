import { lazy, Suspense } from 'react';
import { AlertCircle } from 'lucide-react';

// Lazy load the StockChart component to split the recharts bundle
const StockChart = lazy(() => 
  import('./StockChart.jsx').catch(() => {
    // Fallback in case the chunk fails to load
    return { default: () => <ChartLoadError /> };
  })
);

// Error component for chart loading failures
const ChartLoadError = ({ onRetry }) => (
  <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
    <AlertCircle className="w-12 h-12 text-dark-text-secondary mx-auto mb-4" />
    <h3 className="text-dark-text font-semibold mb-2">Chart failed to load</h3>
    <p className="text-dark-text-secondary text-sm mb-4">There was an issue loading the chart component.</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-neutral-blue text-white rounded-lg hover:bg-neutral-blue/80 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

const LazyStockChart = ({ data, symbol, className = "" }) => {
  return (
    <Suspense fallback={
      <div className={`bg-dark-card border border-dark-border rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-6 bg-dark-surface rounded w-32 mb-2"></div>
              <div className="h-4 bg-dark-surface rounded w-48"></div>
            </div>
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-12 bg-dark-surface rounded-lg"></div>
              ))}
            </div>
          </div>
          
          {/* Chart skeleton */}
          <div className="h-64 bg-dark-surface rounded-lg mb-6 flex items-center justify-center">
            <div className="text-dark-text-secondary text-sm">Loading chart...</div>
          </div>
          
          {/* Stats skeleton */}
          <div className="pt-4 border-t border-dark-border">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-3 bg-dark-surface rounded w-8 mx-auto mb-2"></div>
                  <div className="h-4 bg-dark-surface rounded w-12 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <StockChart data={data} symbol={symbol} className={className} />
    </Suspense>
  );
};

export default LazyStockChart;
