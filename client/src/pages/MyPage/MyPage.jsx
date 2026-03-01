import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyInfo, fetchMyProfileImage, updateNotificationSetting, updateProfileImage, updateUserInfo } from '../../api/userApi';
import { getProfileImageSrc } from '../../utils/profileImage';
import { getTrackDisplayName } from '../../constants/tracks';
import ProfileImageUploadModal from './ProfileImageUploadModal';
import ProfileEditModal from './ProfileEditModal';
import './MyPage.css';

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
    } catch (_e) {
      setError('유저 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileImage = async () => {
    try {
      const data = await fetchMyProfileImage();
      setProfileImage(data);
    } catch (_e) {
      setProfileImage(null);
    }
  };

  const handleNotificationChange = async (e) => {
    const nextValue = e.target.checked;
    setIsNotificationEnable(nextValue);
    setSaving(true);
    try {
      await updateNotificationSetting(nextValue);
    } catch (_e) {
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

  return (
    <div className="mypage-container">
      <div className="mypage-content" style={{ background: '#fff', padding: '2rem 0' }}>
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : userInfo && (
          <div
            className="mypage-profile-card-vertical"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
              padding: '2.5rem 2rem', border: '1px solid #eee', borderRadius: '1.5rem',
              background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              maxWidth: '350px', margin: '2rem auto',
            }}
          >
            <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img
                src={getProfileImageSrc(profileImage) + `?t=${Date.now()}`}
                alt="프로필 이미지"
                className="mypage-profile-avatar-horizontal"
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', background: '#f0f0f0', cursor: 'pointer', border: '2px solid #303e4f' }}
                onClick={() => setIsModalOpen(true)}
                title="프로필 이미지 변경"
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

            <div className="mypage-profile-info-horizontal" style={{ width: '100%' }}>
              <div className="mypage-profile-nickname-horizontal" style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {userInfo.nickname}
                {userInfo.track && (
                  <span style={{ color: '#9ca3af', fontSize: '0.9rem', fontWeight: '400' }}>
                    {getTrackDisplayName(userInfo.track)}
                  </span>
                )}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="nickname-edit-btn"
                  style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer', color: '#666', fontWeight: '400' }}
                >
                  수정
                </button>
              </div>
              {userInfo.githubId && (
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.8rem' }}>
                  Github Id: {userInfo.githubId}
                </div>
              )}
              <div className="mypage-info-row" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1rem' }}>
                <span className="mypage-label" style={{ color: '#888', fontSize: '1rem' }}>웹 푸시 알림</span>
                <label className="switch">
                  <input type="checkbox" checked={isNotificationEnable} onChange={handleNotificationChange} disabled={saving} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem', width: '100%' }}>
              <button
                className="mypage-my-discussion-btn"
                style={{ background: '#303e4f', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,64,67,0.08)', width: '100%' }}
                onClick={() => navigate('/discussion/my')}
              >
                내가 개설한 토론 보기
              </button>
              <button
                className="mypage-my-scrap-btn"
                style={{ background: '#303e4f', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,64,67,0.08)', width: '100%' }}
                onClick={() => navigate('/discussion/scrap')}
              >
                내가 스크랩한 토론 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
