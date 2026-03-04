import clsx from 'clsx';
import styles from './ToggleSwitch.module.css';

export default function ToggleSwitch({ checked, onChange, disabled = false, label, className }) {
  const handleClick = () => {
    if (!disabled) onChange(!checked);
  };

  return (
    <label className={clsx(styles.container, disabled && styles.disabled, className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}}
        className={styles.hiddenInput}
        disabled={disabled}
      />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={clsx(styles.track, checked && styles.checked)}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className={styles.knob} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
