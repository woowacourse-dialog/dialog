import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import ProfileDropdown from './ProfileDropdown';

describe('ProfileDropdown', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    onLogout: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onNavigate.mockClear();
    defaultProps.onLogout.mockClear();
    defaultProps.onClose.mockClear();
  });

  it('마이페이지 메뉴 항목을 렌더링한다', () => {
    render(<ProfileDropdown {...defaultProps} />);
    expect(screen.getByText('마이페이지')).toBeInTheDocument();
  });

  it('설정 메뉴 항목을 렌더링한다', () => {
    render(<ProfileDropdown {...defaultProps} />);
    expect(screen.getByText('설정')).toBeInTheDocument();
  });

  it('로그아웃 메뉴 항목을 렌더링한다', () => {
    render(<ProfileDropdown {...defaultProps} />);
    expect(screen.getByText('로그아웃')).toBeInTheDocument();
  });

  it('마이페이지 클릭 시 onNavigate("/mypage")를 호출한다', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown {...defaultProps} />);
    await user.click(screen.getByText('마이페이지'));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/mypage');
  });

  it('로그아웃 클릭 시 onLogout을 호출한다', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown {...defaultProps} />);
    await user.click(screen.getByText('로그아웃'));
    expect(defaultProps.onLogout).toHaveBeenCalled();
  });

  it('외부 클릭 시 onClose를 호출한다', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">외부</div>
        <ProfileDropdown {...defaultProps} />
      </div>
    );
    await user.click(screen.getByTestId('outside'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('Escape 키 누르면 onClose를 호출한다', async () => {
    const user = userEvent.setup();
    render(<ProfileDropdown {...defaultProps} />);
    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
