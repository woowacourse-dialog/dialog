import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionBar from './ActionBar';

vi.mock('../../api/like', () => ({
  likeDiscussion: vi.fn(),
  deleteLikeDiscussion: vi.fn(),
  getLikeStatus: vi.fn(),
}));

vi.mock('../../api/scrap', () => ({
  scrapDiscussion: vi.fn(),
  deleteScrapDiscussion: vi.fn(),
  getScrapStatus: vi.fn(),
}));

describe('ActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('좋아요 버튼', () => {
    it('비활성(빈 하트) 상태를 렌더링한다', () => {
      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={5}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('좋아요')).toBeInTheDocument();
    });

    it('활성(채운 하트) 상태를 렌더링한다', () => {
      render(
        <ActionBar
          discussionId={1}
          initialLiked={true}
          initialLikeCount={5}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      expect(screen.getByLabelText('좋아요 취소')).toBeInTheDocument();
    });

    it('좋아요 클릭 시 POST 호출 + 카운트 증가', async () => {
      const { likeDiscussion } = await import('../../api/like');
      likeDiscussion.mockResolvedValueOnce({});

      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={5}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      await userEvent.click(screen.getByLabelText('좋아요'));
      expect(likeDiscussion).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('좋아요 취소 클릭 시 DELETE 호출 + 카운트 감소', async () => {
      const { deleteLikeDiscussion } = await import('../../api/like');
      deleteLikeDiscussion.mockResolvedValueOnce({});

      render(
        <ActionBar
          discussionId={1}
          initialLiked={true}
          initialLikeCount={5}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      await userEvent.click(screen.getByLabelText('좋아요 취소'));
      expect(deleteLikeDiscussion).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('비로그인 시 좋아요 클릭 불가', async () => {
      const { likeDiscussion } = await import('../../api/like');
      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={5}
          initialBookmarked={false}
          isLoggedIn={false}
        />
      );
      await userEvent.click(screen.getByLabelText('좋아요'));
      expect(likeDiscussion).not.toHaveBeenCalled();
    });
  });

  describe('스크랩 버튼', () => {
    it('비활성 상태 — "스크랩" 텍스트', () => {
      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={0}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      expect(screen.getByText('스크랩')).toBeInTheDocument();
    });

    it('활성 상태 — "스크랩됨" 텍스트', () => {
      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={0}
          initialBookmarked={true}
          isLoggedIn={true}
        />
      );
      expect(screen.getByText('스크랩됨')).toBeInTheDocument();
    });

    it('스크랩 클릭 시 POST 호출 → "스크랩됨"으로 전환', async () => {
      const { scrapDiscussion } = await import('../../api/scrap');
      scrapDiscussion.mockResolvedValueOnce({});

      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={0}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      await userEvent.click(screen.getByText('스크랩'));
      expect(scrapDiscussion).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.getByText('스크랩됨')).toBeInTheDocument();
      });
    });

    it('스크랩 취소 클릭 시 DELETE 호출 → "스크랩"으로 전환', async () => {
      const { deleteScrapDiscussion } = await import('../../api/scrap');
      deleteScrapDiscussion.mockResolvedValueOnce({});

      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={0}
          initialBookmarked={true}
          isLoggedIn={true}
        />
      );
      await userEvent.click(screen.getByText('스크랩됨'));
      expect(deleteScrapDiscussion).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.getByText('스크랩')).toBeInTheDocument();
      });
    });

    it('비로그인 시 스크랩 클릭 불가', async () => {
      const { scrapDiscussion } = await import('../../api/scrap');
      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={0}
          initialBookmarked={false}
          isLoggedIn={false}
        />
      );
      await userEvent.click(screen.getByText('스크랩'));
      expect(scrapDiscussion).not.toHaveBeenCalled();
    });
  });

  describe('공유 버튼', () => {
    it('공유 버튼을 렌더링한다', () => {
      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={0}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      expect(screen.getByText('공유')).toBeInTheDocument();
    });

    it('공유 버튼 클릭 시 클립보드에 URL을 복사한다', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      render(
        <ActionBar
          discussionId={1}
          initialLiked={false}
          initialLikeCount={0}
          initialBookmarked={false}
          isLoggedIn={true}
        />
      );
      await userEvent.click(screen.getByText('공유'));
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
