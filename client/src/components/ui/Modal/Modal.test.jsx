import { render, screen, fireEvent } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  describe('렌더링', () => {
    it('isOpen=false -- 아무것도 렌더링하지 않는다', () => {
      render(<Modal isOpen={false} onClose={() => {}}>내용</Modal>);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=true -- overlay + content를 렌더링한다', () => {
      render(<Modal isOpen={true} onClose={() => {}}>내용</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('title prop이 있으면 제목을 표시한다', () => {
      render(<Modal isOpen={true} onClose={() => {}} title="제목">내용</Modal>);
      expect(screen.getByText('제목')).toBeInTheDocument();
    });

    it('children을 렌더링한다', () => {
      render(<Modal isOpen={true} onClose={() => {}}>모달 내용</Modal>);
      expect(screen.getByText('모달 내용')).toBeInTheDocument();
    });
  });

  describe('닫기', () => {
    it('닫기(X) 버튼 클릭 시 onClose를 호출한다', async () => {
      const handleClose = vi.fn();
      render(<Modal isOpen={true} onClose={handleClose}>내용</Modal>);
      await userEvent.click(screen.getByLabelText('닫기'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('overlay 클릭 시 onClose를 호출한다', async () => {
      const handleClose = vi.fn();
      render(<Modal isOpen={true} onClose={handleClose}>내용</Modal>);
      const overlay = screen.getByRole('dialog').parentElement;
      await userEvent.click(overlay);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('content 영역 클릭 시 onClose가 호출되지 않는다', async () => {
      const handleClose = vi.fn();
      render(<Modal isOpen={true} onClose={handleClose}>내용</Modal>);
      await userEvent.click(screen.getByText('내용'));
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('ESC 키 누르면 onClose를 호출한다', () => {
      const handleClose = vi.fn();
      render(<Modal isOpen={true} onClose={handleClose}>내용</Modal>);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성', () => {
    it('dialog 역할을 가진다', () => {
      render(<Modal isOpen={true} onClose={() => {}}>내용</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal="true"를 가진다', () => {
      render(<Modal isOpen={true} onClose={() => {}}>내용</Modal>);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('title이 있으면 aria-labelledby로 연결된다', () => {
      render(<Modal isOpen={true} onClose={() => {}} title="테스트 제목">내용</Modal>);
      const dialog = screen.getByRole('dialog');
      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(document.getElementById(labelId)).toHaveTextContent('테스트 제목');
    });
  });

  describe('body 스크롤', () => {
    it('열릴 때 body overflow를 hidden으로 설정한다', () => {
      render(<Modal isOpen={true} onClose={() => {}}>내용</Modal>);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('닫힐 때 body overflow를 복원한다', () => {
      const { rerender } = render(<Modal isOpen={true} onClose={() => {}}>내용</Modal>);
      rerender(<Modal isOpen={false} onClose={() => {}}>내용</Modal>);
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });
});
