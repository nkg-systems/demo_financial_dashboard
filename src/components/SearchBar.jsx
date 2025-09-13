import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import stockService from '../services/stockService';

const SearchBar = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    setError(null);
    
    if (value.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    
    try {
      const data = await stockService.searchStocks(value);
      console.log('Search results:', data); // Debug log
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (symbol) => {
    console.log('Selected stock:', symbol); // Debug log
    onSelect?.(symbol);
    setResults([]);
    setQuery('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setError(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex].symbol);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center bg-dark-surface border border-dark-border rounded-lg px-3 py-2 focus-within:border-neutral-blue transition-colors">
        <Search className="w-5 h-5 text-dark-text-secondary" />
        <input 
          ref={inputRef}
          type="text"
          placeholder="Search stocks (e.g., AAPL, NVDA, Microsoft)"
          value={query}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          className="bg-transparent outline-none border-none text-dark-text placeholder:text-dark-text-secondary ml-2 w-64 font-mono"
        />
        {query && (
          <button 
            onClick={clearSearch}
            className="ml-2 p-1 hover:bg-dark-card rounded text-dark-text-secondary hover:text-dark-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="ml-2 text-dark-text-secondary text-xs animate-pulse">Loading...</div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-dark-card border border-dark-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {loading && (
            <div className="px-3 py-4 text-center text-dark-text-secondary">
              <div className="animate-pulse">Searching...</div>
            </div>
          )}
          
          {error && (
            <div className="px-3 py-2 text-loss-red text-sm">
              {error}
            </div>
          )}
          
          {!loading && !error && results.length === 0 && query.length > 0 && (
            <div className="px-3 py-4 text-center text-dark-text-secondary text-sm">
              No stocks found for "{query}"
            </div>
          )}
          
          {results.length > 0 && (
            <>
              {results.map((item, index) => (
                <div 
                  key={item.symbol}
                  className={`px-3 py-3 cursor-pointer border-b border-dark-border last:border-b-0 transition-colors ${
                    index === selectedIndex 
                      ? 'bg-neutral-blue/20 border-neutral-blue' 
                      : 'hover:bg-dark-surface'
                  }`}
                  onClick={() => handleSelect(item.symbol)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-dark-text font-mono font-medium text-sm">{item.symbol}</div>
                      <div className="text-dark-text-secondary text-xs truncate max-w-48">{item.name}</div>
                    </div>
                    <div className="text-neutral-blue text-xs">Select</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
