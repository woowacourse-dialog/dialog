import styles from './ToggleSwitch.module.css';

const ToggleSwitch = ({ checked, onChange, disabled = false, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    {label && <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>}
    <label className={`${styles.switch} ${checked ? styles.checked : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className={styles.slider} />
    </label>
  </div>
);

export default ToggleSwitch;
