import React from 'react';
import type { SearchResult } from '../../utils/searchIndex';
import SearchResultItem from './SearchResultItem';

interface SearchResultsProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelectResult: (result: SearchResult) => void;
  onHoverResult: (index: number) => void;
  isSearching: boolean;
  query: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  selectedIndex,
  onSelectResult,
  onHoverResult,
  isSearching,
  query
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1001
  };

  const emptyStateStyle: React.CSSProperties = {
    padding: '24px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '13px'
  };

  const headerStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  if (isSearching) {
    return (
      <div style={containerStyle}>
        <div style={emptyStateStyle}>
          Searching...
        </div>
      </div>
    );
  }

  if (query && results.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={emptyStateStyle}>
          No results found for "{query}"
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div style={containerStyle} role="listbox">
      <div style={headerStyle}>
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>
      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          isSelected={index === selectedIndex}
          onClick={() => onSelectResult(result)}
          onMouseEnter={() => onHoverResult(index)}
        />
      ))}
    </div>
  );
};

export default SearchResults;
