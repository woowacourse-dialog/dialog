import clsx from 'clsx';
import { MapPin } from 'lucide-react';
import styles from './LocationInput.module.css';

const LocationInput = ({ value, onChange, error }) => {
  return (
    <div className={styles.field}>
      <label htmlFor="location" className={styles.label}>
        <MapPin size={16} />
        토론 장소
      </label>
      <input
        id="location"
        type="text"
        className={clsx(styles.input, error && styles.error)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 굿샷, 나이스샷, 온라인 줌 미팅, 강남역"
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default LocationInput;
