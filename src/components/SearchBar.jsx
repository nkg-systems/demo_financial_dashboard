import { Search } from 'lucide-react';
import { useState } from 'react';
import stockService from '../services/stockService';

const SearchBar = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const data = await stockService.searchStocks(value);
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-dark-surface border border-dark-border rounded-lg px-3 py-2">
        <Search className="w-5 h-5 text-dark-text-secondary" />
        <input 
          type="text"
          placeholder="Search stocks (e.g., AAPL, NVDA)"
          value={query}
          onChange={handleSearch}
          className="bg-transparent outline-none border-none text-dark-text placeholder:text-dark-text-secondary ml-2 w-64 font-mono"
        />
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-dark-card border border-dark-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((item) => (
            <div 
              key={item.symbol}
              className="px-3 py-2 hover:bg-dark-surface cursor-pointer"
              onClick={() => {
                onSelect?.(item.symbol);
                setResults([]);
                setQuery('');
              }}
            >
              <div className="text-dark-text font-mono font-medium">{item.symbol}</div>
              <div className="text-dark-text-secondary text-sm">{item.name}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-text-secondary text-xs">Loading...</div>
      )}
    </div>
  );
};

export default SearchBar;
