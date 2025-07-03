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
    email: '',
    phoneNumber: '',
    emailNotification: false,
    phoneNotification: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailPreFilled, setIsEmailPreFilled] = useState(false);

  useEffect(() => {
    if (!checkUserCalled.current) {
      checkUserCalled.current = true;
      checkExistingUser();
    }
  }, []);

  const checkExistingUser = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/signup/check`, {
        withCredentials: true
      });

      const userEmail = response.data.data.email;

      if (userEmail) {
        setFormData(prev => {
          const newState = { ...prev, email: userEmail };
          return newState;
        });
        setIsEmailPreFilled(true);
      }
    } catch (error) {
        alert(error.response.data.message);
        navigate('/');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = '전화번호를 입력해주세요';
    } else if (!/^\d{10,11}$/.test(formData.phoneNumber.replace(/-/g, ''))) {
      newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다';
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/signup`, formData, {
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
            <label htmlFor="email">
              이메일
              <span className="required-mark">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              className={`input-field ${isEmailPreFilled ? 'pre-filled' : ''}`}
            />
            {isEmailPreFilled && (
              <span className="info-message">원하는 이메일로 수정할 수 있습니다.</span>
            )}
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="phoneNumber">
              전화번호
              <span className="required-mark">*</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="전화번호를 입력하세요"
              className="input-field"
            />
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>

          <div className="notification-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="emailNotification"
                name="emailNotification"
                checked={formData.emailNotification}
                onChange={handleChange}
              />
              <label htmlFor="emailNotification">
                이메일 알림 수신
                <span className="optional-mark">(선택)</span>
              </label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="phoneNotification"
                name="phoneNotification"
                checked={formData.phoneNotification}
                onChange={handleChange}
              />
              <label htmlFor="phoneNotification">
                휴대폰 알림 수신
                <span className="optional-mark">(선택)</span>
              </label>
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
