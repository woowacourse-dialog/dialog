import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Signup from './Signup';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from '../../api/axios';

describe('Signup', () => {
  const renderSignup = () => render(
    <MemoryRouter><Signup /></MemoryRouter>
  );

  beforeEach(() => { vi.clearAllMocks(); });

  it('트랙 선택 드롭다운을 렌더링한다', () => {
    renderSignup();
    expect(screen.getByLabelText(/트랙/)).toBeInTheDocument();
  });

  it('트랙 미선택 시 에러를 표시한다', async () => {
    renderSignup();
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByText('트랙을 선택해주세요')).toBeInTheDocument();
  });

  it('웹 푸시 알림 체크박스를 렌더링한다', () => {
    renderSignup();
    expect(screen.getByLabelText(/웹 푸시 알림/)).toBeInTheDocument();
  });

  it('정보 아이콘 hover 시 툴팁을 표시한다', async () => {
    renderSignup();
    const infoIcon = screen.getByTestId('notification-info-icon');
    await userEvent.hover(infoIcon);
    expect(screen.getByText(/크루들이 토론을 올리면 알림/)).toBeInTheDocument();
  });

  it('회원가입 제출 시 POST /api/signup을 호출한다', async () => {
    api.post.mockResolvedValue({ data: {} });
    renderSignup();
    // Use native select since it's a <select> element
    await userEvent.selectOptions(screen.getByLabelText(/트랙/), 'BACKEND');
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/signup',
        expect.objectContaining({ track: 'BACKEND' }),
        expect.any(Object)
      );
    });
  });

  it('성공 시 /로 이동한다 (ENABLE_SLACK_GUIDE_PAGE=false)', async () => {
    api.post.mockResolvedValue({ data: {} });
    renderSignup();
    await userEvent.selectOptions(screen.getByLabelText(/트랙/), 'FRONTEND');
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('제출 중 버튼이 "처리중..."이고 disabled이다', async () => {
    api.post.mockReturnValue(new Promise(() => {}));
    renderSignup();
    await userEvent.selectOptions(screen.getByLabelText(/트랙/), 'ANDROID');
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByText('처리중...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '처리중...' })).toBeDisabled();
  });

  it('API 에러 시 alert을 표시한다', async () => {
    api.post.mockRejectedValue(new Error('Server Error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderSignup();
    await userEvent.selectOptions(screen.getByLabelText(/트랙/), 'BACKEND');
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('회원가입 중 오류가 발생했습니다.');
    });
    alertSpy.mockRestore();
  });
});
