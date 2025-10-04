import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../create/DiscussionCreateFormPage.css';
import TitleInput from '../../../components/TitleInput/TitleInput';
import MarkdownEditor from '../../../components/MarkdownEditor/MarkdownEditor';
import Header from '../../../components/Header/Header';
import { findDiscussionById, updateDiscussion } from '../../../api/discussion';

const TRACKS = [
  { id: 'FRONTEND', name: '프론트엔드' },
  { id: 'BACKEND', name: '백엔드' },
  { id: 'ANDROID', name: '안드로이드' },
  { id: 'COMMON', name: '공통' }
];

const DiscussionEditFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [location, setLocation] = useState('');
  const [track, setTrack] = useState('FRONTEND');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await findDiscussionById(id);
        const discussion = response.data;
        const startDate = new Date(discussion.startAt);
        const endDate = new Date(discussion.endAt);
        
        setTitle(discussion.title);
        setContent(discussion.content);
        setDate(startDate.toISOString().split('T')[0]);
        setStartTime(startDate.toTimeString().slice(0, 5));
        setEndTime(endDate.toTimeString().slice(0, 5));
        setParticipantCount(discussion.maxParticipantCount);
        setLocation(discussion.place);
        setTrack(discussion.track);
        setIsLoading(false);
      } catch (error) {
        alert('토론을 불러오는데 실패했습니다.');
        navigate('/');
      }
    };

    fetchDiscussion();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const startDateTime = formatDateTime(date, startTime);
    const endDateTime = formatDateTime(date, endTime);
    try {
      await updateDiscussion(id, { 
        title, 
        content, 
        startDateTime, 
        endDateTime,
        participantCount,
        location,
        track,
        summary: ""
      });
      navigate(`/discussion/${id}`);
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  const formatDateTime = (date, time) => {
    const dt = new Date(`${date}T${time}`);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  const handleParticipantCountChange = (e) => {
    const value = parseInt(e.target.value) || 2;
    setParticipantCount(Math.max(2, value));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="discussion-create-page">
      <Header />
      <div className="discussion-create-container">
        <div className="discussion-create-form">
          <h1>토론 주제 수정</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <TitleInput defaultValue={title} value={title} setTitle={setTitle} />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
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
              <div className="form-group flex-1">
                <label htmlFor="location">토론 장소</label>
                <input
                  type="text"
                  id="location"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 굿샷, 나이스샷, 온라인 줌 미팅"
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
                  placeholder="최소 2명"
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
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <MarkdownEditor value={content} onChange={setContent} />
            </div>

            <div className="discussion-form-actions">
              <button 
                type="button" 
                className="discussion-button discussion-button-cancel"
                onClick={() => navigate(`/discussion/${id}`)}
              >
                취소
              </button>
              <button type="submit" className="discussion-button discussion-button-submit">
                수정
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiscussionEditFormPage; 