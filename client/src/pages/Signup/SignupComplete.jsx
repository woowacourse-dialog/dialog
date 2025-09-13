import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import channelJoinImage from '../../assets/channel-join-image.png';
import slackLogo from '../../assets/slack-logo.svg';
import { useAuth } from '../../context/AuthContext';

const SLACK_CHANNEL_URL = import.meta.env.VITE_SLACK_CHANNEL_URL || 'https://app.slack.com/client';

const SignupComplete = () => {
  const navigate = useNavigate();
  const { checkLoginStatus } = useAuth();

  useEffect(() => {
    // Refresh auth state so Header shows logout/mypage if logged in
    checkLoginStatus();
  }, [checkLoginStatus]);

  const openSlack = () => {
    window.open(SLACK_CHANNEL_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="signup-wrapper">
      <Header />
      <div className="signup-container" style={{ maxWidth: 840 }}>
        <h1>회원가입이 완료되었습니다</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>
          토론 소식을 가장 빠르게 받으려면 아래 채널에 참여해주세요. 새로운 토론이 올라오면 공유해 드려요.
        </p>

        <div style={{
          marginTop: 24,
          background: '#f7f7f9',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <img src={channelJoinImage} alt="채널 참여 안내" style={{ width: 520, maxWidth: '100%', borderRadius: 8 }} />
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h2 style={{ margin: '8px 0 0 0' }}>&quot;동동-dialog&quot; 채널에 참여하기</h2>
            <p style={{ color: '#6b7280', marginTop: 8, lineHeight: 1.6 }}>
              토론 글 알림을 받으려면 채널에 참여해주세요. 작성자는 토론 생성 후, 완료 페이지에서 슬랙으로 쉽게 공유할 수 있어요.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={openSlack}
                style={{
                  backgroundColor: '#4A154B',
                  border: '1px solid #4A154B',
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <img src={slackLogo} alt="Slack" width={18} height={18} />
                슬랙 채널 참여하기
              </button>
              <button
                type="button"
                onClick={() => navigate('/discussion')}
                style={{
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #e5e7eb',
                  color: '#111827',
                  padding: '12px 16px',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                게시글 보러가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupComplete;


