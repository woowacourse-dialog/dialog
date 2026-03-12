import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import ProfileEditModal from './ProfileEditModal';

const mockUserInfo = {
  nickname: '기존닉네임',
  track: 'FRONTEND',
};

describe('ProfileEditModal', () => {
  let onClose;
  let onSave;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onSave = vi.fn().mockResolvedValue();
  });

  it('기존 닉네임을 입력필드에 표시한다', () => {
    render(
      <ProfileEditModal isOpen={true} onClose={onClose} userInfo={mockUserInfo} onSave={onSave} />
    );
    const input = screen.getByDisplayValue('기존닉네임');
    expect(input).toBeInTheDocument();
  });

  it('닉네임이 2글자 미만이면 에러를 표시한다', async () => {
    const user = userEvent.setup();
    render(
      <ProfileEditModal isOpen={true} onClose={onClose} userInfo={mockUserInfo} onSave={onSave} />
    );
    const input = screen.getByDisplayValue('기존닉네임');
    await user.clear(input);
    await user.type(input, 'A');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(screen.getByText(/2글자 이상 15자 이내/)).toBeInTheDocument();
  });

  it('닉네임이 15글자 초과이면 에러를 표시한다', async () => {
    const user = userEvent.setup();
    render(
      <ProfileEditModal isOpen={true} onClose={onClose} userInfo={mockUserInfo} onSave={onSave} />
    );
    const input = screen.getByDisplayValue('기존닉네임');
    await user.clear(input);
    await user.type(input, '아아아아아아아아아아아아아아아아');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(screen.getByText(/2글자 이상 15자 이내/)).toBeInTheDocument();
  });

  it('트랙 드롭다운에 현재 값을 표시한다', () => {
    render(
      <ProfileEditModal isOpen={true} onClose={onClose} userInfo={mockUserInfo} onSave={onSave} />
    );
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('FRONTEND');
  });

  it('"저장" 클릭 시 onSave를 { nickname, track }으로 호출한다', async () => {
    const user = userEvent.setup();
    render(
      <ProfileEditModal isOpen={true} onClose={onClose} userInfo={mockUserInfo} onSave={onSave} />
    );
    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ nickname: '기존닉네임', track: 'FRONTEND' });
    });
  });

  it('"취소" 클릭 시 onClose를 호출한다', async () => {
    const user = userEvent.setup();
    render(
      <ProfileEditModal isOpen={true} onClose={onClose} userInfo={mockUserInfo} onSave={onSave} />
    );
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('isOpen=false이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <ProfileEditModal isOpen={false} onClose={onClose} userInfo={mockUserInfo} onSave={onSave} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
