import { render, screen, fireEvent } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import MoreMenu from './MoreMenu';

describe('MoreMenu', () => {
  const createItems = () => [
    { label: '수정하기', onClick: vi.fn() },
    { label: '삭제하기', onClick: vi.fn(), variant: 'danger' },
  ];

  describe('기본 렌더링', () => {
    it('트리거 버튼을 렌더링한다', () => {
      render(<MoreMenu items={createItems()} />);
      expect(screen.getByLabelText('더보기 메뉴')).toBeInTheDocument();
    });
    it('초기 상태에서 메뉴가 보이지 않는다', () => {
      render(<MoreMenu items={createItems()} />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('메뉴 열기/닫기', () => {
    it('트리거 클릭 시 메뉴를 표시한다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('메뉴가 열린 상태에서 트리거 클릭 시 메뉴를 닫는다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('외부 클릭 시 메뉴를 닫는다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('ESC 키 누르면 메뉴를 닫는다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('메뉴 항목', () => {
    it('items의 각 항목을 렌더링한다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(screen.getByText('수정하기')).toBeInTheDocument();
      expect(screen.getByText('삭제하기')).toBeInTheDocument();
    });

    it('항목 클릭 시 해당 onClick을 호출한다', async () => {
      const items = createItems();
      render(<MoreMenu items={items} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      await userEvent.click(screen.getByText('수정하기'));
      expect(items[0].onClick).toHaveBeenCalledTimes(1);
    });

    it('항목 클릭 시 메뉴를 닫는다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      await userEvent.click(screen.getByText('수정하기'));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('variant="danger" 항목에 danger 클래스를 적용한다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(screen.getByText('삭제하기').closest('button')).toHaveClass('danger');
    });
  });

  describe('비활성 항목', () => {
    it('disabled 항목은 클릭해도 onClick이 호출되지 않는다', async () => {
      const items = [{ label: '비활성', onClick: vi.fn(), disabled: true }];
      render(<MoreMenu items={items} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      await userEvent.click(screen.getByText('비활성'));
      expect(items[0].onClick).not.toHaveBeenCalled();
    });

    it('disabled 항목에 disabled 클래스를 적용한다', async () => {
      const items = [{ label: '비활성', onClick: vi.fn(), disabled: true }];
      render(<MoreMenu items={items} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(screen.getByText('비활성').closest('button')).toHaveClass('disabled');
    });
  });

  describe('이벤트 전파', () => {
    it('트리거 클릭 시 이벤트 전파를 중단한다', async () => {
      const parentClick = vi.fn();
      render(
        <div onClick={parentClick}>
          <MoreMenu items={createItems()} />
        </div>
      );
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(parentClick).not.toHaveBeenCalled();
    });

    it('메뉴 항목 클릭 시 이벤트 전파를 중단한다', async () => {
      const parentClick = vi.fn();
      render(
        <div onClick={parentClick}>
          <MoreMenu items={createItems()} />
        </div>
      );
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      await userEvent.click(screen.getByText('수정하기'));
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('위치', () => {
    it('기본 위치는 right이다', async () => {
      render(<MoreMenu items={createItems()} />);
      await userEvent.click(screen.getByLabelText('더보기 메뉴'));
      expect(screen.getByRole('menu')).toHaveClass('right');
    });
  });
});
