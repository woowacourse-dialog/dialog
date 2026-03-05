import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AISummary from './AISummary';

vi.mock('../../api/discussion', () => ({
  generateDiscussionSummary: vi.fn(),
}));

const onlineDiscussion = {
  discussionType: 'ONLINE',
  commonDiscussionInfo: {
    author: { id: 1, name: '작성자' },
  },
  onlineDiscussionInfo: {
    endDate: '2099-12-31', // 미래 날짜
  },
};

const expiredDiscussion = {
  ...onlineDiscussion,
  onlineDiscussionInfo: {
    endDate: '2020-01-01', // 과거 날짜
  },
};

const offlineDiscussion = {
  discussionType: 'OFFLINE',
  commonDiscussionInfo: {
    author: { id: 1, name: '작성자' },
  },
  offlineDiscussionInfo: {
    startAt: '2025-06-01T14:00:00',
    endAt: '2025-06-01T16:00:00',
  },
};

describe('AISummary', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('상태 1: 요약 없음 + 비작성자', () => {
    it('"아직 토론 요약이 존재하지 않습니다" 메시지를 표시한다', () => {
      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 999 }} // 비작성자
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      expect(screen.getByText(/아직 토론 요약이 존재하지 않습니다/)).toBeInTheDocument();
    });

    it('AI 요약 생성 버튼을 표시하지 않는다', () => {
      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 999 }}
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      expect(screen.queryByText('AI 요약 생성하기')).not.toBeInTheDocument();
    });

    it('비로그인 + 요약 없음 → 안내 메시지 표시', () => {
      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={null}
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      expect(screen.getByText(/아직 토론 요약이 존재하지 않습니다/)).toBeInTheDocument();
    });
  });

  describe('상태 2: 요약 있음', () => {
    it('요약 내용을 렌더링한다', () => {
      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 999 }}
          initialSummary="이 토론은 React 상태 관리에 대한 심도 있는 논의가 이루어졌습니다."
          onSummaryUpdate={vi.fn()}
        />
      );
      expect(screen.getByText(/React 상태 관리/)).toBeInTheDocument();
    });

    it('접기/펼치기 토글 동작', async () => {
      const longSummary = 'A'.repeat(300);
      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 1 }}
          initialSummary={longSummary}
          onSummaryUpdate={vi.fn()}
        />
      );
      // 긴 요약 → 펼치기 버튼 존재
      const toggleBtn = screen.getByText(/요약 더보기|펼치기/);
      expect(toggleBtn).toBeInTheDocument();
      await userEvent.click(toggleBtn);
      expect(screen.getByText(/요약 접기|접기/)).toBeInTheDocument();
    });

    it('복사 버튼 클릭 시 클립보드에 복사', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 1 }}
          initialSummary="요약 내용"
          onSummaryUpdate={vi.fn()}
        />
      );
      await userEvent.click(screen.getByText('복사'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('요약 내용');
    });
  });

  describe('상태 3: 작성자 + 요약 없음', () => {
    it('"AI 요약 생성하기" 버튼을 표시한다', () => {
      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 1 }} // 작성자
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      expect(screen.getByText('AI 요약 생성하기')).toBeInTheDocument();
    });

    it('버튼 클릭 시 generateDiscussionSummary API 호출', async () => {
      const { generateDiscussionSummary } = await import('../../api/discussion');
      generateDiscussionSummary.mockResolvedValueOnce({
        data: { summary: '생성된 요약입니다.' },
      });
      const onSummaryUpdate = vi.fn();

      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 1 }}
          initialSummary=""
          onSummaryUpdate={onSummaryUpdate}
        />
      );
      await userEvent.click(screen.getByText('AI 요약 생성하기'));
      await waitFor(() => {
        expect(generateDiscussionSummary).toHaveBeenCalledWith(1, 30000);
      });
    });
  });

  describe('상태 4: 생성 중', () => {
    it('스피너 + "AI가 분석 중" 메시지를 표시한다', async () => {
      const { generateDiscussionSummary } = await import('../../api/discussion');
      generateDiscussionSummary.mockReturnValue(new Promise(() => {})); // 완료되지 않음

      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 1 }}
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      await userEvent.click(screen.getByText('AI 요약 생성하기'));
      expect(screen.getByText(/AI가.*분석/)).toBeInTheDocument();
    });
  });

  describe('상태 5: 생성 실패', () => {
    it('에러 메시지 + "다시 시도" 버튼을 표시한다', async () => {
      const { generateDiscussionSummary } = await import('../../api/discussion');
      generateDiscussionSummary.mockRejectedValueOnce(new Error('timeout'));

      render(
        <AISummary
          discussionId={1}
          discussion={onlineDiscussion}
          me={{ id: 1 }}
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      await userEvent.click(screen.getByText('AI 요약 생성하기'));
      await waitFor(() => {
        expect(screen.getByText(/다시 시도/)).toBeInTheDocument();
      });
    });
  });

  describe('상태 6: 종료일 이후 + 요약 없음', () => {
    it('"요약 생성 불가" 안내를 표시한다', () => {
      render(
        <AISummary
          discussionId={1}
          discussion={expiredDiscussion}
          me={{ id: 1 }} // 작성자
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      expect(screen.getByText(/요약.*생성.*불가|기간 만료/)).toBeInTheDocument();
    });
  });

  describe('상태 7: 오프라인 토론', () => {
    it('자물쇠 아이콘 + 오프라인 안내를 표시한다', () => {
      render(
        <AISummary
          discussionId={1}
          discussion={offlineDiscussion}
          me={{ id: 1 }}
          initialSummary=""
          onSummaryUpdate={vi.fn()}
        />
      );
      expect(screen.getByText(/오프라인.*요약.*제공하지 않습니다/)).toBeInTheDocument();
    });
  });
});
