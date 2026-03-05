import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantCounter from './ParticipantCounter';

describe('ParticipantCounter', () => {
  it('참여자 수 라벨과 현재 값을 렌더링한다', () => {
    render(<ParticipantCounter value={2} onChange={vi.fn()} />);
    expect(screen.getByLabelText('참여자 수')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('min=2, max=10 속성이 있다', () => {
    render(<ParticipantCounter value={2} onChange={vi.fn()} />);
    const input = screen.getByLabelText('참여자 수');
    expect(input).toHaveAttribute('min', '2');
    expect(input).toHaveAttribute('max', '10');
  });

  it('- 버튼 클릭 시 값이 1 감소한다', async () => {
    const onChange = vi.fn();
    render(<ParticipantCounter value={5} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('참여자 감소'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('+ 버튼 클릭 시 값이 1 증가한다', async () => {
    const onChange = vi.fn();
    render(<ParticipantCounter value={5} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('참여자 증가'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('값이 2일 때 - 버튼이 비활성이다', () => {
    render(<ParticipantCounter value={2} onChange={vi.fn()} />);
    expect(screen.getByLabelText('참여자 감소')).toBeDisabled();
  });

  it('값이 10일 때 + 버튼이 비활성이다', () => {
    render(<ParticipantCounter value={10} onChange={vi.fn()} />);
    expect(screen.getByLabelText('참여자 증가')).toBeDisabled();
  });
});
