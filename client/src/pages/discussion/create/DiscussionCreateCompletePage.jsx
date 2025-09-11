import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../../../components/Header/Header';

const SLACK_CHANNEL_URL = import.meta.env.VITE_SLACK_CHANNEL_URL || 'https://app.slack.com/client';

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
      `<div style="margin-top:6px"><span>📝</span> <strong>제목:</strong> ${escapedTitle}</div>` +
      `<div style="margin-top:6px"><span>💭</span> <strong>내용:</strong> ${escapedContent}</div>` +
      `<div style="margin-top:6px"><span>🔗</span> <strong>링크:</strong> <a href="${escapedLink}">${escapedLink}</a></div>` +
    `</div>`
  );
};

const SlackIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 122.8 122.8" aria-hidden="true" focusable="false">
    <path fill="#36C5F0" d="M27.5 77.1c0 7.6-6.2 13.8-13.8 13.8S0 84.7 0 77.1s6.2-13.8 13.8-13.8h13.7v13.8zm6.9 0c0-7.6 6.2-13.8 13.8-13.8s13.8 6.2 13.8 13.8v34.6c0 7.6-6.2 13.8-13.8 13.8s-13.8-6.2-13.8-13.8V77.1z"/>
    <path fill="#2EB67D" d="M45.1 27.5c-7.6 0-13.8-6.2-13.8-13.8S37.5 0 45.1 0s13.8 6.2 13.8 13.8v13.8H45.1zm0 6.9c7.6 0 13.8 6.2 13.8 13.8s-6.2 13.8-13.8 13.8H10.5C2.9 62 0 55.8 0 48.2s6.2-13.8 13.8-13.8h31.3z"/>
    <path fill="#ECB22E" d="M95.3 45.1c0-7.6 6.2-13.8 13.8-13.8s13.8 6.2 13.8 13.8-6.2 13.8-13.8 13.8H95.3V45.1zm-6.9 0c0 7.6-6.2 13.8-13.8 13.8S60.8 52.7 60.8 45.1V10.5C60.8 2.9 67 0 74.6 0s13.8 6.2 13.8 13.8v31.3z"/>
    <path fill="#E01E5A" d="M77.7 95.3c7.6 0 13.8 6.2 13.8 13.8s-6.2 13.8-13.8 13.8-13.8-6.2-13.8-13.8V95.3h13.8zm0-6.9c-7.6 0-13.8-6.2-13.8-13.8s6.2-13.8 13.8-13.8h34.6c7.6 0 13.8 6.2 13.8 13.8s-6.2 13.8-13.8 13.8H77.7z"/>
  </svg>
);

const DiscussionCreateCompletePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const titleFromState = location?.state?.title || '';
  const contentFromState = location?.state?.content || '';
  const trackNameFromState = location?.state?.trackName || '';
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [hasOpenedSlack, setHasOpenedSlack] = useState(false);
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

  const copyToClipboard = async () => {
    try {
      if (hasOpenedSlack) {
        openSlack();
        return;
      }

      if (countdown !== null) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCountdown(0);
        openSlack();
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
          openSlack();
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
              onClick={copyToClipboard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#4A154B',
                borderColor: '#4A154B',
                color: '#ffffff'
              }}
            >
              <SlackIcon />
              {countdown !== null && !hasOpenedSlack ? `슬랙으로 공유하기 (${countdown})` : '슬랙으로 공유하기'}
            </button>
            <button type="button" className="discussion-button discussion-button-cancel" onClick={() => navigate(`/discussion/${id}`)}>
              게시글로 이동
            </button>
          </div>
          {countdown !== null && !hasOpenedSlack && (
            <div style={{ marginTop: 8, color: '#6b7280' }}>{countdown}초 뒤 Slack이 새 창으로 열립니다</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionCreateCompletePage;
