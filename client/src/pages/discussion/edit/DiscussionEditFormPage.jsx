import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import TitleInput from '../../../components/FormField/TitleInput/TitleInput';
import TrackSelect from '../../../components/FormField/TrackSelect/TrackSelect';
import TypeToggle from '../../../components/FormField/TypeToggle/TypeToggle';
import LocationInput from '../../../components/FormField/LocationInput/LocationInput';
import ParticipantCounter from '../../../components/FormField/ParticipantCounter/ParticipantCounter';
import DateTimePicker from '../../../components/FormField/DateTimePicker/DateTimePicker';
import MarkdownEditor from '../../../components/MarkdownEditor/MarkdownEditor';
import { findDiscussionById, updateOnlineDiscussion, updateOfflineDiscussion } from '../../../api/discussion';
import { formatDateTime } from '../../../utils/dateUtils';
import styles from './DiscussionEditFormPage.module.css';

const DiscussionEditFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [discussionType, setDiscussionType] = useState('ONLINE');
  const [track, setTrack] = useState('FRONTEND');

  // 온라인 필드
  const [endDate, setEndDate] = useState('');

  // 오프라인 필드
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [location, setLocation] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await findDiscussionById(id);
        const discussion = response.data;

        setTitle(discussion.commonDiscussionInfo.title);
        setContent(discussion.commonDiscussionInfo.content);
        setTrack(discussion.commonDiscussionInfo.category);
        setDiscussionType(discussion.discussionType);

        if (discussion.discussionType === 'OFFLINE' && discussion.offlineDiscussionInfo) {
          const startDate = new Date(discussion.offlineDiscussionInfo.startAt);
          const endDateObj = new Date(discussion.offlineDiscussionInfo.endAt);

          setDate(startDate.toISOString().split('T')[0]);
          setStartTime(startDate.toTimeString().slice(0, 5));
          setEndTime(endDateObj.toTimeString().slice(0, 5));
          setParticipantCount(discussion.offlineDiscussionInfo.maxParticipantCount);
          setLocation(discussion.offlineDiscussionInfo.place);
        } else if (discussion.discussionType === 'ONLINE' && discussion.onlineDiscussionInfo) {
          setEndDate(discussion.onlineDiscussionInfo.endDate);
        }

        setIsLoading(false);
      } catch {
        alert('토론을 불러오는데 실패했습니다.');
        navigate('/');
      }
    };

    fetchDiscussion();
  }, [id, navigate]);

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (title.length > 50) {
      newErrors.title = '제목은 50자 이내여야 합니다';
    }

    if (discussionType === 'OFFLINE') {
      if (!location.trim()) {
        newErrors.location = '장소를 입력해주세요';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (discussionType === 'OFFLINE') {
        const startDateTime = formatDateTime(date, startTime);
        const endDateTime = formatDateTime(date, endTime);
        await updateOfflineDiscussion(id, {
          title,
          content,
          startDateTime,
          endDateTime,
          participantCount,
          location,
          track,
        });
      } else {
        await updateOnlineDiscussion(id, {
          title,
          content,
          endDate,
          track,
        });
      }
      navigate(`/discussion/${id}`);
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const isOffline = discussionType === 'OFFLINE';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.heading}>토론 주제 수정</h1>

          <form onSubmit={handleSubmit} noValidate>
            <TitleInput
              value={title}
              onChange={setTitle}
              error={errors.title}
            />

            <TrackSelect
              value={track}
              onChange={setTrack}
            />

            <TypeToggle
              value={discussionType}
              onChange={setDiscussionType}
              readOnly
            />

            {isOffline ? (
              <>
                <div className={styles.row}>
                  <LocationInput
                    value={location}
                    onChange={setLocation}
                    error={errors.location}
                  />
                  <ParticipantCounter
                    value={participantCount}
                    onChange={setParticipantCount}
                  />
                </div>
                <DateTimePicker
                  date={date}
                  startTime={startTime}
                  endTime={endTime}
                  onDateChange={setDate}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  error={errors.dateTime}
                />
              </>
            ) : (
              <div className={styles.endDateField}>
                <label htmlFor="endDate" className={styles.label}>토론 종료 날짜</label>
                <input
                  id="endDate"
                  type="date"
                  className={styles.input}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}

            <div className={styles.editorSection}>
              <MarkdownEditor value={content} onChange={setContent} />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={clsx(styles.btn, styles.btnCancel)}
                onClick={() => navigate(`/discussion/${id}`)}
              >
                취소
              </button>
              <button
                type="submit"
                className={clsx(styles.btn, styles.btnSubmit)}
              >
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
