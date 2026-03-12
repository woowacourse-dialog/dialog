import { render, screen, fireEvent } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: '삭제 확인',
    message: '정말 삭제하시겠습니까?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('isOpen=false — 아무것도 렌더링하지 않는다', () => {
      render(<ConfirmModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('삭제 확인')).not.toBeInTheDocument();
    });
    it('isOpen=true — 모달을 렌더링한다', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByText('삭제 확인')).toBeInTheDocument();
    });
    it('title을 표시한다', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByText('삭제 확인')).toBeInTheDocument();
    });
    it('message를 표시한다', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
    });
  });

  describe('버튼', () => {
    it('취소 버튼을 렌더링한다', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });
    it('확인 버튼을 렌더링한다', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    });
    it('confirmLabel prop으로 확인 버튼 텍스트를 변경할 수 있다', () => {
      render(<ConfirmModal {...defaultProps} confirmLabel="삭제" />);
      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    });
    it('cancelLabel prop으로 취소 버튼 텍스트를 변경할 수 있다', () => {
      render(<ConfirmModal {...defaultProps} cancelLabel="돌아가기" />);
      expect(screen.getByRole('button', { name: '돌아가기' })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('확인 버튼 클릭 시 onConfirm을 호출한다', async () => {
      render(<ConfirmModal {...defaultProps} />);
      await userEvent.click(screen.getByRole('button', { name: '확인' }));
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
    it('취소 버튼 클릭 시 onClose를 호출한다', async () => {
      render(<ConfirmModal {...defaultProps} />);
      await userEvent.click(screen.getByRole('button', { name: '취소' }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
    it('ESC 키 누르면 onClose를 호출한다', () => {
      render(<ConfirmModal {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('variant', () => {
    it('variant="danger" — 확인 버튼에 danger 클래스 적용', () => {
      render(<ConfirmModal {...defaultProps} variant="danger" />);
      const confirmBtn = screen.getByRole('button', { name: '확인' });
      expect(confirmBtn).toHaveClass('danger');
    });
  });

  describe('로딩 상태', () => {
    it('loading=true — 확인 버튼이 로딩 상태가 된다', () => {
      render(<ConfirmModal {...defaultProps} loading />);
      expect(screen.getByText('처리중...')).toBeInTheDocument();
    });
    it('loading=true — 취소 버튼이 비활성화된다', () => {
      render(<ConfirmModal {...defaultProps} loading />);
      expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    });
  });
});
