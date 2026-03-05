import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Github } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import useNotificationPolling from '../../../hooks/useNotificationPolling';
import Avatar from '../../ui/Avatar/Avatar';
import NotificationDropdown from '../../Notification/NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import dialogLogo from '../../../assets/background_removed_logo.png';
import styles from './Header.module.css';

const GITHUB_AUTH_URL = import.meta.env.VITE_GITHUB_AUTH_URL;

const Header = () => {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const {
    unreadCount, notifications, markAsRead,
    markAllAsRead, loadMore, hasMore, isLoading,
  } = useNotificationPolling(isLoggedIn);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    setShowProfile(false);
    await logout();
    navigate('/');
  };

  const handleProfileNavigate = (path) => {
    setShowProfile(false);
    navigate(path);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Left: Logo */}
        <Link to="/" className={styles.logo}>
          <img src={dialogLogo} alt="Dialog Logo" className={styles.logoImage} />
          <span className={styles.logoText}>Dialog</span>
        </Link>

        {/* Right: Auth-dependent content */}
        <div className={styles.right}>
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className={styles.notificationWrapper}>
                <button
                  className={styles.bellButton}
                  onClick={() => setShowNotifications((prev) => !prev)}
                  aria-label="알림"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className={styles.badge} />
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

              {/* User Avatar */}
              <div className={styles.profileWrapper}>
                <button
                  className={styles.avatarButton}
                  onClick={() => setShowProfile((prev) => !prev)}
                  data-testid="user-avatar"
                >
                  <Avatar
                    src={currentUser?.profileImage}
                    name={currentUser?.nickname}
                    size="md"
                  />
                </button>
                {showProfile && (
                  <ProfileDropdown
                    onNavigate={handleProfileNavigate}
                    onLogout={handleLogout}
                    onClose={() => setShowProfile(false)}
                  />
                )}
              </div>
            </>
          ) : (
            <button
              className={styles.githubBtn}
              onClick={() => { window.location.href = GITHUB_AUTH_URL; }}
            >
              <Github size={18} />
              <span className={styles.githubText}>GitHub로 로그인</span>
              <span className={styles.githubTextShort}>로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
