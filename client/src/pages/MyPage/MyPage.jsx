import React, { useEffect, useState, useRef } from 'react';
import Header from '../../components/Header/Header';
import axios from 'axios';
import './MyPage.css';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getProfileImageSrc = (profileImage) => {
  if (!profileImage) return '';
  if (profileImage.customImageUri) {
    return profileImage.customImageUri;
  }
  return profileImage.basicImageUri;
};

const MyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotificationEnable, setIsNotificationEnable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const hasFetched = useRef(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSelectedFile, setModalSelectedFile] = useState(null);
  const [modalPreviewUrl, setModalPreviewUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchUserInfo();
    fetchProfileImage();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/user/mine');
      setUserInfo(res.data.data);
      setIsNotificationEnable(res.data.data.isNotificationEnabled);
    } catch (e) {
      setError('유저 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileImage = async () => {
    try {
      const res = await api.get('/api/user/mine/profile-image');
      setProfileImage(res.data.data);
    } catch (e) {
      setProfileImage(null);
    }
  };

  const handleNotificationChange = async (e) => {
    const nextValue = e.target.checked;
    setIsNotificationEnable(nextValue);
    setSaving(true);
    try {
      await api.patch('/api/user/mine/notifications', {
        isNotificationEnable: nextValue
      });
    } catch (e) {
      setError('알림 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleModalFileChange = (e) => {
    const file = e.target.files[0];
    setModalSelectedFile(file);
    setUploadError('');
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setModalPreviewUrl('');
    }
  };

  const handleModalUpload = async () => {
    if (!modalSelectedFile) {
      setUploadError('파일을 선택해주세요.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', modalSelectedFile);
      await api.patch('/api/user/mine/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProfileImage();
      closeModal();
    } catch (e) {
      setUploadError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setModalSelectedFile(null);
    setModalPreviewUrl('');
    setUploadError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalSelectedFile(null);
    setModalPreviewUrl('');
    setUploadError('');
  };

  return (
    <div className="mypage-container">
      <Header />
      <div className="mypage-content" style={{ background: '#fff', padding: '2rem 0' }}>
        {/* <h1>마이페이지</h1> */}
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : userInfo && (
          <div
            className="mypage-profile-card-vertical"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '2.5rem 2rem',
              border: '1px solid #eee',
              borderRadius: '1.5rem',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              maxWidth: '350px',
              margin: '2rem auto'
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <img
                src={getProfileImageSrc(profileImage) + `?t=${Date.now()}`}
                alt="프로필 이미지"
                className="mypage-profile-avatar-horizontal"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  cursor: 'pointer',
                  border: '2px solid #3ddad7'
                }}
                onClick={openModal}
                title="프로필 이미지 변경"
              />
            </div>
            {/* 프로필 변경 모달 */}
            {isModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '1rem',
                  padding: '2rem',
                  minWidth: '320px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.2rem',
                  position: 'relative'
                }}>
                  <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                  <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                    <img
                      src={modalPreviewUrl || getProfileImageSrc(profileImage)}
                      alt="미리보기"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', background: '#f0f0f0' }}
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModalFileChange}
                    disabled={uploading}
                  />
                  <button
                    onClick={handleModalUpload}
                    disabled={uploading || !modalSelectedFile}
                    style={{
                      padding: '0.5rem 1.2rem',
                      background: '#3ddad7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      cursor: uploading || !modalSelectedFile ? 'not-allowed' : 'pointer',
                      opacity: uploading || !modalSelectedFile ? 0.6 : 1,
                      width: '100%'
                    }}
                  >
                    {uploading ? '업로드 중...' : '프로필 변경'}
                  </button>
                  {uploadError && <div style={{ color: 'red', fontSize: '0.9rem' }}>{uploadError}</div>}
                </div>
              </div>
            )}
            <div className="mypage-profile-info-horizontal" style={{ width: '100%' }}>
              <div className="mypage-profile-nickname-horizontal" style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.3rem' }}>{userInfo.nickname}</div>
              <div className="mypage-profile-email-horizontal" style={{ color: '#888', fontSize: '1rem', marginBottom: '1rem' }}>{userInfo.email}</div>
              <div className="mypage-info-row" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1rem' }}>
                <span className="mypage-label" style={{ color: '#888', fontSize: '1rem' }}>이메일 알림</span>
                <label className="switch">
                  <input type="checkbox" checked={isNotificationEnable} onChange={handleNotificationChange} disabled={saving} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
            {/* 버튼 영역 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '1rem',
              width: '100%'
            }}>
              <button
                className="mypage-my-discussion-btn"
                style={{
                  background: '#4bd1cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.8rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(60,64,67,0.08)',
                  width: '100%'
                }}
                onClick={() => navigate('/discussion/my')}
              >
                내가 개설한 토론 보기
              </button>
              <button
                className="mypage-my-scrap-btn"
                style={{
                  background: '#4bd1cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.8rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(60,64,67,0.08)',
                  width: '100%'
                }}
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
