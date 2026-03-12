import { useRef } from 'react';
import { User, LogOut } from 'lucide-react';
import useClickOutside from '../../../hooks/useClickOutside';
import styles from './ProfileDropdown.module.css';

const ProfileDropdown = ({ onNavigate, onLogout, onClose }) => {
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, onClose);

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button className={styles.menuItem} onClick={() => onNavigate('/mypage')}>
        <User size={16} />
        <span>마이페이지</span>
      </button>
      <div className={styles.divider} />
      <button className={styles.menuItemDanger} onClick={onLogout}>
        <LogOut size={16} />
        <span>로그아웃</span>
      </button>
    </div>
  );
};

export default ProfileDropdown;
