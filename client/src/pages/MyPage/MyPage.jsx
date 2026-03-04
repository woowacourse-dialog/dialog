import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Bookmark } from 'lucide-react';
import clsx from 'clsx';
import { fetchMyInfo, fetchMyProfileImage, updateNotificationSetting, updateProfileImage, updateUserInfo } from '../../api/userApi';
import { getProfileImageSrc } from '../../utils/profileImage';
import { getTrackDisplayName } from '../../constants/tracks';
import LoadingSpinner from '../../components/ui/LoadingSpinner/LoadingSpinner';
import ToggleSwitch from '../../components/ui/ToggleSwitch/ToggleSwitch';
import Button from '../../components/ui/Button/Button';
import ProfileImageUploadModal from './ProfileImageUploadModal';
import ProfileEditModal from './ProfileEditModal';
import styles from './MyPage.module.css';

const MyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotificationEnable, setIsNotificationEnable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasFetched = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadUserInfo();
    loadProfileImage();
  }, []);

  const loadUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyInfo();
      setUserInfo(data);
      setIsNotificationEnable(data.isNotificationEnabled);
    } catch {
      setError('유저 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileImage = async () => {
    try {
      const data = await fetchMyProfileImage();
      setProfileImage(data);
    } catch {
      setProfileImage(null);
    }
  };

  const handleNotificationChange = async (nextValue) => {
    setIsNotificationEnable(nextValue);
    setSaving(true);
    try {
      await updateNotificationSetting(nextValue);
    } catch {
      setError('알림 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (file) => {
    await updateProfileImage(file);
    await loadProfileImage();
  };

  const handleInfoSave = async ({ nickname, track }) => {
    await updateUserInfo({ nickname, track });
    await loadUserInfo();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <LoadingSpinner message="로딩 중..." fullPage />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {userInfo && (
          <div className={styles.card}>
            <div className={styles.avatarWrapper} onClick={() => setIsModalOpen(true)} title="프로필 이미지 변경">
              <img
                src={getProfileImageSrc(profileImage)}
                alt="프로필 이미지"
                className={styles.avatar}
              />
            </div>

            <ProfileImageUploadModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              profileImage={profileImage}
              onUpload={handleProfileImageUpload}
            />

            <ProfileEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              userInfo={userInfo}
              onSave={handleInfoSave}
            />

            <div className={styles.infoSection}>
              <div className={styles.nicknameRow}>
                <span className={styles.nickname}>{userInfo.nickname}</span>
                {userInfo.track && (
                  <span className={styles.trackLabel}>
                    {getTrackDisplayName(userInfo.track)}
                  </span>
                )}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className={styles.editButton}
                >
                  수정
                </button>
              </div>
              {userInfo.githubId && (
                <div className={styles.githubId}>
                  Github Id: {userInfo.githubId}
                </div>
              )}
              <div className={styles.notificationRow}>
                <span className={styles.notificationLabel}>웹 푸시 알림</span>
                <ToggleSwitch
                  checked={isNotificationEnable}
                  onChange={handleNotificationChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <Button
                variant="primary"
                fullWidth
                leftIcon={<Crown size={16} />}
                onClick={() => navigate('/discussion/my')}
              >
                내가 개설한 토론 보기
              </Button>
              <Button
                variant="primary"
                fullWidth
                leftIcon={<Bookmark size={16} />}
                onClick={() => navigate('/discussion/scrap')}
              >
                내가 스크랩한 토론 보기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
