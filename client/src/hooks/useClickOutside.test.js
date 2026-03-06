import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import useClickOutside from './useClickOutside';

describe('useClickOutside', () => {
  const createRef = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return { current: el, cleanup: () => document.body.removeChild(el) };
  };

  it('외부 mousedown 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    const { current, cleanup } = createRef();
    renderHook(() => useClickOutside({ current }, onClose));

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('내부 mousedown 시 onClose를 호출하지 않는다', () => {
    const onClose = vi.fn();
    const { current, cleanup } = createRef();
    renderHook(() => useClickOutside({ current }, onClose));

    fireEvent.mouseDown(current);
    expect(onClose).not.toHaveBeenCalled();
    cleanup();
  });

  it('Escape 키 누르면 onClose를 호출한다', () => {
    const onClose = vi.fn();
    const { current, cleanup } = createRef();
    renderHook(() => useClickOutside({ current }, onClose));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('active=false이면 리스너를 등록하지 않는다', () => {
    const onClose = vi.fn();
    const { current, cleanup } = createRef();
    renderHook(() => useClickOutside({ current }, onClose, false));

    fireEvent.mouseDown(document.body);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    cleanup();
  });

  it('unmount 시 리스너를 해제한다', () => {
    const onClose = vi.fn();
    const { current, cleanup } = createRef();
    const { unmount } = renderHook(() => useClickOutside({ current }, onClose));

    unmount();
    fireEvent.mouseDown(document.body);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    cleanup();
  });
});
