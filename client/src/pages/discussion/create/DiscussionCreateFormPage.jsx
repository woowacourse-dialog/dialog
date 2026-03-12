import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import TitleInput from '../../../components/FormField/TitleInput/TitleInput';
import TrackSelect from '../../../components/FormField/TrackSelect/TrackSelect';
import TypeToggle from '../../../components/FormField/TypeToggle/TypeToggle';
import EndDatePicker from '../../../components/FormField/EndDatePicker/EndDatePicker';
import LocationInput from '../../../components/FormField/LocationInput/LocationInput';
import ParticipantCounter from '../../../components/FormField/ParticipantCounter/ParticipantCounter';
import DateTimePicker from '../../../components/FormField/DateTimePicker/DateTimePicker';
import MarkdownEditor from '../../../components/MarkdownEditor/MarkdownEditor';
import { createOfflineDiscussion, createOnlineDiscussion } from '../../../api/discussion';
import { userApi } from '../../../api/userApi';
import { getTrackFullName } from '../../../constants/tracks';
import { formatDateTime } from '../../../utils/dateUtils';
import styles from './DiscussionCreateFormPage.module.css';

const getDefaultDate = () => {
  return new Date().toISOString().split('T')[0];
};

const getDefaultTime = (hoursToAdd = 0) => {
  const d = new Date();
  d.setHours(d.getHours() + hoursToAdd);
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30);
  return d.toTimeString().slice(0, 5);
};

const getEndDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const DiscussionCreateFormPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [discussionType, setDiscussionType] = useState('ONLINE');
  const [track, setTrack] = useState('FRONTEND');
  const [endDateOffset, setEndDateOffset] = useState(1);

  // 오프라인 필드
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [location, setLocation] = useState('');

  // 에러
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setDate(getDefaultDate());
    setStartTime(getDefaultTime(1));
    setEndTime(getDefaultTime(2));

    const fetchUserTrack = async () => {
      try {
        const response = await userApi.getTrack();
        const userTrack = response.data.data.track;
        setTrack(userTrack);
      } catch (error) {
        console.error('Failed to fetch user track:', error);
      }
    };

    fetchUserTrack();
  }, []);

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
      if (participantCount < 2 || participantCount > 10) {
        newErrors.participantCount = '참여자 수는 2~10명이어야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      let res;
      if (discussionType === 'OFFLINE') {
        const startDateTime = formatDateTime(date, startTime);
        const endDateTime = formatDateTime(date, endTime);
        res = await createOfflineDiscussion({
          title,
          content,
          startDateTime,
          endDateTime,
          participantCount,
          location,
          track,
        });
      } else {
        const endDate = getEndDate(endDateOffset);
        res = await createOnlineDiscussion({
          title,
          content,
          endDate,
          track,
        });
      }

      const discussionId = res.data.id || res.data.discussionId;
      const trackName = getTrackFullName(track);
      const completeState = {
        title,
        content,
        trackName,
        discussionType,
        ...(discussionType === 'OFFLINE'
          ? { location, date, startTime, endTime, participantCount }
          : { endDate: getEndDate(endDateOffset) }),
      };
      navigate(`/discussion/${discussionId}/complete`, { state: completeState });
    } catch (error) {
      alert(error.response?.data?.data?.message || error.response?.data?.message || '등록에 실패했습니다');
    }
  };

  const isOffline = discussionType === 'OFFLINE';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.heading}>새 토론 등록</h1>

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
              <EndDatePicker
                value={endDateOffset}
                onChange={setEndDateOffset}
              />
            )}

            <div className={styles.editorSection}>
              <MarkdownEditor value={content} onChange={setContent} />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={clsx(styles.btn, styles.btnCancel)}
                onClick={() => navigate(-1)}
              >
                취소
              </button>
              <button
                type="submit"
                className={clsx(styles.btn, styles.btnSubmit)}
              >
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCreateFormPage;
