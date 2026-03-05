/**
 * 날짜/시간 관련 유틸리티 함수들
 */

/**
 * UTC 시간을 한국 시간대로 변환하고 포맷팅합니다.
 * @param {string|Date} dateTimeStr - UTC 시간 문자열 또는 Date 객체
 * @param {Object} options - Intl.DateTimeFormat 옵션
 * @returns {string} 한국 시간대로 포맷팅된 문자열
 */
export const formatToKST = (dateTimeStr, options = {}) => {
  const date = new Date(dateTimeStr);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return new Intl.DateTimeFormat('ko-KR', mergedOptions).format(date);
};

/**
 * 댓글용 날짜 포맷팅 (간단한 형태)
 * @param {string|Date} dateTimeStr - UTC 시간 문자열 또는 Date 객체
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatCommentDate = (dateTimeStr) => {
  return formatToKST(dateTimeStr, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * 토론 상세 페이지용 날짜 포맷팅 (상세한 형태)
 * @param {string|Date} dateTimeStr - UTC 시간 문자열 또는 Date 객체
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDiscussionDate = (dateTimeStr) => {
  return formatToKST(dateTimeStr, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * 시간만 포맷팅 (시:분 형태)
 * @param {string|Date} dateTimeStr - UTC 시간 문자열 또는 Date 객체
 * @returns {string} 포맷팅된 시간 문자열
 */
export const formatTimeOnly = (dateTimeStr) => {
  return formatToKST(dateTimeStr, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * 현재 한국 시간을 반환합니다.
 * @returns {Date} 한국 시간대의 현재 시간
 */
export const getCurrentKST = () => {
  // 브라우저의 현재 시간을 사용 (이미 사용자의 로컬 시간대)
  return new Date();
};

export function formatDateTime(date, time) {
  const dt = new Date(`${date}T${time}`);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}
