import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrackSelect from './TrackSelect';

describe('TrackSelect', () => {
  it('트랙 옵션들을 렌더링한다', () => {
    render(<TrackSelect value="FRONTEND" onChange={vi.fn()} />);
    expect(screen.getByLabelText('트랙')).toBeInTheDocument();
    expect(screen.getByText('프론트엔드')).toBeInTheDocument();
    expect(screen.getByText('백엔드')).toBeInTheDocument();
    expect(screen.getByText('안드로이드')).toBeInTheDocument();
    expect(screen.getByText('공통')).toBeInTheDocument();
  });

  it('includeCommon=false일 때 공통 옵션을 제외한다', () => {
    render(<TrackSelect value="FRONTEND" onChange={vi.fn()} includeCommon={false} />);
    expect(screen.queryByText('공통')).not.toBeInTheDocument();
  });

  it('선택 변경 시 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<TrackSelect value="FRONTEND" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('트랙'), 'BACKEND');
    expect(onChange).toHaveBeenCalledWith('BACKEND');
  });

  it('에러 상태를 표시한다', () => {
    render(<TrackSelect value="" onChange={vi.fn()} error="트랙을 선택해주세요" />);
    expect(screen.getByText('트랙을 선택해주세요')).toBeInTheDocument();
  });

  it('현재 선택된 값이 표시된다', () => {
    render(<TrackSelect value="BACKEND" onChange={vi.fn()} />);
    expect(screen.getByLabelText('트랙')).toHaveValue('BACKEND');
  });
});
