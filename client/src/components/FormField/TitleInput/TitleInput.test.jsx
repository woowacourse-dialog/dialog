import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TitleInput from './TitleInput';

describe('TitleInput', () => {
  it('라벨과 입력 필드를 렌더링한다', () => {
    render(<TitleInput value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('제목에 핵심 내용을 요약해보세요.')).toBeInTheDocument();
  });

  it('값 변경 시 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<TitleInput value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('제목'), 'A');
    expect(onChange).toHaveBeenCalled();
  });

  it('빈 값일 때 에러 메시지를 표시한다', () => {
    render(<TitleInput value="" onChange={vi.fn()} error="제목을 입력해주세요" />);
    expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument();
  });

  it('50자 초과 시 에러 상태를 표시한다', () => {
    const longTitle = 'a'.repeat(51);
    render(<TitleInput value={longTitle} onChange={vi.fn()} error="제목은 50자 이내여야 합니다" />);
    expect(screen.getByText('제목은 50자 이내여야 합니다')).toBeInTheDocument();
  });

  it('현재 글자수를 표시한다', () => {
    render(<TitleInput value="안녕하세요" onChange={vi.fn()} />);
    expect(screen.getByText('5 / 50')).toBeInTheDocument();
  });

  it('maxLength=50 속성이 있다', () => {
    render(<TitleInput value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('제목')).toHaveAttribute('maxLength', '50');
  });

  it('에러 상태일 때 입력 필드에 에러 스타일 클래스가 적용된다', () => {
    render(<TitleInput value="" onChange={vi.fn()} error="에러" />);
    const input = screen.getByLabelText('제목');
    expect(input.className).toMatch(/error/);
  });
});
