import React, { useState } from 'react';
import styles from './DiscussionFilter.module.css';
import filterClose from '../assets/filter-close.png';
import filterOpen from '../assets/filter-open.png';

const CATEGORY_OPTIONS = [
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
  { label: 'Android', value: 'android' },
  { label: '공통', value: 'common' },
];

const STATUS_OPTIONS = [
  { label: '모집 중', value: 'recruiting' },
  { label: '모집 완료', value: 'recruitComplete' },
  { label: '토론 중', value: 'inDiscussion' },
  { label: '토론 완료', value: 'discussionComplete' },
];

const DiscussionFilter = ({
  initialCategories = [],
  initialStatuses = [],
  onApply,
  showFilter = true,
  onToggleFilter,
}) => {
  const [categories, setCategories] = useState(initialCategories);
  const [statuses, setStatuses] = useState(initialStatuses);

  const handleCategoryToggle = (value) => {
    const newCategories = categories.includes(value) 
      ? categories.filter((v) => v !== value) 
      : [...categories, value];
    setCategories(newCategories);
    onApply({ categories: newCategories, statuses });
  };

  const handleStatusToggle = (value) => {
    const newStatuses = statuses.includes(value) 
      ? statuses.filter((v) => v !== value) 
      : [...statuses, value];
    setStatuses(newStatuses);
    onApply({ categories, statuses: newStatuses });
  };

  return (
    <div>
      <button
        onClick={onToggleFilter}
        className={styles.toggleButton + (showFilter ? '' : ' ' + styles.toggleButtonFloating)}
        aria-label={showFilter ? '필터 숨기기' : '필터 펼치기'}
      >
        <img
          src={showFilter ? filterClose : filterOpen}
          alt={showFilter ? '필터 숨기기' : '필터 펼치기'}
          style={{ width: 28, height: 28 }}
        />
      </button>
      {showFilter && (
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <strong className={styles.groupTitle}>카테고리</strong>
            {CATEGORY_OPTIONS.map((cat) => (
              <label key={cat.value} className={`${styles.optionItem} ${categories.includes(cat.value) ? styles.selected : ''}`}>
                <input
                  type="checkbox"
                  checked={categories.includes(cat.value)}
                  onChange={() => handleCategoryToggle(cat.value)}
                  className={styles.hiddenCheckbox}
                />
                {cat.label}
              </label>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <strong className={styles.groupTitle}>상태</strong>
            {STATUS_OPTIONS.map((status) => (
              <label key={status.value} className={`${styles.optionItem} ${statuses.includes(status.value) ? styles.selected : ''}`}>
                <input
                  type="checkbox"
                  checked={statuses.includes(status.value)}
                  onChange={() => handleStatusToggle(status.value)}
                  className={styles.hiddenCheckbox}
                />
                {status.label}
              </label>
            ))}
          </div>
          {/* 모바일에서 필터 닫기 버튼 */}
          <div className={styles.mobileCloseButton}>
            <button 
              onClick={onToggleFilter}
              className={styles.closeButton}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionFilter; 