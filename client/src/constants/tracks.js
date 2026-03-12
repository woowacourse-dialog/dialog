export const TRACKS = [
  { id: 'COMMON', name: '공통', shortName: 'ALL' },
  { id: 'FRONTEND', name: '프론트엔드', shortName: 'FE' },
  { id: 'BACKEND', name: '백엔드', shortName: 'BE' },
  { id: 'ANDROID', name: '안드로이드', shortName: 'AN' },
];

export const FORM_TRACKS = TRACKS.filter(t => t.id !== 'COMMON');

export const getTrackDisplayName = (trackId) =>
  TRACKS.find(t => t.id === trackId)?.shortName || trackId;

export const getTrackFullName = (trackId) =>
  TRACKS.find(t => t.id === trackId)?.name || trackId;
