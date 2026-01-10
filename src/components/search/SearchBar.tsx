import React, { useRef, useEffect, useState } from 'react';
import type { SearchResult } from '../../utils/searchIndex';
import SearchResults from './SearchResults';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResult[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  onSelectResult: (result: SearchResult) => void;
  onClear: () => void;
  isSearching: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  results,
  selectedIndex,
  onSelectedIndexChange,
  onSelectResult,
  onClear,
  isSearching,
  placeholder = 'Search cities, countries, satellites...'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const showResults = isFocused && (query.length > 0 || isSearching);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        onSelectedIndexChange(Math.min(selectedIndex + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        onSelectedIndexChange(Math.max(selectedIndex - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelectResult(results[selectedIndex]);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClear();
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut (Cmd/Ctrl + K) to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    width: '400px',
    maxWidth: 'calc(100vw - 40px)'
  };

  const inputContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: isFocused ? '1px solid rgba(79, 195, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0 16px',
    transition: 'all 0.2s ease',
    boxShadow: isFocused ? '0 4px 20px rgba(79, 195, 247, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
  };

  const searchIconStyle: React.CSSProperties = {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginRight: '10px',
    flexShrink: 0
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'white',
    fontSize: '14px',
    padding: '14px 0',
    width: '100%'
  };

  const clearButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    marginLeft: '8px',
    flexShrink: 0,
    transition: 'all 0.15s ease'
  };

  const shortcutHintStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.3)',
    padding: '2px 6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    marginLeft: '8px',
    flexShrink: 0
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={inputContainerStyle}>
        <span style={searchIconStyle}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={inputStyle}
          aria-label="Search"
          aria-expanded={showResults}
          aria-autocomplete="list"
          role="combobox"
        />
        {query ? (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            style={clearButtonStyle}
            aria-label="Clear search"
          >
            ×
          </button>
        ) : !isFocused && (
          <span style={shortcutHintStyle}>⌘K</span>
        )}
      </div>

      {showResults && (
        <SearchResults
          results={results}
          selectedIndex={selectedIndex}
          onSelectResult={(result) => {
            onSelectResult(result);
            setIsFocused(false);
          }}
          onHoverResult={onSelectedIndexChange}
          isSearching={isSearching}
          query={query}
        />
      )}
    </div>
  );
};

export default SearchBar;
