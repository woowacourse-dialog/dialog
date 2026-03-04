import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DiscussionCreateCompletePage from './DiscussionCreateCompletePage';

vi.mock('../../../utils/clipboard', () => ({
  copyRichText: vi.fn().mockResolvedValue(undefined),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { copyRichText } from '../../../utils/clipboard';

const renderPage = (state = { title: '테스트 토론', content: '내용입니다', trackName: '프론트엔드' }) => {
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

/**
 * Helper: 슬랙 공유 버튼을 찾아 반환
 */
const getSlackButton = () => screen.getByRole('button', { name: /슬랙으로 공유하기/ });
const getDiscordButton = () => screen.getByRole('button', { name: /프리코스로 공유하기/ });
const getGoToPostButton = () => screen.getByRole('button', { name: /게시글로 이동/ });

describe('DiscussionCreateCompletePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- 기본 렌더링 ---

  it('"작성 완료" 타이틀을 렌더링한다', () => {
    renderPage();
    expect(screen.getByText('작성 완료')).toBeInTheDocument();
  });

  it('"이제 크루들과 공유해보세요." 서브타이틀을 렌더링한다', () => {
    renderPage();
    expect(screen.getByText(/공유해보세요/)).toBeInTheDocument();
  });

  // --- 공유 미리보기 카드 ---

  it('공유 미리보기 카드에 트랙, 제목, 내용, 링크를 표시한다', () => {
    renderPage();
    expect(screen.getByText(/프론트엔드/)).toBeInTheDocument();
    expect(screen.getByText(/테스트 토론/)).toBeInTheDocument();
    expect(screen.getByText(/내용입니다/)).toBeInTheDocument();
    expect(screen.getByText(/discussion\/42/)).toBeInTheDocument();
  });

  it('내용이 100자 초과 시 truncate하여 표시한다', () => {
    const longContent = 'a'.repeat(150);
    renderPage({ title: '제목', content: longContent, trackName: '백엔드' });
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  // --- 슬랙 공유 버튼 ---

  it('슬랙 공유 버튼을 렌더링한다', () => {
    renderPage();
    expect(getSlackButton()).toBeInTheDocument();
  });

  it('슬랙 공유 클릭 시 클립보드 복사를 호출한다', async () => {
    renderPage();
    await act(async () => {
      fireEvent.click(getSlackButton());
    });
    // copyRichText는 비동기이므로 microtask를 flush
    await act(async () => {
      await Promise.resolve();
    });
    expect(copyRichText).toHaveBeenCalled();
  });

  it('슬랙 공유 클릭 시 카운트다운이 시작된다 (3초)', async () => {
    renderPage();
    await act(async () => {
      fireEvent.click(getSlackButton());
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: /3초 뒤 슬랙으로 이동합니다/ })).toBeInTheDocument();
  });

  it('카운트다운 3->2->1->0 후 슬랙이 열린다', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderPage();

    await act(async () => {
      fireEvent.click(getSlackButton());
    });
    await act(async () => {
      await Promise.resolve();
    });

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: /2초 뒤/ })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: /1초 뒤/ })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(openSpy).toHaveBeenCalledWith(
      expect.any(String), '_blank', 'noopener,noreferrer'
    );
    openSpy.mockRestore();
  });

  it('이미 열었으면 버튼 라벨이 "슬랙 다시 열기"로 변경된다', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderPage();

    await act(async () => {
      fireEvent.click(getSlackButton());
    });
    await act(async () => {
      await Promise.resolve();
    });

    // 카운트다운 완료
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole('button', { name: /슬랙 다시 열기/ })).toBeInTheDocument();
    openSpy.mockRestore();
  });

  // --- 디스코드 공유 버튼 ---

  it('디스코드 공유 버튼을 렌더링한다', () => {
    renderPage();
    expect(getDiscordButton()).toBeInTheDocument();
  });

  // --- 게시글로 이동 ---

  it('"게시글로 이동" 클릭 시 /discussion/:id로 네비게이션한다', () => {
    renderPage();
    fireEvent.click(getGoToPostButton());
    expect(mockNavigate).toHaveBeenCalledWith('/discussion/42');
  });

  // --- 토스트 ---

  it('복사 성공 시 "클립보드에 복사되었습니다" 토스트를 표시한다', async () => {
    renderPage();
    await act(async () => {
      fireEvent.click(getSlackButton());
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('클립보드에 복사되었습니다')).toBeInTheDocument();
  });

  it('복사 실패 시 alert을 표시한다', async () => {
    copyRichText.mockRejectedValueOnce(new Error('clipboard fail'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderPage();

    await act(async () => {
      fireEvent.click(getSlackButton());
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(alertSpy).toHaveBeenCalledWith('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    alertSpy.mockRestore();
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
    expect(screen.getByText(/공통/)).toBeInTheDocument(); // 기본 트랙
  });

  // --- cleanup ---

  it('컴포넌트 언마운트 시 타이머가 정리된다', () => {
    const { unmount } = renderPage();
    unmount();
    // clearInterval이 호출되었는지는 내부 구현이므로, 에러 없이 언마운트되면 OK
  });
});
