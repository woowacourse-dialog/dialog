import React, { useState } from 'react';
import styles from './DiscussionFilter.module.css';

const CATEGORY_OPTIONS = [
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
  { label: 'Android', value: 'android' },
  { label: '공통', value: 'common' },
];

const STATUS_OPTIONS = [
  { label: '모집중', value: 'recruiting' },
  { label: '모집완료', value: 'recruitComplete' },
  { label: '토론중', value: 'inDiscussion' },
  { label: '토론완료', value: 'discussionComplete' },
];

const DiscussionFilter = ({
  initialCategories = [],
  initialStatuses = [],
  onApply,
}) => {
  const [categories, setCategories] = useState(initialCategories);
  const [statuses, setStatuses] = useState(initialStatuses);

  const handleCategoryToggle = (value) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleStatusToggle = (value) => {
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
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
      <button
        onClick={() => onApply({ categories, statuses })}
        className={styles.applyButton}
      >
        필터 적용
      </button>
    </div>
  );
};

export default DiscussionFilter; 