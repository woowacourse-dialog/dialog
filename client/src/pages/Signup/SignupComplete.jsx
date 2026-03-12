import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import channelJoinImage from '../../assets/channel-join-image.png';
import slackLogo from '../../assets/slack-logo.svg';
import styles from './SignupComplete.module.css';

const SLACK_CHANNEL_URL = import.meta.env.VITE_SLACK_CHANNEL_URL || 'https://app.slack.com/client';

const SignupComplete = () => {
  const navigate = useNavigate();
  const { checkLoginStatus } = useAuth();

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  const openSlack = () => {
    window.open(SLACK_CHANNEL_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>회원가입이 완료되었습니다</h1>
        <p className={styles.subtitle}>
          토론 소식을 가장 빠르게 받으려면 아래 채널에 참여해주세요. 새로운 토론이 올라오면 공유해 드려요.
        </p>

        <div className={styles.slackCard}>
          <img
            src={channelJoinImage}
            alt="채널 참여 안내"
            className={styles.channelImage}
          />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>&quot;동동-토론&quot; 채널에 참여하기</h2>
            <p className={styles.cardDescription}>
              토론 글 알림을 받으려면 채널에 참여해주세요. 작성자는 토론 생성 후, 완료 페이지에서 슬랙으로 쉽게 공유할 수 있어요.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={openSlack}
                className={styles.slackButton}
              >
                <img src={slackLogo} alt="Slack" className={styles.slackLogo} />
                슬랙 채널 참여하기
              </button>
              <button
                type="button"
                onClick={() => navigate('/discussion')}
                className={styles.browseButton}
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
