import { useState, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import useClickOutside from '../../../hooks/useClickOutside';
import styles from './MoreMenu.module.css';

export default function MoreMenu({ items = [], align = 'right', className }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (e, item) => {
    e.stopPropagation();
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
  };

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  return (
    <div className={clsx(styles.container, className)} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={handleToggle}
        aria-label="더보기 메뉴"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={20} />
      </button>
      {isOpen && (
        <div className={clsx(styles.menu, styles[align])} role="menu">
          {items.map((item, index) => (
            <button
              key={index}
              className={clsx(
                styles.menuItem,
                item.variant === 'danger' && styles.danger,
                item.disabled && styles.disabled,
              )}
              role="menuitem"
              onClick={(e) => handleItemClick(e, item)}
              disabled={item.disabled}
            >
              {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
