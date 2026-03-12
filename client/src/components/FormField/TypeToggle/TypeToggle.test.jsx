import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TypeToggle from './TypeToggle';

describe('TypeToggle', () => {
  it('온라인/오프라인 세그먼트를 렌더링한다', () => {
    render(<TypeToggle value="ONLINE" onChange={vi.fn()} />);
    expect(screen.getByText('온라인')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
  });

  it('현재 선택된 값이 활성화 상태로 표시된다', () => {
    render(<TypeToggle value="ONLINE" onChange={vi.fn()} />);
    expect(screen.getByText('온라인')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('오프라인')).toHaveAttribute('aria-pressed', 'false');
  });

  it('다른 옵션 클릭 시 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<TypeToggle value="ONLINE" onChange={onChange} />);
    await userEvent.click(screen.getByText('오프라인'));
    expect(onChange).toHaveBeenCalledWith('OFFLINE');
  });

  it('readOnly일 때 클릭해도 onChange를 호출하지 않는다', async () => {
    const onChange = vi.fn();
    render(<TypeToggle value="ONLINE" onChange={onChange} readOnly />);
    await userEvent.click(screen.getByText('오프라인'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('readOnly일 때 "변경 불가" 안내 텍스트를 표시한다', () => {
    render(<TypeToggle value="ONLINE" onChange={vi.fn()} readOnly />);
    expect(screen.getByText('변경 불가')).toBeInTheDocument();
  });

  it('readOnly일 때 비활성 옵션에 disabled 속성이 있다', () => {
    render(<TypeToggle value="ONLINE" onChange={vi.fn()} readOnly />);
    expect(screen.getByText('오프라인')).toBeDisabled();
  });
});
