import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';
import Header from '../../components/Header/Header';

const Signup = () => {
  const navigate = useNavigate();
  const checkUserCalled = useRef(false);

  const [formData, setFormData] = useState({
    nickname: '',
    track: '',
    webPushNotification: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!checkUserCalled.current) {
      checkUserCalled.current = true;
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    }

    if (!formData.track) {
      newErrors.track = '트랙을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // track 값을 백엔드 형식으로 변환
      const trackMapping = {
        '백엔드': 'BACKEND',
        '프론트엔드': 'FRONTEND',
        '안드로이드': 'ANDROID'
      };
      
      const submitData = {
        ...formData,
        track: trackMapping[formData.track]
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/api/signup`, submitData, {
        withCredentials: true
      });
      alert('회원가입이 완료되었습니다.');
      navigate('/'); // 홈페이지로 리다이렉션
    } catch (error) {
      console.error('Signup error:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="signup-wrapper">
      <Header />
      <div className="signup-container">
        <h1>회원가입</h1>
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="nickname">
              닉네임
              <span className="required-mark">*</span>
              </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="닉네임을 입력하세요"
              className="input-field"
            />
            {errors.nickname && <span className="error-message">{errors.nickname}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="track">
              트랙
              <span className="required-mark">*</span>
            </label>
            <select
              id="track"
              name="track"
              value={formData.track}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">트랙을 선택해주세요</option>
              <option value="백엔드">백엔드</option>
              <option value="프론트엔드">프론트엔드</option>
              <option value="안드로이드">안드로이드</option>
            </select>
            {errors.track && <span className="error-message">{errors.track}</span>}
          </div>

          <div className="notification-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="webPushNotification"
                name="webPushNotification"
                checked={formData.webPushNotification}
                onChange={handleChange}
              />
              <label htmlFor="webPushNotification">
                웹 푸시 알림 수신
                <span className="optional-mark">(선택)</span>
              </label>
              <div 
                className="info-icon"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#6c757d" strokeWidth="2" fill="none"/>
                  <path d="M12 16v-4" stroke="#6c757d" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="8" r="1" fill="#6c757d"/>
                </svg>
                {showTooltip && (
                  <div className="tooltip">
                    <p>크루들이 토론을 올리면 알림을 받을 수 있습니다.</p>
                    <p>추후 마이페이지에서 언제든지 알림을 해제할 수 있습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-button" 
            disabled={isLoading}
          >
            {isLoading ? '처리중...' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
