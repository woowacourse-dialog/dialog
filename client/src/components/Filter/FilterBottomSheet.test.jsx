import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/render';
import userEvent from '@testing-library/user-event';
import FilterBottomSheet from './FilterBottomSheet';

describe('FilterBottomSheet', () => {
  const defaultProps = {
    isOpen: true,
    selectedCategories: [],
    selectedStatuses: [],
    selectedDiscussionTypes: [],
    onApply: vi.fn(),
    onReset: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('열기/닫기', () => {
    it('isOpen=true이면 바텀시트를 렌더링한다', () => {
      render(<FilterBottomSheet {...defaultProps} />);
      expect(screen.getByText('필터')).toBeInTheDocument();
    });

    it('isOpen=false이면 바텀시트를 렌더링하지 않는다', () => {
      render(<FilterBottomSheet {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('필터')).not.toBeInTheDocument();
    });

    it('닫기(X) 버튼 클릭 시 onClose를 호출한다', async () => {
      const user = userEvent.setup();
      render(<FilterBottomSheet {...defaultProps} />);
      await user.click(screen.getByLabelText('닫기'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('오버레이 클릭 시 onClose를 호출한다', async () => {
      const user = userEvent.setup();
      render(<FilterBottomSheet {...defaultProps} />);
      await user.click(screen.getByTestId('bottom-sheet-overlay'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('필터 선택', () => {
    it('트랙/타입/상태 필터 칩들을 렌더링한다', () => {
      render(<FilterBottomSheet {...defaultProps} />);
      // 트랙
      expect(screen.getByText('트랙')).toBeInTheDocument();
      expect(screen.getByText('공통')).toBeInTheDocument();
      expect(screen.getByText('BE')).toBeInTheDocument();
      expect(screen.getByText('FE')).toBeInTheDocument();
      expect(screen.getByText('AN')).toBeInTheDocument();
      // 타입
      expect(screen.getByText('토론 타입')).toBeInTheDocument();
      expect(screen.getByText('온라인')).toBeInTheDocument();
      expect(screen.getByText('오프라인')).toBeInTheDocument();
      // 상태
      expect(screen.getByText('상태')).toBeInTheDocument();
      expect(screen.getByText('모집 중')).toBeInTheDocument();
      expect(screen.getByText('모집 완료')).toBeInTheDocument();
      expect(screen.getByText('토론 중')).toBeInTheDocument();
      expect(screen.getByText('토론 완료')).toBeInTheDocument();
    });

    it('칩 클릭으로 로컬 상태를 토글한다 (아직 적용 안 됨)', async () => {
      const user = userEvent.setup();
      render(<FilterBottomSheet {...defaultProps} />);
      await user.click(screen.getByText('BE'));
      // 로컬 상태만 변경, onApply는 아직 호출 안 됨
      expect(defaultProps.onApply).not.toHaveBeenCalled();
    });

    it('선택된 칩은 selected 상태로 표시된다', () => {
      render(
        <FilterBottomSheet
          {...defaultProps}
          selectedCategories={['backend']}
        />,
      );
      const beChip = screen.getByText('BE');
      expect(beChip).toHaveClass('selected');
    });
  });

  describe('적용하기', () => {
    it('"적용하기" 버튼을 렌더링한다', () => {
      render(<FilterBottomSheet {...defaultProps} />);
      expect(screen.getByText('적용하기')).toBeInTheDocument();
    });

    it('"적용하기" 클릭 시 onApply를 호출하고 닫힌다', async () => {
      const user = userEvent.setup();
      render(<FilterBottomSheet {...defaultProps} />);
      await user.click(screen.getByText('BE'));
      await user.click(screen.getByText('적용하기'));
      expect(defaultProps.onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['backend'],
        }),
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('"적용하기" 클릭 시 여러 필터 그룹의 선택을 모두 전달한다', async () => {
      const user = userEvent.setup();
      render(<FilterBottomSheet {...defaultProps} />);
      await user.click(screen.getByText('BE'));
      await user.click(screen.getByText('온라인'));
      await user.click(screen.getByText('모집 중'));
      await user.click(screen.getByText('적용하기'));
      expect(defaultProps.onApply).toHaveBeenCalledWith({
        categories: ['backend'],
        statuses: ['recruiting'],
        discussionTypes: ['online'],
      });
    });
  });

  describe('초기화', () => {
    it('"초기화" 버튼을 렌더링한다', () => {
      render(<FilterBottomSheet {...defaultProps} />);
      expect(screen.getByText('초기화')).toBeInTheDocument();
    });

    it('"초기화" 클릭 시 모든 로컬 필터를 해제한다', async () => {
      const user = userEvent.setup();
      render(
        <FilterBottomSheet
          {...defaultProps}
          selectedCategories={['backend']}
        />,
      );
      await user.click(screen.getByText('초기화'));
      // 이후 "적용하기"를 누르면 빈 배열로 호출
      await user.click(screen.getByText('적용하기'));
      expect(defaultProps.onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: [],
          statuses: [],
          discussionTypes: [],
        }),
      );
    });
  });

  describe('드래그 핸들', () => {
    it('드래그 핸들 바를 렌더링한다', () => {
      render(<FilterBottomSheet {...defaultProps} />);
      expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    });
  });
});
