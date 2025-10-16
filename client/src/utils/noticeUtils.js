/**
 * 공지사항 관련 유틸리티 함수들
 */

/**
 * 공지사항 파일의 메타데이터를 파싱합니다.
 * @param {string} content - 마크다운 파일 내용
 * @returns {Object} { metadata, content }
 */
const parseNoticeMetadata = (content) => {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { metadata: {}, content };
  }
  
  const metadataText = match[1];
  const markdownContent = match[2];
  
  // YAML 파싱 (간단한 버전)
  const metadata = {};
  metadataText.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      metadata[key.trim()] = value;
    }
  });
  
  return { metadata, content: markdownContent };
};

/**
 * 공지사항 파일 목록을 가져옵니다.
 * @returns {Promise<Array>} 공지사항 목록
 */
export const fetchNotices = async () => {
  try {
    // 공지사항 파일 목록 (실제로는 서버에서 목록을 가져와야 함)
    // 여기서는 하드코딩된 파일명들을 사용
    const noticeFiles = [
      '2024-10-16-system-maintenance.md',
      '2024-10-15-new-feature-update.md',
      '2024-10-14-welcome-notice.md'
    ];
    
    const notices = await Promise.all(
      noticeFiles.map(async (filename) => {
        try {
          const response = await fetch(`/notices/${filename}`);
          if (!response.ok) {
            console.warn(`Failed to fetch notice: ${filename}`);
            return null;
          }
          
          const content = await response.text();
          const { metadata, content: markdownContent } = parseNoticeMetadata(content);
          
          return {
            id: filename.replace('.md', ''),
            filename,
            title: metadata.title || '제목 없음',
            date: metadata.date || '2024-01-01',
            priority: metadata.priority || 'low',
            content: markdownContent,
            createdAt: new Date(metadata.date || '2024-01-01')
          };
        } catch (error) {
          console.error(`Error loading notice ${filename}:`, error);
          return null;
        }
      })
    );
    
    // null 값 제거하고 날짜순으로 정렬 (최신순)
    return notices
      .filter(notice => notice !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
      
  } catch (error) {
    console.error('Error fetching notices:', error);
    return [];
  }
};

/**
 * 우선순위별 스타일을 반환합니다.
 * @param {string} priority - 우선순위 ('high', 'medium', 'low')
 * @returns {Object} 스타일 객체
 */
export const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'high':
      return {
        color: '#dc3545',
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        icon: '🔴',
        label: '긴급'
      };
    case 'medium':
      return {
        color: '#ffc107',
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        icon: '🟡',
        label: '중요'
      };
    case 'low':
    default:
      return {
        color: '#28a745',
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
        icon: '🟢',
        label: '일반'
      };
  }
};

/**
 * 읽은 공지사항 목록을 로컬 스토리지에서 가져옵니다.
 * @returns {Array} 읽은 공지사항 ID 목록
 */
export const getReadNotices = () => {
  try {
    const readNotices = localStorage.getItem('readNotices');
    return readNotices ? JSON.parse(readNotices) : [];
  } catch (error) {
    console.error('Error reading read notices:', error);
    return [];
  }
};

/**
 * 공지사항을 읽음 처리합니다.
 * @param {string} noticeId - 공지사항 ID
 */
export const markNoticeAsRead = (noticeId) => {
  try {
    const readNotices = getReadNotices();
    if (!readNotices.includes(noticeId)) {
      readNotices.push(noticeId);
      localStorage.setItem('readNotices', JSON.stringify(readNotices));
    }
  } catch (error) {
    console.error('Error marking notice as read:', error);
  }
};

/**
 * 읽지 않은 공지사항이 있는지 확인합니다.
 * @param {Array} notices - 공지사항 목록
 * @returns {boolean} 읽지 않은 공지사항 존재 여부
 */
export const hasUnreadNotices = (notices) => {
  const readNotices = getReadNotices();
  return notices.some(notice => !readNotices.includes(notice.id));
};
