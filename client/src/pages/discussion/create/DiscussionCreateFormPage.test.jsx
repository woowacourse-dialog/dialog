import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DiscussionCreateFormPage from './DiscussionCreateFormPage';

vi.mock('../../../api/discussion', () => ({
  createOnlineDiscussion: vi.fn(),
  createOfflineDiscussion: vi.fn(),
}));
vi.mock('../../../api/userApi', () => ({
  userApi: { getTrack: vi.fn() },
}));

// Mock MarkdownEditor to avoid complex editor dependency
vi.mock('../../../components/MarkdownEditor/MarkdownEditor', () => ({
  default: ({ value, onChange }) => (
    <textarea
      data-testid="markdown-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { createOnlineDiscussion, createOfflineDiscussion } from '../../../api/discussion';
import { userApi } from '../../../api/userApi';

const renderPage = () => render(
  <MemoryRouter>
    <DiscussionCreateFormPage />
  </MemoryRouter>
);

describe('DiscussionCreateFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userApi.getTrack.mockResolvedValue({ data: { data: { track: 'BACKEND' } } });
  });

  it('"새 토론 등록" 타이틀을 렌더링한다', async () => {
    renderPage();
    expect(screen.getByText('새 토론 등록')).toBeInTheDocument();
  });

  it('필수 정보 영역을 렌더링한다 (제목, 트랙, 타입, 종료일)', async () => {
    renderPage();
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
    expect(screen.getByLabelText('트랙')).toBeInTheDocument();
    expect(screen.getByText('온라인')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
    expect(screen.getByLabelText('토론 종료 날짜')).toBeInTheDocument();
  });

  it('마운트 시 사용자 트랙을 자동 선택한다', async () => {
    renderPage();
    await waitFor(() => {
      expect(userApi.getTrack).toHaveBeenCalled();
    });
    // BACKEND가 선택되어 있어야 함
    await waitFor(() => {
      expect(screen.getByLabelText('트랙')).toHaveValue('BACKEND');
    });
  });

  it('"등록" 클릭 시 createOnlineDiscussion API를 호출한다', async () => {
    createOnlineDiscussion.mockResolvedValue({ data: { discussionId: 42 } });
    renderPage();

    await userEvent.type(screen.getByLabelText('제목'), '테스트 토론');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => {
      expect(createOnlineDiscussion).toHaveBeenCalledWith(
        expect.objectContaining({ title: '테스트 토론' })
      );
    });
  });

  it('성공 시 /discussion/:id/complete로 이동한다', async () => {
    createOnlineDiscussion.mockResolvedValue({ data: { discussionId: 42 } });
    renderPage();

    await userEvent.type(screen.getByLabelText('제목'), '테스트 토론');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/discussion/42/complete',
        expect.objectContaining({ state: expect.any(Object) })
      );
    });
  });

  it('제목 미입력 시 에러를 표시한다', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument();
  });

  it('"취소" 클릭 시 navigate(-1)을 호출한다', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    createOnlineDiscussion.mockRejectedValue({
      response: { data: { message: '서버 에러입니다' } }
    });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderPage();

    await userEvent.type(screen.getByLabelText('제목'), '테스트');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('서버 에러입니다');
    });
    alertSpy.mockRestore();
  });
});

describe('DiscussionCreateFormPage -- 오프라인', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userApi.getTrack.mockResolvedValue({ data: { data: { track: 'BACKEND' } } });
  });

  it('오프라인 선택 시 추가 필드를 표시한다', async () => {
    renderPage();
    await userEvent.click(screen.getByText('오프라인'));
    expect(screen.getByLabelText('토론 장소')).toBeInTheDocument();
    expect(screen.getByLabelText('참여자 수')).toBeInTheDocument();
    expect(screen.getByLabelText('날짜')).toBeInTheDocument();
    expect(screen.getByLabelText('시작 시간')).toBeInTheDocument();
    expect(screen.getByLabelText('종료 시간')).toBeInTheDocument();
  });

  it('오프라인 선택 시 종료 날짜 필드가 사라진다', async () => {
    renderPage();
    await userEvent.click(screen.getByText('오프라인'));
    expect(screen.queryByLabelText('토론 종료 날짜')).not.toBeInTheDocument();
  });

  it('"등록" 클릭 시 createOfflineDiscussion API를 호출한다', async () => {
    createOfflineDiscussion.mockResolvedValue({ data: { discussionId: 43 } });
    renderPage();

    await userEvent.click(screen.getByText('오프라인'));
    await userEvent.type(screen.getByLabelText('제목'), '오프라인 토론');
    await userEvent.type(screen.getByLabelText('토론 장소'), '강남역');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => {
      expect(createOfflineDiscussion).toHaveBeenCalled();
    });
  });

  it('장소 미입력 시 에러를 표시한다', async () => {
    renderPage();
    await userEvent.click(screen.getByText('오프라인'));
    await userEvent.type(screen.getByLabelText('제목'), '제목');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(screen.getByText('장소를 입력해주세요')).toBeInTheDocument();
  });
});
