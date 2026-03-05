import styles from './EndDatePicker.module.css';

const OPTIONS = [
  { value: 1, label: '1일 후' },
  { value: 2, label: '2일 후' },
  { value: 3, label: '3일 후' },
];

const EndDatePicker = ({ value, onChange }) => {
  return (
    <div className={styles.field}>
      <label htmlFor="endDateOffset" className={styles.label}>토론 종료 날짜</label>
      <select
        id="endDateOffset"
        className={styles.select}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      >
        {OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export default EndDatePicker;
