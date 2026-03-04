import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationInput from './LocationInput';

describe('LocationInput', () => {
  it('라벨 "토론 장소"를 렌더링한다', () => {
    render(<LocationInput value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('토론 장소')).toBeInTheDocument();
  });

  it('placeholder를 표시한다', () => {
    render(<LocationInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/예: 굿샷/)).toBeInTheDocument();
  });

  it('값 변경 시 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<LocationInput value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('토론 장소'), '강남역');
    expect(onChange).toHaveBeenCalled();
  });

  it('에러 상태를 표시한다', () => {
    render(<LocationInput value="" onChange={vi.fn()} error="장소를 입력해주세요" />);
    expect(screen.getByText('장소를 입력해주세요')).toBeInTheDocument();
  });

  it('map-pin 아이콘이 렌더링된다', () => {
    render(<LocationInput value="" onChange={vi.fn()} />);
    // lucide-react MapPin 아이콘 확인
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
