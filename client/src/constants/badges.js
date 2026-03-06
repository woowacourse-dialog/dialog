export const STATUS_LABELS = {
  active: '토론 중',
  completed: '토론 완료',
  recruiting: '모집 중',
  recruitComplete: '모집 완료',
};

export const TRACK_LABELS = {
  BACKEND: 'BE', FRONTEND: 'FE', ANDROID: 'AN', COMMON: 'ALL',
};

export const TYPE_LABELS = { online: '온라인', offline: '오프라인' };

export const TYPE_CLASS_MAP = {
  status: { active: 'statusActive', completed: 'statusCompleted', recruiting: 'statusRecruiting', recruitComplete: 'statusRecruitComplete' },
  track: { BACKEND: 'trackBe', FRONTEND: 'trackFe', ANDROID: 'trackAn', COMMON: 'trackCommon' },
  discussionType: { online: 'typeOnline', offline: 'typeOffline' },
};

export const LABEL_MAP = { status: STATUS_LABELS, track: TRACK_LABELS, discussionType: TYPE_LABELS };
