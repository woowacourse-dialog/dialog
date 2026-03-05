import { render, screen, act } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import Tooltip from './Tooltip';

describe('Tooltip', () => {
  describe('기본 렌더링', () => {
    it('children(트리거)을 렌더링한다', () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      expect(screen.getByText('트리거')).toBeInTheDocument();
    });

    it('기본 상태에서 툴팁 텍스트가 보이지 않는다', () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('표시/숨김', () => {
    it('트리거에 마우스를 올리면 툴팁이 표시된다', async () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('도움말')).toBeInTheDocument();
    });

    it('트리거에서 마우스를 내리면 툴팁이 숨겨진다', async () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      await userEvent.unhover(screen.getByText('트리거'));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('트리거에 포커스하면 툴팁이 표시된다', () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      act(() => {
        screen.getByText('트리거').focus();
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('트리거에서 블러하면 툴팁이 숨겨진다', () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      act(() => {
        screen.getByText('트리거').focus();
      });
      act(() => {
        screen.getByText('트리거').blur();
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('위치', () => {
    it('position="top" -- top 클래스 (기본)', async () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      expect(screen.getByRole('tooltip')).toHaveClass('top');
    });

    it('position="bottom" -- bottom 클래스', async () => {
      render(<Tooltip content="도움말" position="bottom"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      expect(screen.getByRole('tooltip')).toHaveClass('bottom');
    });

    it('position="left" -- left 클래스', async () => {
      render(<Tooltip content="도움말" position="left"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      expect(screen.getByRole('tooltip')).toHaveClass('left');
    });

    it('position="right" -- right 클래스', async () => {
      render(<Tooltip content="도움말" position="right"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      expect(screen.getByRole('tooltip')).toHaveClass('right');
    });
  });

  describe('접근성', () => {
    it('tooltip 역할을 가진다', async () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('트리거에 aria-describedby가 설정된다', async () => {
      render(<Tooltip content="도움말"><button>트리거</button></Tooltip>);
      await userEvent.hover(screen.getByText('트리거'));
      const trigger = screen.getByText('트리거').closest('[aria-describedby]');
      expect(trigger).toBeTruthy();
      const tooltipId = trigger.getAttribute('aria-describedby');
      expect(document.getElementById(tooltipId)).toHaveTextContent('도움말');
    });
  });
});
