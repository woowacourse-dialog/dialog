import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateTimePicker from './DateTimePicker';

describe('DateTimePicker', () => {
  const defaultProps = {
    date: '2026-03-04',
    startTime: '14:00',
    endTime: '16:00',
    onDateChange: vi.fn(),
    onStartTimeChange: vi.fn(),
    onEndTimeChange: vi.fn(),
  };

  it('날짜, 시작 시간, 종료 시간 필드를 렌더링한다', () => {
    render(<DateTimePicker {...defaultProps} />);
    expect(screen.getByLabelText('날짜')).toBeInTheDocument();
    expect(screen.getByLabelText('시작 시간')).toBeInTheDocument();
    expect(screen.getByLabelText('종료 시간')).toBeInTheDocument();
  });

  it('날짜 변경 시 onDateChange를 호출한다', async () => {
    const onDateChange = vi.fn();
    render(<DateTimePicker {...defaultProps} onDateChange={onDateChange} />);
    await userEvent.clear(screen.getByLabelText('날짜'));
    await userEvent.type(screen.getByLabelText('날짜'), '2026-03-05');
    expect(onDateChange).toHaveBeenCalled();
  });

  it('오늘 이전 날짜는 선택 불가 (min 속성)', () => {
    const today = new Date().toISOString().split('T')[0];
    render(<DateTimePicker {...defaultProps} date={today} />);
    expect(screen.getByLabelText('날짜')).toHaveAttribute('min', today);
  });

  it('시간은 30분 단위이다 (step=1800)', () => {
    render(<DateTimePicker {...defaultProps} />);
    expect(screen.getByLabelText('시작 시간')).toHaveAttribute('step', '1800');
    expect(screen.getByLabelText('종료 시간')).toHaveAttribute('step', '1800');
  });

  it('에러 메시지를 표시한다', () => {
    render(<DateTimePicker {...defaultProps} error="종료 시간은 시작 시간 이후여야 합니다" />);
    expect(screen.getByText('종료 시간은 시작 시간 이후여야 합니다')).toBeInTheDocument();
  });

  it('현재 값이 각 필드에 표시된다', () => {
    render(<DateTimePicker {...defaultProps} />);
    expect(screen.getByLabelText('날짜')).toHaveValue('2026-03-04');
    expect(screen.getByLabelText('시작 시간')).toHaveValue('14:00');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('16:00');
  });
});
