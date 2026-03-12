import clsx from 'clsx';
import styles from './FilterChip.module.css';

export default function FilterChip({ label, selected = false, onClick, size = 'md', className }) {
  return (
    <button
      className={clsx(
        styles.filterChip,
        selected ? styles.selected : styles.default,
        styles[size],
        className,
      )}
      onClick={onClick}
      aria-pressed={selected}
      type="button"
    >
      {label}
    </button>
  );
}
