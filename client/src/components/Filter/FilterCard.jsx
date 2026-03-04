import { SlidersHorizontal, RefreshCcw } from 'lucide-react';
import clsx from 'clsx';
import FilterChip from '../ui/FilterChip/FilterChip';
import { STATUS_OPTIONS, DISCUSSION_TYPE_OPTIONS } from '../../constants/filters';
import styles from './FilterCard.module.css';

const TRACK_OPTIONS = [
  { label: '공통', value: 'common' },
  { label: 'BE', value: 'backend' },
  { label: 'FE', value: 'frontend' },
  { label: 'AN', value: 'android' },
];

export default function FilterCard({
  selectedCategories = [],
  selectedStatuses = [],
  selectedDiscussionTypes = [],
  onCategoryChange,
  onStatusChange,
  onDiscussionTypeChange,
  onReset,
  className,
}) {
  const handleChipToggle = (currentList, value, onChange) => {
    const newList = currentList.includes(value)
      ? currentList.filter((v) => v !== value)
      : [...currentList, value];
    onChange(newList);
  };

  return (
    <div className={clsx(styles.card, className)}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <SlidersHorizontal className={styles.titleIcon} />
          <span className={styles.title}>필터</span>
        </div>
        <button type="button" className={styles.resetBtn} onClick={onReset}>
          <RefreshCcw className={styles.resetIcon} />
          <span className={styles.resetText}>필터 초기화</span>
        </button>
      </div>

      {/* 트랙 */}
      <div className={styles.section}>
        <span className={styles.label}>트랙</span>
        <div className={styles.chips}>
          {TRACK_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={selectedCategories.includes(option.value)}
              onClick={() =>
                handleChipToggle(selectedCategories, option.value, onCategoryChange)
              }
            />
          ))}
        </div>
      </div>

      {/* 토론 타입 */}
      <div className={styles.section}>
        <span className={styles.label}>토론 타입</span>
        <div className={styles.chips}>
          {DISCUSSION_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={selectedDiscussionTypes.includes(option.value)}
              onClick={() =>
                handleChipToggle(
                  selectedDiscussionTypes,
                  option.value,
                  onDiscussionTypeChange,
                )
              }
            />
          ))}
        </div>
      </div>

      {/* 상태 */}
      <div className={styles.section}>
        <span className={styles.label}>상태</span>
        <div className={styles.chips}>
          {STATUS_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={selectedStatuses.includes(option.value)}
              onClick={() =>
                handleChipToggle(selectedStatuses, option.value, onStatusChange)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
