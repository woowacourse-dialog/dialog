import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import dialogIcon from '../../assets/favicon_navy.ico'
import githubLogo from '../../assets/github-mark-white.svg';
import './Header.css';

const API_URL = import.meta.env.VITE_API_URL;
const GITHUB_AUTH_URL = import.meta.env.VITE_GITHUB_AUTH_URL;

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

const Header = () => {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleGithubLogin = () => {
    window.location.href = GITHUB_AUTH_URL;
  };

  const handleMyPage = () => {
    navigate('/mypage');
  };

  const handleMyDiscussions = () => {
    navigate('/discussion/my');
  };

  const handleLogout = async () => {
    try {
      const response = await api.delete('/api/logout');
      if (response.status === 200) {
        setIsLoggedIn(false);
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">
            <img src={dialogIcon} alt="Dialog Icon" className="header-icon" />
            <span>Dialog</span>
          </Link>
        </div>
        <div className="header-nav">
          {isLoggedIn ? (
            <div className="nav-buttons">
              {/* <button className="nav-button my-discussions-button" onClick={handleMyDiscussions}>
                내 토론
              </button> */}
              <button className="nav-button mypage-button" onClick={handleMyPage}>
                My Page
              </button>
              <button className="nav-button logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="nav-button login-button" onClick={handleGithubLogin}>
              <img src={githubLogo} alt="github" width={18} height={18} />
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
