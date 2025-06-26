import React, { useState } from 'react';
import styles from './SearchBar.module.css';
import magnifierImg from '../assets/background_removed_logo.png';

const SEARCH_TYPES = [
  { value: 0, label: '제목+내용' },
  { value: 1, label: '작성자' },
];

const SearchBar = ({ onSearch, initialType = 0, initialQuery = '' }) => {
  const [searchType, setSearchType] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);

  const handleInputChange = (e) => setQuery(e.target.value);
  const handleTypeChange = (e) => setSearchType(Number(e.target.value));

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

  return (
    <div className={styles.container}>
      <select
        value={searchType}
        onChange={handleTypeChange}
        className={styles.select}
      >
        {SEARCH_TYPES.map((type) => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="검색어를 입력하세요"
        className={styles.input}
      />
      <button
        onClick={handleSearch}
        className={styles.button}
        aria-label="검색"
      >
        <img
          src={magnifierImg}
          alt="돋보기"
          style={{ width: 24, height: 24, objectFit: 'contain', display: 'block' }}
        />
      </button>
    </div>
  );
};

export default SearchBar;
