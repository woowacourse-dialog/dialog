/**
 * 토론 상태를 판단하는 유틸리티 함수들
 */

import { getCurrentKST } from './dateUtils';

/**
 * 온라인 토론의 상태를 판단합니다.
 * 종료일 당일은 "토론 중", 종료일 다음 날부터는 "토론 완료"
 * @param {Object} onlineDiscussionInfo - 온라인 토론 정보
 * @returns {string} '토론 중' 또는 '토론 완료'
 */
export const getOnlineDiscussionStatus = (onlineDiscussionInfo) => {
  if (!onlineDiscussionInfo?.endDate) return '토론 중';
  
  const now = getCurrentKST();
  const end = new Date(onlineDiscussionInfo.endDate);
  // 종료일 다음 날부터 토론 완료 (종료일 당일은 아직 토론 중)
  const tomorrow = new Date(end);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return now >= tomorrow ? '토론 완료' : '토론 중';
};

/**
 * 오프라인 토론의 상태를 판단합니다.
 * @param {Object} offlineDiscussionInfo - 오프라인 토론 정보
 * @returns {string} 토론 상태
 */
export const getOfflineDiscussionStatus = (offlineDiscussionInfo) => {
  if (!offlineDiscussionInfo) return '토론 중';
  
  const now = getCurrentKST();
  const start = new Date(offlineDiscussionInfo.startAt);
  const end = new Date(offlineDiscussionInfo.endAt);

  if (now < start) {
    if (offlineDiscussionInfo.participantCount >= offlineDiscussionInfo.maxParticipantCount) {
      return '모집 완료';
    }
    return '모집 중';
  } else if (now >= start && now <= end) {
    return '토론 중';
  } else {
    return '토론 완료';
  }
};

/**
 * 토론의 상태를 판단합니다.
 * @param {Object} discussion - 토론 객체
 * @returns {string} 토론 상태
 */
export const getDiscussionStatus = (discussion) => {
  if (!discussion) return '토론 중';
  
  if (discussion.discussionType === 'ONLINE') {
    return getOnlineDiscussionStatus(discussion.onlineDiscussionInfo);
  } else {
    return getOfflineDiscussionStatus(discussion.offlineDiscussionInfo);
  }
};

/**
 * 토론 상태에 따른 스타일을 반환합니다.
 * @param {string} status - 토론 상태
 * @returns {Object} 스타일 객체
 */
export const getDiscussionStatusStyle = (status) => {
  const statusStyles = {
    '모집 중': { background: '#ff9800', color: '#fff' },
    '모집 완료': { background: '#f44336', color: '#fff' },
    '토론 중': { background: '#42a5f5', color: '#fff' },
    '토론 완료': { background: '#bdbdbd', color: '#fff' }
  };
  
  return statusStyles[status] || statusStyles['토론 중'];
};

/**
 * 토론 상태와 라벨을 반환합니다.
 * @param {Object} discussion - 토론 객체
 * @returns {Object} { status, label }
 */
export const getDiscussionStatusWithLabel = (discussion) => {
  const status = getDiscussionStatus(discussion);
  return { status, label: status };
};

