import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EndDatePicker from './EndDatePicker';

describe('EndDatePicker', () => {
  it('1일 후, 2일 후, 3일 후 옵션을 렌더링한다', () => {
    render(<EndDatePicker value={1} onChange={vi.fn()} />);
    expect(screen.getByText('1일 후')).toBeInTheDocument();
    expect(screen.getByText('2일 후')).toBeInTheDocument();
    expect(screen.getByText('3일 후')).toBeInTheDocument();
  });

  it('라벨이 "토론 종료 날짜"이다', () => {
    render(<EndDatePicker value={1} onChange={vi.fn()} />);
    expect(screen.getByLabelText('토론 종료 날짜')).toBeInTheDocument();
  });

  it('선택 변경 시 onChange를 숫자로 호출한다', async () => {
    const onChange = vi.fn();
    render(<EndDatePicker value={1} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('토론 종료 날짜'), '2');
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('현재 선택된 값이 표시된다', () => {
    render(<EndDatePicker value={3} onChange={vi.fn()} />);
    expect(screen.getByLabelText('토론 종료 날짜')).toHaveValue('3');
  });
});
