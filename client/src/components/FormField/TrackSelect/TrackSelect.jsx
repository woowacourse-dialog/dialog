import clsx from 'clsx';
import { TRACKS, FORM_TRACKS } from '../../../constants/tracks';
import styles from './TrackSelect.module.css';

const TrackSelect = ({ value, onChange, error, includeCommon = true }) => {
  const options = includeCommon ? TRACKS : FORM_TRACKS;

  return (
    <div className={styles.field}>
      <label htmlFor="track" className={styles.label}>트랙</label>
      <select
        id="track"
        className={clsx(styles.select, error && styles.error)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default TrackSelect;
