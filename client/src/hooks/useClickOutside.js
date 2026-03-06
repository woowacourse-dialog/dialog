import { useEffect } from 'react';

export default function useClickOutside(ref, onClose, active = true) {
  useEffect(() => {
    if (!active) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ref, onClose, active]);
}
