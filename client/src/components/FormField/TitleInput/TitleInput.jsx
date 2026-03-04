import clsx from 'clsx';
import styles from './TitleInput.module.css';

const TitleInput = ({ value, onChange, error }) => {
  return (
    <div className={styles.field}>
      <label htmlFor="title" className={styles.label}>제목</label>
      <input
        id="title"
        type="text"
        className={clsx(styles.input, error && styles.error)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="제목에 핵심 내용을 요약해보세요."
        maxLength={50}
      />
      <div className={styles.footer}>
        {error && <span className={styles.errorText}>{error}</span>}
        <span className={styles.count}>{value.length} / 50</span>
      </div>
    </div>
  );
};

export default TitleInput;
