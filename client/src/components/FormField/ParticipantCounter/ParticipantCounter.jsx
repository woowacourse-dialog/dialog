import { Minus, Plus } from 'lucide-react';
import styles from './ParticipantCounter.module.css';

const MIN = 2;
const MAX = 10;

const ParticipantCounter = ({ value, onChange }) => {
  return (
    <div className={styles.field}>
      <label htmlFor="participantCount" className={styles.label}>참여자 수</label>
      <div className={styles.counter}>
        <button
          type="button"
          className={styles.btn}
          aria-label="참여자 감소"
          onClick={() => onChange(value - 1)}
          disabled={value <= MIN}
        >
          <Minus size={16} />
        </button>
        <input
          id="participantCount"
          type="number"
          className={styles.input}
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value) || MIN;
            onChange(Math.max(MIN, Math.min(MAX, v)));
          }}
          min={MIN}
          max={MAX}
          readOnly
        />
        <button
          type="button"
          className={styles.btn}
          aria-label="참여자 증가"
          onClick={() => onChange(value + 1)}
          disabled={value >= MAX}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default ParticipantCounter;
