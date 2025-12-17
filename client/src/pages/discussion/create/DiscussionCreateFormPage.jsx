import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DiscussionCreateFormPage.css';
import TitleInput from '../../../components/TitleInput/TitleInput';
import MarkdownEditor from '../../../components/MarkdownEditor/MarkdownEditor';
import { createOfflineDiscussion, createOnlineDiscussion } from '../../../api/discussion';
import { userApi } from '../../../api/userApi';

const TRACKS = [
  { id: 'FRONTEND', name: '프론트엔드' },
  { id: 'BACKEND', name: '백엔드' },
  { id: 'ANDROID', name: '안드로이드' },
  { id: 'COMMON', name: '공통' }
];

const DiscussionCreateFormPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  // 오프라인 토론 필드
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [location, setLocation] = useState('');

  // 온라인 토론 필드
  const [endDateOffset, setEndDateOffset] = useState(1); // 1, 2, 3일 후

  const [track, setTrack] = useState('FRONTEND');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let res;
      if (isOffline) {
        // 오프라인 토론 생성
        const startDateTime = formatDateTime(date, startTime);
        const endDateTime = formatDateTime(date, endTime);
        res = await createOfflineDiscussion({
          title,
          content,
          startDateTime,
          endDateTime,
          participantCount,
          location,
          track
        });
      } else {
        // 온라인 토론 생성
        const endDate = getEndDate(endDateOffset);
        res = await createOnlineDiscussion({
          title,
          content,
          endDate,
          track
        });
      }

      const discussionId = res.data.discussionId;
      const trackName = (TRACKS.find(t => t.id === track)?.name) || track;
      navigate(`/discussion/${discussionId}/complete`, { state: { title, content, trackName } });
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  const formatDateTime = (date, time) => {
    const dt = new Date(`${date}T${time}`);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  const getEndDate = (daysOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0]; // yyyy-MM-dd 형식
  };

  const handleParticipantCountChange = (e) => {
    const value = parseInt(e.target.value) || 2;
    setParticipantCount(Math.max(2, value));
  };

  const getDefaultDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  const getDefaultTime = (hoursToAdd = 0) => {
    const date = new Date();
    date.setHours(date.getHours() + hoursToAdd);
    // 현재 시간을 30분 단위로 반올림
    date.setMinutes(Math.ceil(date.getMinutes() / 30) * 30);
    return date.toTimeString().slice(0, 5); // HH:mm 형식
  };

  // 컴포넌트 마운트 시 기본값 설정
  useEffect(() => {
    setDate(getDefaultDate());
    setStartTime(getDefaultTime(1)); // 1시간 후
    setEndTime(getDefaultTime(2));   // 2시간 후
    
    // 사용자 트랙 조회하여 기본값 설정
    const fetchUserTrack = async () => {
      try {
        const response = await userApi.getTrack();
        const userTrack = response.data.data.track;
        setTrack(userTrack);
      } catch (error) {
        console.error('Failed to fetch user track:', error);
        // 에러 시 기본값 유지 (FRONTEND)
      }
    };
    
    fetchUserTrack();
  }, []);

  return (
    <div className="discussion-create-page">
      <div className="discussion-create-container">
        <div className="discussion-create-form">
          <h1>새로운 토론 주제 작성</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <TitleInput value={title} setTitle={setTitle} />
            </div>

            <div className="form-group">
              <label htmlFor="track">트랙</label>
              <select
                id="track"
                className="form-input"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
              >
                {TRACKS.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="toggle-container">
                <span className="toggle-label">만나서 토론하기</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isOffline}
                    onChange={(e) => setIsOffline(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {isOffline ? (
              <>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="location">토론 장소</label>
                    <input
                      type="text"
                      id="location"
                      className="form-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="예: 굿샷, 나이스샷, 온라인 줌 미팅, 강남역"
                      required
                    />
                  </div>
                  <div className="form-group participant-count">
                    <label htmlFor="participantCount">참여자 수</label>
                    <input
                      type="number"
                      id="participantCount"
                      className="form-input"
                      value={participantCount}
                      onChange={handleParticipantCountChange}
                      min="2"
                      max="10"
                      placeholder="최소 2명"
                      required
                    />
                  </div>
                </div>

                <div className="datetime-container">
                  <div className="date-field">
                    <label htmlFor="date">날짜</label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={getDefaultDate()}
                      required
                    />
                  </div>
                  <div className="time-inputs">
                    <div className="time-field">
                      <label htmlFor="startTime">시작 시간</label>
                      <input
                        type="time"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        step="1800" // 30분 단위
                        required
                      />
                    </div>
                    <div className="time-field">
                      <label htmlFor="endTime">종료 시간</label>
                      <input
                        type="time"
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        step="1800" // 30분 단위
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="endDateOffset">토론 종료 날짜</label>
                <select
                  id="endDateOffset"
                  className="form-input"
                  value={endDateOffset}
                  onChange={(e) => setEndDateOffset(parseInt(e.target.value))}
                  required
                >
                  <option value={1}>1일 후</option>
                  <option value={2}>2일 후</option>
                  <option value={3}>3일 후</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <MarkdownEditor value={content} onChange={setContent} />
            </div>

            <div className="discussion-form-actions">
              <button type="button" className="discussion-button discussion-button-cancel" onClick={() => navigate(-1)}>취소</button>
              <button type="submit" className="discussion-button discussion-button-submit">등록</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCreateFormPage;
