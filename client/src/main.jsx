import './styles/tokens.css'
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// data-color-mode 속성 설정 (향후 다크 모드 확장 대비)
document.documentElement.setAttribute('data-color-mode', 'light');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
