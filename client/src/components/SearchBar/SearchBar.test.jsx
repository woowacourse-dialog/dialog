import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/render';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  describe('검색 타입 선택', () => {
    it('기본으로 "제목+내용" 검색 타입이 선택되어 있다', () => {
      render(<SearchBar onSearch={vi.fn()} />);
      expect(screen.getByText('제목+내용')).toBeInTheDocument();
    });

    it('검색 타입 클릭 시 드롭다운이 열린다', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={vi.fn()} />);
      await user.click(screen.getByText('제목+내용'));
      expect(screen.getByText('작성자')).toBeInTheDocument();
    });

    it('"작성자" 타입을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={vi.fn()} />);
      await user.click(screen.getByText('제목+내용'));
      await user.click(screen.getByText('작성자'));
      expect(screen.getByText('작성자')).toBeInTheDocument();
    });
  });

  describe('텍스트 입력', () => {
    it('검색어를 입력할 수 있다', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={vi.fn()} />);
      const input = screen.getByPlaceholderText('검색어를 입력하세요...');
      await user.type(input, 'React');
      expect(input).toHaveValue('React');
    });

    it('initialQuery가 있으면 미리 채워진다', () => {
      render(<SearchBar onSearch={vi.fn()} initialQuery="Spring" />);
      expect(screen.getByDisplayValue('Spring')).toBeInTheDocument();
    });

    it('initialType이 있으면 해당 타입이 선택된다', () => {
      render(<SearchBar onSearch={vi.fn()} initialType={1} />);
      expect(screen.getByText('작성자')).toBeInTheDocument();
    });
  });

  describe('검색 실행', () => {
    it('Enter 키 누르면 onSearch를 호출한다', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);
      const input = screen.getByPlaceholderText('검색어를 입력하세요...');
      await user.type(input, 'React{enter}');
      expect(onSearch).toHaveBeenCalledWith({ searchType: 0, query: 'React' });
    });

    it('검색 버튼 클릭 시 onSearch를 호출한다', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);
      await user.type(screen.getByPlaceholderText('검색어를 입력하세요...'), 'React');
      await user.click(screen.getByLabelText('검색'));
      expect(onSearch).toHaveBeenCalledWith({ searchType: 0, query: 'React' });
    });

    it('빈 검색어로는 검색하지 않는다', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);
      await user.click(screen.getByLabelText('검색'));
      expect(onSearch).not.toHaveBeenCalled();
    });

    it('공백만 있는 검색어로는 검색하지 않는다', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);
      await user.type(screen.getByPlaceholderText('검색어를 입력하세요...'), '   ');
      await user.click(screen.getByLabelText('검색'));
      expect(onSearch).not.toHaveBeenCalled();
    });
  });
});
