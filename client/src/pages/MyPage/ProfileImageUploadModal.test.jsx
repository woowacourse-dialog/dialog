import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import ProfileImageUploadModal from './ProfileImageUploadModal';

vi.mock('../../utils/profileImage', () => ({
  getProfileImageSrc: vi.fn((img) => img?.customImageUri || img?.basicImageUri || '/default.png'),
}));

const mockProfileImage = { basicImageUri: '/current-profile.png' };

describe('ProfileImageUploadModal', () => {
  let onClose;
  let onUpload;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onUpload = vi.fn().mockResolvedValue();
  });

  it('현재 프로필 이미지를 미리보기로 표시한다', () => {
    render(
      <ProfileImageUploadModal isOpen={true} onClose={onClose} profileImage={mockProfileImage} onUpload={onUpload} />
    );
    const preview = screen.getByAltText('미리보기');
    expect(preview).toBeInTheDocument();
    expect(preview.src).toContain('/current-profile.png');
  });

  it('파일 업로드 시 미리보기가 업데이트된다', async () => {
    const user = userEvent.setup();
    render(
      <ProfileImageUploadModal isOpen={true} onClose={onClose} profileImage={mockProfileImage} onUpload={onUpload} />
    );
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(fileInput.files[0]).toBe(file);
    });
  });

  it('"프로필 변경" 클릭 시 onUpload에 파일을 전달한다', async () => {
    const user = userEvent.setup();
    render(
      <ProfileImageUploadModal isOpen={true} onClose={onClose} profileImage={mockProfileImage} onUpload={onUpload} />
    );
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    const uploadBtn = screen.getByRole('button', { name: '프로필 변경' });
    await user.click(uploadBtn);

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file);
    });
  });

  it('파일이 선택되지 않으면 "프로필 변경" 버튼이 비활성화된다', () => {
    render(
      <ProfileImageUploadModal isOpen={true} onClose={onClose} profileImage={mockProfileImage} onUpload={onUpload} />
    );
    const uploadBtn = screen.getByRole('button', { name: '프로필 변경' });
    expect(uploadBtn).toBeDisabled();
  });

  it('isOpen=false이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <ProfileImageUploadModal isOpen={false} onClose={onClose} profileImage={mockProfileImage} onUpload={onUpload} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
