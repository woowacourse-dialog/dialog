import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import magnifierImg from '../../assets/background_removed_logo.png';
import styles from './SearchBar.module.css';

const SEARCH_TYPES = [
  { value: 0, label: '제목+내용' },
  { value: 1, label: '작성자' },
];

const SearchBar = ({ onSearch, initialType = 0, initialQuery = '' }) => {
  const [searchType, setSearchType] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentType = SEARCH_TYPES.find((t) => t.value === searchType);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch({ searchType, query: query.trim() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTypeSelect = (type) => {
    setSearchType(type.value);
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.filterSection}
        ref={dropdownRef}
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsDropdownOpen((prev) => !prev);
          }
        }}
      >
        <span className={styles.filterText}>{currentType?.label}</span>
        <span className={styles.filterIcon}>
          <ChevronDown size={14} />
        </span>

        {isDropdownOpen && (
          <div className={styles.filterDropdown}>
            {SEARCH_TYPES.map((type) => (
              <button
                key={type.value}
                className={clsx(
                  styles.filterOption,
                  type.value === searchType && styles.filterOptionSelected,
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeSelect(type);
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.inputSection}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="검색어를 입력하세요..."
          className={styles.input}
        />
      </div>

      <button
        className={styles.searchButton}
        onClick={handleSearch}
        aria-label="검색"
      >
        <img
          src={magnifierImg}
          alt="검색"
          className={styles.searchLogo}
        />
      </button>
    </div>
  );
};

export default SearchBar;
