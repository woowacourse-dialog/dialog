import clsx from 'clsx';
import styles from './Divider.module.css';

const SPACING_MAP = {
  none: 'spacingNone',
  sm: 'spacingSm',
  md: 'spacingMd',
  lg: 'spacingLg',
};

export default function Divider({ direction = 'horizontal', spacing = 'md', className }) {
  return (
    <hr
      className={clsx(
        styles.divider,
        styles[direction],
        styles[SPACING_MAP[spacing]],
        className,
      )}
      role="separator"
    />
  );
}
