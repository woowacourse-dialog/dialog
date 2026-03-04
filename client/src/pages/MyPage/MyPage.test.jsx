import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import MyPage from './MyPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api/userApi', () => ({
  fetchMyInfo: vi.fn(),
  fetchMyProfileImage: vi.fn(),
  updateNotificationSetting: vi.fn(),
  updateProfileImage: vi.fn(),
  updateUserInfo: vi.fn(),
}));

vi.mock('../../utils/profileImage', () => ({
  getProfileImageSrc: vi.fn((img) => img?.customImageUri || img?.basicImageUri || '/default.png'),
}));

vi.mock('../../constants/tracks', () => ({
  getTrackDisplayName: vi.fn((track) => {
    const map = { BACKEND: 'BE', FRONTEND: 'FE', ANDROID: 'AOS' };
    return map[track] || track;
  }),
}));

vi.mock('./ProfileImageUploadModal', () => ({
  default: () => null,
}));

vi.mock('./ProfileEditModal', () => ({
  default: () => null,
}));

import { fetchMyInfo, fetchMyProfileImage, updateNotificationSetting } from '../../api/userApi';

const mockUser = {
  nickname: '테스트유저',
  track: 'FRONTEND',
  githubId: 'testuser123',
  isNotificationEnabled: false,
};

const mockUserNoGithub = {
  nickname: '테스트유저',
  track: 'FRONTEND',
  githubId: null,
  isNotificationEnabled: false,
};

function renderMyPage() {
  return render(
    <MemoryRouter>
      <MyPage />
    </MemoryRouter>
  );
}

describe('MyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMyInfo.mockResolvedValue(mockUser);
    fetchMyProfileImage.mockResolvedValue({ basicImageUri: '/profile.png' });
    updateNotificationSetting.mockResolvedValue({});
  });

  it('데이터 로드 후 아바타, 닉네임, 트랙 라벨(FE), 수정 버튼을 렌더링한다', async () => {
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByText('테스트유저')).toBeInTheDocument();
    });
    expect(screen.getByText('FE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /수정/ })).toBeInTheDocument();
    expect(screen.getByAltText('프로필 이미지')).toBeInTheDocument();
  });

  it('GitHub ID가 있으면 표시한다', async () => {
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByText(/testuser123/)).toBeInTheDocument();
    });
  });

  it('GitHub ID가 null이면 숨긴다', async () => {
    fetchMyInfo.mockResolvedValue(mockUserNoGithub);
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByText('테스트유저')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Github/i)).not.toBeInTheDocument();
  });

  it('알림 토글 스위치를 렌더링한다', async () => {
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  it('토글 클릭 시 updateNotificationSetting API를 호출한다', async () => {
    const user = userEvent.setup();
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('switch'));
    await waitFor(() => {
      expect(updateNotificationSetting).toHaveBeenCalledWith(true);
    });
  });

  it('"내가 개설한 토론 보기" 클릭 시 /discussion/my로 이동한다', async () => {
    const user = userEvent.setup();
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByText('내가 개설한 토론 보기')).toBeInTheDocument();
    });
    await user.click(screen.getByText('내가 개설한 토론 보기'));
    expect(mockNavigate).toHaveBeenCalledWith('/discussion/my');
  });

  it('"내가 스크랩한 토론 보기" 클릭 시 /discussion/scrap으로 이동한다', async () => {
    const user = userEvent.setup();
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByText('내가 스크랩한 토론 보기')).toBeInTheDocument();
    });
    await user.click(screen.getByText('내가 스크랩한 토론 보기'));
    expect(mockNavigate).toHaveBeenCalledWith('/discussion/scrap');
  });

  it('로딩 상태를 표시한다', () => {
    fetchMyInfo.mockImplementation(() => new Promise(() => {}));
    renderMyPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('fetch 실패 시 에러 메시지를 표시한다', async () => {
    fetchMyInfo.mockRejectedValue(new Error('fail'));
    renderMyPage();
    await waitFor(() => {
      expect(screen.getByText('유저 정보를 불러오지 못했습니다.')).toBeInTheDocument();
    });
  });
});
