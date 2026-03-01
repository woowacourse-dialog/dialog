import React, { useState } from 'react';
import styles from './DiscussionFilterBar.module.css';
import { STATUS_OPTIONS, DISCUSSION_TYPE_OPTIONS } from '../constants/filters';

const TRACK_OPTIONS = [
  { label: '공통', value: 'common' },
  { label: 'BE', value: 'backend' },
  { label: 'FE', value: 'frontend' },
  { label: 'AN', value: 'android' },
];

const DiscussionFilterBar = ({
  selectedCategories = [],
  selectedStatuses = [],
  selectedDiscussionTypes = [],
  onCategoryChange,
  onStatusChange,
  onDiscussionTypeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTrackClick = (value) => {
    const newCategories = selectedCategories.includes(value)
      ? selectedCategories.filter((v) => v !== value)
      : [...selectedCategories, value];
    onCategoryChange(newCategories);
  };

  const handleTypeClick = (value) => {
    const newTypes = selectedDiscussionTypes.includes(value)
      ? selectedDiscussionTypes.filter((v) => v !== value)
      : [...selectedDiscussionTypes, value];
    onDiscussionTypeChange(newTypes);
  };

  const handleStatusClick = (value) => {
    const newStatuses = selectedStatuses.includes(value)
      ? selectedStatuses.filter((v) => v !== value)
      : [...selectedStatuses, value];
    onStatusChange(newStatuses);
  };

  return (
    <div className={styles.filterContainer}>
      {/* 모바일 필터 토글 버튼 */}
      <button
        className={styles.mobileFilterToggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2.5 5.83333H17.5M5.83333 10H14.1667M8.33333 14.1667H11.6667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"/>
        </svg>
        필터
      </button>

      {/* 필터 바 */}
      <div className={`${styles.filterBar} ${isOpen ? styles.open : ''}`}>
        {/* 트랙 필터 */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>트랙</span>
          <div className={styles.filterOptions}>
            {TRACK_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.filterChip} ${
                  selectedCategories.includes(option.value) ? styles.active : ''
                }`}
                onClick={() => handleTrackClick(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 토론 타입 필터 */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>토론 타입</span>
          <div className={styles.filterOptions}>
            {DISCUSSION_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.filterChip} ${
                  selectedDiscussionTypes.includes(option.value) ? styles.active : ''
                }`}
                onClick={() => handleTypeClick(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 상태 필터 */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>상태</span>
          <div className={styles.filterOptions}>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.filterChip} ${
                  selectedStatuses.includes(option.value) ? styles.active : ''
                }`}
                onClick={() => handleStatusClick(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionFilterBar;
