import React from 'react';
import type { SearchResult } from '../../utils/searchIndex';
import { getResultIcon } from '../../utils/searchIndex';

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isSelected,
  onClick,
  onMouseEnter
}) => {
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    cursor: 'pointer',
    background: isSelected ? 'rgba(79, 195, 247, 0.15)' : 'transparent',
    borderLeft: isSelected ? '3px solid #4FC3F7' : '3px solid transparent',
    transition: 'all 0.15s ease'
  };

  const iconContainerStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: `${result.color}22`,
    border: `1px solid ${result.color}44`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '2px'
  };

  const typeTagStyle: React.CSSProperties = {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flexShrink: 0
  };

  return (
    <div
      style={itemStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isSelected}
    >
      <div style={iconContainerStyle}>
        {getResultIcon(result.type)}
      </div>
      <div style={contentStyle}>
        <div style={nameStyle}>{result.name}</div>
        <div style={subtitleStyle}>{result.subtitle}</div>
      </div>
      <div style={typeTagStyle}>{result.type}</div>
    </div>
  );
};

export default SearchResultItem;
