import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DiscussionCreateCompletePage from './DiscussionCreateCompletePage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const defaultState = {
  title: '테스트 토론',
  content: '내용입니다',
  trackName: '프론트엔드',
  discussionType: 'ONLINE',
  endDate: '2026-03-06',
};

const offlineState = {
  title: '오프라인 토론',
  content: '오프라인 내용',
  trackName: '백엔드',
  discussionType: 'OFFLINE',
  location: '선릉 캠퍼스',
  date: '2026-03-10',
  startTime: '14:00',
  endTime: '16:00',
  participantCount: 5,
};

const renderPage = (state = defaultState) => {
  return render(
    <MemoryRouter initialEntries={[{
      pathname: '/discussion/42/complete',
      state,
    }]}>
      <Routes>
        <Route path="/discussion/:id/complete" element={<DiscussionCreateCompletePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('DiscussionCreateCompletePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- 기본 렌더링 ---

  it('"작성 완료" 타이틀을 렌더링한다', () => {
    renderPage();
    expect(screen.getByText('작성 완료')).toBeInTheDocument();
  });

  it('"아래 링크를 통해 토론에 참여해보세요." 서브타이틀을 렌더링한다', () => {
    renderPage();
    expect(screen.getByText('아래 링크를 통해 토론에 참여해보세요.')).toBeInTheDocument();
  });

  // --- 프리뷰 카드 ---

  it('프리뷰 카드에 제목, 내용, 링크를 표시한다', () => {
    renderPage();
    expect(screen.getByText('테스트 토론')).toBeInTheDocument();
    expect(screen.getByText('내용입니다')).toBeInTheDocument();
    expect(screen.getByText(/discussion\/42/)).toBeInTheDocument();
  });

  it('내용이 100자 초과 시 truncate하여 표시한다', () => {
    const longContent = 'a'.repeat(150);
    renderPage({ ...defaultState, content: longContent });
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  it('내용이 없으면 본문 미리보기를 표시하지 않는다', () => {
    renderPage({ ...defaultState, content: '' });
    const previewBody = document.querySelector('[class*="previewBody"]');
    expect(previewBody).not.toBeInTheDocument();
  });

  // --- 메타 정보 (온라인) ---

  it('온라인 토론에서 트랙, 유형, 종료일을 표시한다', () => {
    renderPage();
    expect(screen.getByText('프론트엔드')).toBeInTheDocument();
    expect(screen.getByText('온라인')).toBeInTheDocument();
    expect(screen.getByText(/종료일 2026-03-06/)).toBeInTheDocument();
  });

  // --- 메타 정보 (오프라인) ---

  it('오프라인 토론에서 트랙, 유형, 장소, 일시, 시간, 인원을 표시한다', () => {
    renderPage(offlineState);
    expect(screen.getByText('백엔드')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
    expect(screen.getByText('선릉 캠퍼스')).toBeInTheDocument();
    expect(screen.getByText('2026-03-10')).toBeInTheDocument();
    expect(screen.getByText('14:00 ~ 16:00')).toBeInTheDocument();
    expect(screen.getByText('최대 5명')).toBeInTheDocument();
  });

  // --- 링크 복사 ---

  it('linkArea 클릭 시 클립보드에 URL을 복사한다', async () => {
    renderPage();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('링크 복사'));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/discussion/42')
    );
  });

  it('복사 성공 시 "클립보드에 복사되었습니다" 메시지를 표시한다', async () => {
    renderPage();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('링크 복사'));
    });
    expect(screen.getByText('클립보드에 복사되었습니다')).toBeInTheDocument();
  });

  it('복사 성공 메시지가 3초 후 사라진다', async () => {
    renderPage();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('링크 복사'));
    });
    expect(screen.getByText('클립보드에 복사되었습니다')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText('클립보드에 복사되었습니다')).not.toBeInTheDocument();
  });

  it('복사 실패 시 alert을 표시한다', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValueOnce(new Error('fail'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('링크 복사'));
    });
    expect(alertSpy).toHaveBeenCalledWith('클립보드 복사에 실패했습니다.');
    alertSpy.mockRestore();
  });

  // --- 게시글로 이동 ---

  it('"게시글로 이동" 클릭 시 /discussion/:id로 네비게이션한다', () => {
    renderPage();
    fireEvent.click(screen.getByText('게시글로 이동'));
    expect(mockNavigate).toHaveBeenCalledWith('/discussion/42');
  });

  // --- state 없는 경우 ---

  it('state가 없어도 기본값으로 렌더링한다 (직접 URL 접근)', () => {
    render(
      <MemoryRouter initialEntries={['/discussion/42/complete']}>
        <Routes>
          <Route path="/discussion/:id/complete" element={<DiscussionCreateCompletePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('작성 완료')).toBeInTheDocument();
    expect(screen.getByText(/토론 #42/)).toBeInTheDocument();
  });

  // --- cleanup ---

  it('컴포넌트 언마운트 시 타이머가 정리된다', () => {
    const { unmount } = renderPage();
    unmount();
  });
});
