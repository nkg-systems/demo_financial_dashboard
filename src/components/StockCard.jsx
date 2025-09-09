import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StockCard = ({ stock, onClick, className = "" }) => {
  if (!stock) return null;

  const isPositive = stock.change >= 0;
  const isNeutral = stock.change === 0;

  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : price;
  };

  const formatChange = (change) => {
    if (typeof change !== 'number') return change;
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatPercent = (percent) => {
    if (typeof percent !== 'number') return percent;
    return percent >= 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`;
  };

  return (
    <div 
      className={`
        bg-dark-card border border-dark-border rounded-xl p-6 
        hover:bg-dark-surface transition-all duration-300 cursor-pointer
        hover:border-dark-text-secondary hover:shadow-lg
        animate-fade-in ${className}
      `}
      onClick={() => onClick?.(stock.symbol)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-dark-text font-semibold text-lg font-mono">
            {stock.symbol}
          </h3>
          <p className="text-dark-text-secondary text-sm truncate max-w-[200px]">
            {stock.name}
          </p>
        </div>
        <div className="flex items-center">
          {isNeutral ? (
            <Minus className="w-5 h-5 text-dark-text-secondary" />
          ) : isPositive ? (
            <TrendingUp className="w-5 h-5 text-profit-green" />
          ) : (
            <TrendingDown className="w-5 h-5 text-loss-red" />
          )}
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-dark-text font-mono">
          ${formatPrice(stock.price)}
        </div>
      </div>

      {/* Change */}
      <div className="flex items-center justify-between text-sm">
        <div className={`
          flex items-center space-x-2 px-2 py-1 rounded-lg
          ${isNeutral 
            ? 'bg-dark-surface text-dark-text-secondary' 
            : isPositive 
              ? 'bg-profit-green/20 text-profit-green' 
              : 'bg-loss-red/20 text-loss-red'
          }
        `}>
          <span className="font-mono font-medium">
            {formatChange(stock.change)}
          </span>
          <span className="font-mono">
            ({formatPercent(stock.changePercent)})
          </span>
        </div>
      </div>

      {/* Additional Info */}
      {(stock.volume || stock.marketCap) && (
        <div className="mt-4 pt-4 border-t border-dark-border">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {stock.volume && (
              <div>
                <span className="text-dark-text-secondary block">Volume</span>
                <span className="text-dark-text font-mono">{stock.volume}</span>
              </div>
            )}
            {stock.marketCap && (
              <div>
                <span className="text-dark-text-secondary block">Market Cap</span>
                <span className="text-dark-text font-mono">{stock.marketCap}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCard;
