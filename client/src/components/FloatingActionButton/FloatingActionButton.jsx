import { Plus } from 'lucide-react';
import styles from './FloatingActionButton.module.css';

const FloatingActionButton = ({ onClick }) => (
  <button
    className={styles.fab}
    onClick={onClick}
    aria-label="새 토론 작성"
  >
    <Plus size={24} />
  </button>
);

export default FloatingActionButton;
