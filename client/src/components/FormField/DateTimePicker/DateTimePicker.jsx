import clsx from 'clsx';
import styles from './DateTimePicker.module.css';

const DateTimePicker = ({ date, startTime, endTime, onDateChange, onStartTimeChange, onEndTimeChange, error }) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.field}>
      <div className={styles.grid}>
        <div className={styles.dateField}>
          <label htmlFor="date" className={styles.label}>날짜</label>
          <input
            id="date"
            type="date"
            className={clsx(styles.input, error && styles.error)}
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={today}
          />
        </div>
        <div className={styles.timeField}>
          <label htmlFor="startTime" className={styles.label}>시작 시간</label>
          <input
            id="startTime"
            type="time"
            className={clsx(styles.input, error && styles.error)}
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            step="1800"
          />
        </div>
        <div className={styles.timeField}>
          <label htmlFor="endTime" className={styles.label}>종료 시간</label>
          <input
            id="endTime"
            type="time"
            className={clsx(styles.input, error && styles.error)}
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            step="1800"
          />
        </div>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default DateTimePicker;
