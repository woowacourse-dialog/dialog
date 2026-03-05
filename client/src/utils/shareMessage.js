const trackEmojis = {
  '백엔드': '⚙️',
  '프론트엔드': '🎨',
  '안드로이드': '📱',
  '공통': '🔄',
};

const escape = (str) =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const truncate = (str, max = 100) =>
  str && str.length > max ? str.substring(0, max) + '...' : (str || '');

export function generateShareText({ track, title, content, link }) {
  const emoji = trackEmojis[track] || '💬';
  return [
    `*[${emoji} ${track}] 새로운 토론이 시작되었습니다!*`,
    '',
    `📝 *제목:* ${title}`,
    '',
    `💭 *내용:* ${truncate(content)}`,
    '',
    `🔗 *링크:* ${link}`,
  ].join('\n');
}

export function generateShareHtml({ track, title, content, link }) {
  const emoji = trackEmojis[track] || '💬';
  return [
    '<div>',
    `<div><strong>[${emoji} ${track}] 새로운 토론이 시작되었습니다!</strong></div>`,
    `<div style="margin-top:6px">📝 <strong>제목:</strong> ${escape(title)}</div>`,
    `<div style="margin-top:6px">💭 <strong>내용:</strong> ${escape(truncate(content))}</div>`,
    `<div style="margin-top:6px">🔗 <strong>링크:</strong> <a href="${escape(link)}">${escape(link)}</a></div>`,
    '</div>',
  ].join('');
}
