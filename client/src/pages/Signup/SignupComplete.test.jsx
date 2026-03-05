import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignupComplete from './SignupComplete';

const mockCheckLoginStatus = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    checkLoginStatus: mockCheckLoginStatus,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('SignupComplete', () => {
  const renderPage = () => render(
    <MemoryRouter><SignupComplete /></MemoryRouter>
  );

  beforeEach(() => { vi.clearAllMocks(); });

  it('완료 안내 텍스트를 렌더링한다', () => {
    renderPage();
    expect(screen.getByText('회원가입이 완료되었습니다')).toBeInTheDocument();
  });

  it('"게시글 보러가기" 클릭 시 /discussion으로 이동한다', async () => {
    renderPage();
    await userEvent.click(screen.getByText('게시글 보러가기'));
    expect(mockNavigate).toHaveBeenCalledWith('/discussion');
  });

  it('마운트 시 checkLoginStatus를 호출한다', () => {
    renderPage();
    expect(mockCheckLoginStatus).toHaveBeenCalled();
  });
});
