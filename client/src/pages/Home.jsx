import React from 'react';
import Header from '../components/Header/Header';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NotificationGuideModal from '../components/NotificationGuideModal/NotificationGuideModal';

const Home = () => {
  const { isLoggedIn } = useAuth();
  const { showGuideModal, setShowGuideModal } = useNotification(isLoggedIn);

  const homeContainerStyle = {
    paddingTop: '282px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  return (
    <div className="home">
      <Header />
      <div style={homeContainerStyle}>
        <h1>Welcome to Home</h1>
        <p>This is the home page of our application.</p>
      </div>
      {showGuideModal && (
        <NotificationGuideModal
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </div>
  );
};

export default Home; 