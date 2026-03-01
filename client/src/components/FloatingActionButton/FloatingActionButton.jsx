import styles from './FloatingActionButton.module.css';

const FloatingActionButton = ({ onClick, label = '+' }) => (
  <button className={styles.fab} onClick={onClick}>
    {label}
  </button>
);

export default FloatingActionButton;
