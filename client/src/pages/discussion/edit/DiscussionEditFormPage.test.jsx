import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DiscussionEditFormPage from './DiscussionEditFormPage';

vi.mock('../../../api/discussion', () => ({
  findDiscussionById: vi.fn(),
  updateOnlineDiscussion: vi.fn(),
  updateOfflineDiscussion: vi.fn(),
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

import { findDiscussionById, updateOnlineDiscussion } from '../../../api/discussion';

const mockOnlineDiscussion = {
  data: {
    discussionType: 'ONLINE',
    commonDiscussionInfo: {
      title: '기존 제목',
      content: '기존 내용',
      category: 'BACKEND',
    },
    onlineDiscussionInfo: { endDate: '2026-03-10' },
  },
};

const mockOfflineDiscussion = {
  data: {
    discussionType: 'OFFLINE',
    commonDiscussionInfo: {
      title: '오프라인 제목',
      content: '오프라인 내용',
      category: 'FRONTEND',
    },
    offlineDiscussionInfo: {
      startAt: '2026-03-05T14:00:00',
      endAt: '2026-03-05T16:00:00',
      maxParticipantCount: 5,
      place: '강남역 스터디룸',
    },
  },
};

const renderEditPage = (id = '42') => render(
  <MemoryRouter initialEntries={[`/discussion/${id}/edit`]}>
    <Routes>
      <Route path="/discussion/:id/edit" element={<DiscussionEditFormPage />} />
    </Routes>
  </MemoryRouter>
);

describe('DiscussionEditFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findDiscussionById.mockResolvedValue(mockOnlineDiscussion);
  });

  it('기존 데이터를 로드하여 폼에 채운다', async () => {
    renderEditPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('기존 제목')).toBeInTheDocument();
    });
  });

  it('토론 유형 토글이 읽기 전용이다', async () => {
    renderEditPage();
    await waitFor(() => {
      expect(screen.getByText('변경 불가')).toBeInTheDocument();
    });
  });

  it('트랙이 기존 값으로 선택되어 있다', async () => {
    renderEditPage();
    await waitFor(() => {
      expect(screen.getByLabelText('트랙')).toHaveValue('BACKEND');
    });
  });

  it('"수정" 클릭 시 updateOnlineDiscussion API를 호출한다', async () => {
    updateOnlineDiscussion.mockResolvedValue({});
    renderEditPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('기존 제목')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    await waitFor(() => {
      expect(updateOnlineDiscussion).toHaveBeenCalledWith('42', expect.any(Object));
    });
  });

  it('성공 시 /discussion/:id로 이동한다 (complete 아님)', async () => {
    updateOnlineDiscussion.mockResolvedValue({});
    renderEditPage();

    await waitFor(() => expect(screen.getByDisplayValue('기존 제목')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '수정' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/discussion/42');
    });
  });

  it('로딩 중 상태를 표시한다', () => {
    findDiscussionById.mockReturnValue(new Promise(() => {}));
    renderEditPage();
    expect(screen.getByText(/로딩|Loading/i)).toBeInTheDocument();
  });

  it('오프라인 토론 수정 시 장소/시간/참가자 필드가 표시된다', async () => {
    findDiscussionById.mockResolvedValue(mockOfflineDiscussion);
    renderEditPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('강남역 스터디룸')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });

  it('"취소" 클릭 시 /discussion/:id로 이동한다', async () => {
    renderEditPage();
    await waitFor(() => expect(screen.getByDisplayValue('기존 제목')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(mockNavigate).toHaveBeenCalledWith('/discussion/42');
  });
});
