import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/render';
import userEvent from '@testing-library/user-event';
import FilterCard from './FilterCard';

describe('FilterCard', () => {
  const defaultProps = {
    selectedCategories: [],
    selectedStatuses: [],
    selectedDiscussionTypes: [],
    onCategoryChange: vi.fn(),
    onStatusChange: vi.fn(),
    onDiscussionTypeChange: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('필터 그룹 렌더링', () => {
    it('"필터" 제목을 렌더링한다', () => {
      render(<FilterCard {...defaultProps} />);
      expect(screen.getByText('필터')).toBeInTheDocument();
    });

    it('트랙 필터 그룹 (공통, BE, FE, AN)을 렌더링한다', () => {
      render(<FilterCard {...defaultProps} />);
      expect(screen.getByText('트랙')).toBeInTheDocument();
      expect(screen.getByText('공통')).toBeInTheDocument();
      expect(screen.getByText('BE')).toBeInTheDocument();
      expect(screen.getByText('FE')).toBeInTheDocument();
      expect(screen.getByText('AN')).toBeInTheDocument();
    });

    it('토론 타입 필터 그룹 (온라인, 오프라인)을 렌더링한다', () => {
      render(<FilterCard {...defaultProps} />);
      expect(screen.getByText('토론 타입')).toBeInTheDocument();
      expect(screen.getByText('온라인')).toBeInTheDocument();
      expect(screen.getByText('오프라인')).toBeInTheDocument();
    });

    it('상태 필터 그룹 (모집 중, 모집 완료, 토론 중, 토론 완료)을 렌더링한다', () => {
      render(<FilterCard {...defaultProps} />);
      expect(screen.getByText('상태')).toBeInTheDocument();
      expect(screen.getByText('모집 중')).toBeInTheDocument();
      expect(screen.getByText('모집 완료')).toBeInTheDocument();
      expect(screen.getByText('토론 중')).toBeInTheDocument();
      expect(screen.getByText('토론 완료')).toBeInTheDocument();
    });
  });

  describe('FilterChip 토글', () => {
    it('트랙 칩 클릭 시 onCategoryChange를 호출한다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} />);
      await user.click(screen.getByText('BE'));
      expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(['backend']);
    });

    it('이미 선택된 칩 클릭 시 선택 해제한다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} selectedCategories={['backend']} />);
      await user.click(screen.getByText('BE'));
      expect(defaultProps.onCategoryChange).toHaveBeenCalledWith([]);
    });

    it('선택된 칩은 selected 클래스를 적용한다', () => {
      render(<FilterCard {...defaultProps} selectedCategories={['backend']} />);
      const beChip = screen.getByText('BE');
      expect(beChip).toHaveClass('selected');
    });

    it('토론 타입 칩 클릭 시 onDiscussionTypeChange를 호출한다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} />);
      await user.click(screen.getByText('온라인'));
      expect(defaultProps.onDiscussionTypeChange).toHaveBeenCalledWith(['online']);
    });

    it('이미 선택된 토론 타입 칩 클릭 시 선택 해제한다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} selectedDiscussionTypes={['online']} />);
      await user.click(screen.getByText('온라인'));
      expect(defaultProps.onDiscussionTypeChange).toHaveBeenCalledWith([]);
    });

    it('상태 칩 클릭 시 onStatusChange를 호출한다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} />);
      await user.click(screen.getByText('모집 중'));
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(['recruiting']);
    });

    it('이미 선택된 상태 칩 클릭 시 선택 해제한다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} selectedStatuses={['recruiting']} />);
      await user.click(screen.getByText('모집 중'));
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith([]);
    });

    it('여러 칩을 동시에 선택할 수 있다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} selectedCategories={['common']} />);
      await user.click(screen.getByText('BE'));
      expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(['common', 'backend']);
    });
  });

  describe('필터 초기화', () => {
    it('"필터 초기화" 버튼을 렌더링한다', () => {
      render(<FilterCard {...defaultProps} />);
      expect(screen.getByText('필터 초기화')).toBeInTheDocument();
    });

    it('"필터 초기화" 클릭 시 onReset을 호출한다', async () => {
      const user = userEvent.setup();
      render(<FilterCard {...defaultProps} />);
      await user.click(screen.getByText('필터 초기화'));
      expect(defaultProps.onReset).toHaveBeenCalled();
    });
  });
});
