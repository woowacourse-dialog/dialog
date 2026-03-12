import clsx from 'clsx';
import styles from './Card.module.css';

const PADDING_MAP = {
  none: 'paddingNone',
  sm: 'paddingSm',
  md: 'paddingMd',
  lg: 'paddingLg',
};

export default function Card({
  children,
  padding = 'md',
  onClick,
  hoverable = false,
  className,
  ...rest
}) {
  const classes = clsx(
    styles.card,
    styles[PADDING_MAP[padding]],
    onClick && styles.clickable,
    hoverable && styles.hoverable,
    className,
  );

  if (onClick) {
    return (
      <button className={classes} onClick={onClick} type="button" {...rest}>
        {children}
      </button>
    );
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
