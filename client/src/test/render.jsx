import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const defaultAuthValue = {
  isLoggedIn: false,
  currentUser: null,
  authLoading: false,
  checkLoginStatus: () => {},
  logout: () => {},
};

export function renderWithProviders(
  ui,
  {
    authValue = defaultAuthValue,
    route = '/',
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={authValue}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthContext.Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// re-export 모든 @testing-library/react 유틸
export * from '@testing-library/react';
// renderWithProviders를 기본 render로 사용
export { renderWithProviders as render };
