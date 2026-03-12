import { useState, useId } from 'react';
import clsx from 'clsx';
import styles from './Tooltip.module.css';

export default function Tooltip({ content, position = 'top', children }) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={clsx(styles.tooltip, styles[position])}
        >
          {content}
        </div>
      )}
    </div>
  );
}
