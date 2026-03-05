/**
 * 공통 API mock 유틸리티
 * vi.fn() 기반 mock 패턴
 */

// ----- 응답 팩토리 -----

export const createSuccessResponse = (data) => ({
  data: { data },
});

export const createErrorResponse = (status, message) => {
  const error = new Error(message);
  error.response = { status, data: { message } };
  return error;
};

export const createPaginatedResponse = (items, hasNext = false, nextCursor = null) => ({
  data: {
    data: {
      content: items,
      hasNext,
      nextCursor,
    },
  },
});

// ----- Mock 데이터 -----

export const mockUser = {
  id: 1,
  nickname: '테스트유저',
  category: 'BACKEND',
  githubId: 'test-user',
  profileImage: null,
  notificationEnabled: true,
};

export const mockOnlineDiscussion = {
  id: 1,
  discussionType: 'ONLINE',
  commonDiscussionInfo: {
    title: '테스트 토론',
    content: '토론 본문 내용',
    author: '테스트유저',
    authorId: 1,
    category: 'BACKEND',
    profileImage: null,
    commentCount: 5,
    likeCount: 3,
    summary: null,
    createdAt: '2026-03-01T10:00:00',
  },
  onlineDiscussionInfo: {
    endDate: '2026-04-01',
  },
  offlineDiscussionInfo: null,
};

export const mockOfflineDiscussion = {
  id: 2,
  discussionType: 'OFFLINE',
  commonDiscussionInfo: {
    title: '오프라인 토론',
    content: '오프라인 토론 본문',
    author: '테스트유저2',
    authorId: 2,
    category: 'FRONTEND',
    profileImage: null,
    commentCount: 3,
    likeCount: 1,
    summary: null,
    createdAt: '2026-03-01T10:00:00',
  },
  onlineDiscussionInfo: null,
  offlineDiscussionInfo: {
    place: '강남역 카페',
    startAt: '2026-04-01T14:00:00',
    endAt: '2026-04-01T16:00:00',
    participantCount: 3,
    maxParticipantCount: 6,
  },
};

export const mockComment = {
  id: 1,
  content: '테스트 댓글입니다.',
  author: '테스트유저',
  authorId: 1,
  profileImage: null,
  createdAt: '2026-03-01T10:00:00',
  modifiedAt: '2026-03-01T10:00:00',
  childComments: [],
};

export const mockNotification = {
  id: 1,
  message: '새 댓글이 달렸습니다.',
  isRead: false,
  createdAt: '2026-03-01T10:00:00',
  routeParams: {
    type: 'DISCUSSION_COMMENT',
    discussionId: 1,
    discussionCommentId: 1,
    replyId: null,
  },
};

// ----- AuthContext 값 팩토리 -----

export const createLoggedInAuth = (overrides = {}) => ({
  isLoggedIn: true,
  currentUser: mockUser,
  authLoading: false,
  checkLoginStatus: () => {},
  logout: () => {},
  ...overrides,
});

export const createLoggedOutAuth = () => ({
  isLoggedIn: false,
  currentUser: null,
  authLoading: false,
  checkLoginStatus: () => {},
  logout: () => {},
});
