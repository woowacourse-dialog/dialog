import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/ui/Button/Button';
import Card from '../../../components/ui/Card/Card';
import { generateShareText, generateShareHtml } from '../../../utils/shareMessage';
import { copyRichText } from '../../../utils/clipboard';
import slackLogo from '../../../assets/slack-logo.svg';
import discordLogo from '../../../assets/discord-logo.svg';
import styles from './DiscussionCreateCompletePage.module.css';

const SLACK_URL = import.meta.env.VITE_SLACK_CHANNEL_URL || 'https://app.slack.com/client';
const DISCORD_URL = import.meta.env.VITE_DISCORD_CHANNEL_URL || 'https://discord.com/channels';

const trackEmojis = {
  '백엔드': '⚙️',
  '프론트엔드': '🎨',
  '안드로이드': '📱',
  '공통': '🔄',
};

const DiscussionCreateCompletePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const { title = '', content = '', trackName = '공통' } = state || {};

  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [activePlatform, setActivePlatform] = useState(null);
  const [hasOpenedSlack, setHasOpenedSlack] = useState(false);
  const [hasOpenedDiscord, setHasOpenedDiscord] = useState(false);
  const timerRef = useRef(null);

  const discussionUrl = useMemo(
    () => `${window.location.origin}/discussion/${id}`,
    [id],
  );

  const truncatedContent = useMemo(() => {
    if (!content) return '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }, [content]);

  const emojiForTrack = useMemo(
    () => trackEmojis[trackName || '공통'] || '💬',
    [trackName],
  );

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const openPlatform = (platform) => {
    const url = platform === 'slack' ? SLACK_URL : DISCORD_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (platform === 'slack') setHasOpenedSlack(true);
    else setHasOpenedDiscord(true);
  };

  const handleShare = async (platform) => {
    const hasOpened = platform === 'slack' ? hasOpenedSlack : hasOpenedDiscord;

    if (hasOpened) {
      openPlatform(platform);
      return;
    }

    if (activePlatform) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCountdown(null);
      setActivePlatform(null);
      openPlatform(platform);
      return;
    }

    try {
      const shareArgs = {
        track: trackName || '공통',
        title: title || `토론 #${id}`,
        content: content || '',
        link: discussionUrl,
      };
      const html = generateShareHtml(shareArgs);
      const plain = generateShareText(shareArgs);
      await copyRichText(html, plain);

      setCopied(true);
      setActivePlatform(platform);
      setCountdown(3);
      let current = 3;
      timerRef.current = setInterval(() => {
        current -= 1;
        setCountdown(current);
        if (current === 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          openPlatform(platform);
          setActivePlatform(null);
        }
      }, 1000);
    } catch {
      alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  const slackLabel = activePlatform === 'slack' && countdown !== null
    ? `${countdown}초 뒤 슬랙으로 이동합니다.`
    : hasOpenedSlack ? '슬랙 다시 열기' : '슬랙으로 공유하기';

  const discordLabel = activePlatform === 'discord' && countdown !== null
    ? `${countdown}초 뒤 디스코드로 이동합니다.`
    : hasOpenedDiscord ? '디스코드 다시 열기' : '프리코스로 공유하기';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>작성 완료</h1>
        <p className={styles.subtitle}>이제 크루들과 공유해보세요.</p>

        {/* 공유 미리보기 카드 */}
        <Card className={styles.previewCard}>
          <div className={styles.previewHeader}>
            [{emojiForTrack} {trackName || '공통'}] 새로운 토론이 시작되었습니다!
          </div>
          <div className={styles.previewRow}>📝 <strong>제목:</strong> {title || `토론 #${id}`}</div>
          <div className={styles.previewRow}>💭 <strong>내용:</strong> {truncatedContent}</div>
          <div className={styles.previewRow}>🔗 <strong>링크:</strong> <a href={discussionUrl}>{discussionUrl}</a></div>
        </Card>

        {/* 공유 버튼 */}
        <div className={styles.actions}>
          <Button onClick={() => handleShare('slack')} className={styles.slackBtn}>
            <img src={slackLogo} alt="Slack" width={18} height={18} /> {slackLabel}
          </Button>
          <Button onClick={() => handleShare('discord')} className={styles.discordBtn}>
            <img src={discordLogo} alt="Discord" width={18} height={18} /> {discordLabel}
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/discussion/${id}`)}>
            게시글로 이동
          </Button>
        </div>

        {/* 토스트 */}
        {copied && <div className={styles.toast}>클립보드에 복사되었습니다</div>}
      </div>
    </div>
  );
};

export default DiscussionCreateCompletePage;
