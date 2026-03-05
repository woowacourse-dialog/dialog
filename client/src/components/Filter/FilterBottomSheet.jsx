import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import FilterChip from '../ui/FilterChip/FilterChip';
import { STATUS_OPTIONS, DISCUSSION_TYPE_OPTIONS } from '../../constants/filters';
import styles from './FilterBottomSheet.module.css';

const TRACK_OPTIONS = [
  { label: '공통', value: 'common' },
  { label: 'BE', value: 'backend' },
  { label: 'FE', value: 'frontend' },
  { label: 'AN', value: 'android' },
];

export default function FilterBottomSheet({
  isOpen,
  selectedCategories = [],
  selectedStatuses = [],
  selectedDiscussionTypes = [],
  onApply,
  onReset,
  onClose,
}) {
  const [localCategories, setLocalCategories] = useState(selectedCategories);
  const [localStatuses, setLocalStatuses] = useState(selectedStatuses);
  const [localDiscussionTypes, setLocalDiscussionTypes] = useState(selectedDiscussionTypes);

  // Sync local state when props change or sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalCategories(selectedCategories);
      setLocalStatuses(selectedStatuses);
      setLocalDiscussionTypes(selectedDiscussionTypes);
    }
  }, [isOpen, selectedCategories, selectedStatuses, selectedDiscussionTypes]);

  if (!isOpen) return null;

  const toggleChip = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleApply = () => {
    onApply({
      categories: localCategories,
      statuses: localStatuses,
      discussionTypes: localDiscussionTypes,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalCategories([]);
    setLocalStatuses([]);
    setLocalDiscussionTypes([]);
  };

  return (
    <div
      className={styles.overlay}
      data-testid="bottom-sheet-overlay"
      onClick={onClose}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div className={styles.dragHandle} data-testid="drag-handle">
          <div className={styles.handleBar} />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>필터</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* 트랙 */}
          <div className={styles.section}>
            <span className={styles.label}>트랙</span>
            <div className={styles.chips}>
              {TRACK_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={localCategories.includes(option.value)}
                  onClick={() =>
                    toggleChip(localCategories, setLocalCategories, option.value)
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
                  selected={localDiscussionTypes.includes(option.value)}
                  onClick={() =>
                    toggleChip(
                      localDiscussionTypes,
                      setLocalDiscussionTypes,
                      option.value,
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
                  selected={localStatuses.includes(option.value)}
                  onClick={() =>
                    toggleChip(localStatuses, setLocalStatuses, option.value)
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className={styles.actionBar}>
          <button
            type="button"
            className={styles.resetAction}
            onClick={handleReset}
          >
            초기화
          </button>
          <button
            type="button"
            className={styles.applyAction}
            onClick={handleApply}
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}
