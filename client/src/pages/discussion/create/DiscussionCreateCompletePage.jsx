import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import slackLogo from '../../../assets/slack-logo.svg';
import discordLogo from '../../../assets/discord-logo.svg';

const SLACK_CHANNEL_URL = import.meta.env.VITE_SLACK_CHANNEL_URL || 'https://app.slack.com/client';
const DISCORD_CHANNEL_URL = import.meta.env.VITE_DISCORD_CHANNEL_URL || 'https://www.naver.com'; // TODO: 실제 디스코드 초대 링크로 변경 필요

const trackEmojis = {
  '백엔드': '⚙️',
  '프론트엔드': '🎨', 
  '안드로이드': '📱',
  '공통': '🔄'
};

const generateShareMessage = (track, title, content, link) => {
  const emoji = trackEmojis[track] || '💬';
  const truncatedContent = content && content.length > 100 
    ? content.substring(0, 100) + '...' 
    : (content || '');
  return `*[${emoji} ${track}] 새로운 토론이 시작되었습니다!*\n\n📝 *제목:* ${title}\n\n💭 *내용:* ${truncatedContent}\n\n🔗 *링크:* ${link}`;
};

const generateShareHtml = (track, title, content, link) => {
  const emoji = trackEmojis[track] || '💬';
  const truncatedContent = content && content.length > 100 
    ? content.substring(0, 100) + '...' 
    : (content || '');
  const escapedTitle = (title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedContent = (truncatedContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedLink = (link || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return (
    `<div>` +
      `<div><strong>[${emoji} ${track}] 새로운 토론이 시작되었습니다!</strong></div>` +
      `<div style=\"margin-top:6px\"><span>📝</span> <strong>제목:</strong> ${escapedTitle}</div>` +
      `<div style=\"margin-top:6px\"><span>💭</span> <strong>내용:</strong> ${escapedContent}</div>` +
      `<div style=\"margin-top:6px\"><span>🔗</span> <strong>링크:</strong> <a href=\"${escapedLink}\">${escapedLink}</a></div>` +
    `</div>`
  );
};

const DiscussionCreateCompletePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const titleFromState = location?.state?.title || '';
  const contentFromState = location?.state?.content || '';
  const trackNameFromState = location?.state?.trackName || '';
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [activeCountdownPlatform, setActiveCountdownPlatform] = useState(null); // 'slack' or 'discord'
  const [hasOpenedSlack, setHasOpenedSlack] = useState(false);
  const [hasOpenedDiscord, setHasOpenedDiscord] = useState(false);
  const timerRef = useRef(null);

  const discussionUrl = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/discussion/${id}`;
  }, [id]);

  const shareText = useMemo(() => {
    return generateShareMessage(
      trackNameFromState || '공통',
      titleFromState || `토론 #${id}`,
      contentFromState || '',
      discussionUrl
    );
  }, [discussionUrl, titleFromState, contentFromState, trackNameFromState, id]);

  const emojiForTrack = useMemo(() => trackEmojis[trackNameFromState || '공통'] || '💬', [trackNameFromState]);
  const truncatedContent = useMemo(() => {
    if (!contentFromState) return '';
    return contentFromState.length > 100 ? contentFromState.substring(0, 100) + '...' : contentFromState;
  }, [contentFromState]);

  const openSlack = () => {
    window.open(SLACK_CHANNEL_URL, '_blank', 'noopener,noreferrer');
    setHasOpenedSlack(true);
  };

  const openDiscord = () => {
    window.open(DISCORD_CHANNEL_URL, '_blank', 'noopener,noreferrer');
    setHasOpenedDiscord(true);
  };

  const handleShare = async (platform) => {
    const openFunc = platform === 'slack' ? openSlack : openDiscord;
    const hasOpened = platform === 'slack' ? hasOpenedSlack : hasOpenedDiscord;

    try {
      if (hasOpened) {
        openFunc();
        return;
      }
      
      if (activeCountdownPlatform) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCountdown(null);
        setActiveCountdownPlatform(null);
        openFunc(); // 즉시 열기
        return;
      }

      const html = generateShareHtml(
        trackNameFromState || '공통',
        titleFromState || `토론 #${id}`,
        contentFromState || '',
        discussionUrl
      );
      const plain = shareText;

      if (navigator.clipboard && window.ClipboardItem) {
        const data = [
          new window.ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' })
          })
        ];
        await navigator.clipboard.write(data);
      } else {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        const range = document.createRange();
        range.selectNodeContents(temp);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
        document.body.removeChild(temp);
      }

      setCopied(true);
      setActiveCountdownPlatform(platform);
      setCountdown(3);
      let current = 3;
      timerRef.current = setInterval(() => {
        current -= 1;
        setCountdown(current);
        if (current === 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          openFunc();
          setActiveCountdownPlatform(null);
        }
      }, 1000);
    } catch (e) {
      alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const buttonLabel = activeCountdownPlatform === 'slack' && countdown !== null
    ? `${countdown}초 뒤 슬랙으로 이동합니다.`
    : hasOpenedSlack
      ? '슬랙 다시 열기'
      : '슬랙으로 공유하기';

  const discordButtonLabel = activeCountdownPlatform === 'discord' && countdown !== null
    ? `${countdown}초 뒤 디스코드로 이동합니다.`
    : hasOpenedDiscord
      ? '디스코드 다시 열기'
      : '프리코스로 공유하기';

  return (
    <div className="discussion-create-page">
      <Header />
      <div className="discussion-create-container">
        <div className="discussion-create-form">
          <h1>작성 완료</h1>
          <p>이제 크루들과 공유해보세요.</p>
          <div style={{
            background: '#f7f7f9',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>[{emojiForTrack} {trackNameFromState || '공통'}] 새로운 토론이 시작되었습니다!</div>
            <div style={{ marginBottom: 8 }}>
              <span role="img" aria-label="memo">📝</span>
              <span style={{ fontWeight: 700, marginLeft: 8 }}>제목:</span>
              <span style={{ marginLeft: 6 }}>{titleFromState || `토론 #${id}`}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span role="img" aria-label="thought">💭</span>
              <span style={{ fontWeight: 700, marginLeft: 8 }}>내용:</span>
              <span style={{ marginLeft: 6 }}>{truncatedContent}</span>
            </div>
            <div>
              <span role="img" aria-label="link">🔗</span>
              <span style={{ fontWeight: 700, marginLeft: 8 }}>링크:</span>
              <a href={discussionUrl} style={{ marginLeft: 6, color: '#1D4ED8', textDecoration: 'none' }}>{discussionUrl}</a>
            </div>
          </div>
          <div className="discussion-form-actions" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="discussion-button discussion-button-submit"
              onClick={() => handleShare('slack')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#4A154B',
                borderColor: '#4A154B',
                color: '#ffffff'
              }}
            >
              <img src={slackLogo} alt="Slack" width={18} height={18} />
              {buttonLabel}
            </button>
            <button
              type="button"
              className="discussion-button discussion-button-submit"
              onClick={() => handleShare('discord')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#5865F2',
                borderColor: '#5865F2',
                color: '#ffffff'
              }}
            >
              <img src={discordLogo} alt="Discord" width={18} height={18} />
              {discordButtonLabel}
            </button>
            <button type="button" className="discussion-button discussion-button-cancel" onClick={() => navigate(`/discussion/${id}`)}>
              게시글로 이동
            </button>
          </div>
          {copied && (
            <div style={{ marginTop: 8, color: '#10B981' }}>클립보드에 복사되었습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionCreateCompletePage;
