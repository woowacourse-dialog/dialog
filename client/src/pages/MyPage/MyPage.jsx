import React, { useEffect, useState, useRef } from 'react';
import Header from '../../components/Header/Header';
import axios from 'axios';
import './MyPage.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

const MyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotificationEnable, setIsNotificationEnable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchUserInfo();
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

  const handleNotificationChange = async (e) => {
    const nextValue = e.target.checked;
    setIsNotificationEnable(nextValue);
    setSaving(true);
    try {
      const res = await api.patch('/api/user/mine/notifications', {
        isNotificationEnable: nextValue
      });
    } catch (e) {
      setError('알림 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mypage-container">
      <Header />
      <div className="mypage-content" style={{ background: '#fff' }}>
        {/* <h1>마이페이지</h1> */}
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : userInfo && (
          <div className="mypage-profile-card-horizontal">
            <img
              src={userInfo.profileImageUrl || '/default-profile.png'}
              alt="프로필 이미지"
              className="mypage-profile-avatar-horizontal"
            />
            <div className="mypage-profile-info-horizontal">
              <div className="mypage-profile-nickname-horizontal">{userInfo.nickname}</div>
              <div className="mypage-profile-email-horizontal">{userInfo.email}</div>
              <div className="mypage-info-row" style={{ marginTop: '1.2rem' }}>
                <span className="mypage-label">이메일 알림</span>
                <label className="switch">
                  <input type="checkbox" checked={isNotificationEnable} onChange={handleNotificationChange} disabled={saving} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
