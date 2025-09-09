import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const StockChart = ({ data, symbol, className = "" }) => {
  const [timeframe, setTimeframe] = useState('30');

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  // Determine if trend is positive or negative
  const isPositiveTrend = data.length > 1 && data[data.length - 1].price > data[0].price;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-dark-text-secondary text-sm mb-1">
            {new Date(label).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-dark-text font-mono font-semibold">
            Price: {formatPrice(data.price)}
          </p>
          {data.volume && (
            <p className="text-dark-text-secondary text-sm font-mono">
              Volume: {(data.volume / 1000000).toFixed(1)}M
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-dark-card border border-dark-border rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-dark-text font-semibold text-lg font-mono">
            {symbol} Price Chart
          </h3>
          <p className="text-dark-text-secondary text-sm">
            {data.length} days • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        {/* Timeframe buttons */}
        <div className="flex space-x-2">
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`
                px-3 py-1 rounded-lg text-sm font-mono transition-all duration-200
                ${timeframe === days 
                  ? 'bg-neutral-blue text-white' 
                  : 'bg-dark-surface text-dark-text-secondary hover:bg-dark-border'
                }
              `}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
              <XAxis 
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#a5a5a7"
                fontSize={12}
                tick={{ fontFamily: 'JetBrains Mono' }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="#a5a5a7"
                fontSize={12}
                tick={{ fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={isPositiveTrend ? "#22c55e" : "#ef4444"}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: isPositiveTrend ? "#22c55e" : "#ef4444",
                  stroke: "#1a1a23",
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-dark-text-secondary text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-dark-surface rounded w-32 mx-auto mb-2"></div>
                <div className="h-3 bg-dark-surface rounded w-24 mx-auto"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Statistics */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-dark-border">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-dark-text-secondary text-xs mb-1">High</p>
              <p className="text-dark-text font-mono font-semibold">
                {formatPrice(Math.max(...data.map(d => d.price)))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-dark-text-secondary text-xs mb-1">Low</p>
              <p className="text-dark-text font-mono font-semibold">
                {formatPrice(Math.min(...data.map(d => d.price)))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-dark-text-secondary text-xs mb-1">Avg Volume</p>
              <p className="text-dark-text font-mono font-semibold">
                {data[0]?.volume ? 
                  `${(data.reduce((sum, d) => sum + (d.volume || 0), 0) / data.length / 1000000).toFixed(1)}M` :
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockChart;
