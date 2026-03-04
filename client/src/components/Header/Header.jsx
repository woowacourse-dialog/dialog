import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dialogIcon from '../../assets/favicon_navy.ico'
import githubLogo from '../../assets/github-mark-white.svg';
import useNotificationPolling from '../../hooks/useNotificationPolling';
import NotificationDropdown from '../Notification/NotificationDropdown';

const GITHUB_AUTH_URL = import.meta.env.VITE_GITHUB_AUTH_URL;

const Header = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, notifications, markAsRead, markAllAsRead, loadMore, hasMore, isLoading } = useNotificationPolling(isLoggedIn);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleGithubLogin = () => {
    window.location.href = GITHUB_AUTH_URL;
  };

  const handleMyPage = () => {
    navigate('/mypage');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
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
              <div className="notification-wrapper">
                <button
                  className="notification-container"
                  onClick={toggleNotifications}
                >
                  <svg
                    className="notification-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationDropdown
                    notifications={notifications}
                    onRead={markAsRead}
                    onReadAll={markAllAsRead}
                    onClose={() => setShowNotifications(false)}
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                    isLoading={isLoading}
                  />
                )}
              </div>
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
              <span className="login-text-full">Sign in with GitHub</span>
              <span className="login-text-short">Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
