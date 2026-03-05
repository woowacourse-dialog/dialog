import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import clsx from 'clsx';
import api from '../../api/axios';
import Button from '../../components/ui/Button/Button';
import Tooltip from '../../components/ui/Tooltip/Tooltip';
import styles from './Signup.module.css';

const ENABLE_SLACK_GUIDE_PAGE = false;

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    track: '',
    webPushNotification: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

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
      await api.post('/signup', {
        track: formData.track,
        webPushNotification: formData.webPushNotification,
      }, {
        withCredentials: true,
      });

      if (ENABLE_SLACK_GUIDE_PAGE) {
        navigate('/signup/complete');
      } else {
        navigate('/');
      }
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
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>회원가입</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="track" className={styles.label}>
              트랙
              <span className={styles.requiredMark}>*</span>
            </label>
            <select
              id="track"
              name="track"
              value={formData.track}
              onChange={handleChange}
              className={styles.selectField}
            >
              <option value="">선택</option>
              <option value="BACKEND">백엔드</option>
              <option value="FRONTEND">프론트엔드</option>
              <option value="ANDROID">안드로이드</option>
            </select>
            {errors.track && <span className={styles.errorMessage}>{errors.track}</span>}
          </div>

          <div className={styles.notificationGroup}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="webPushNotification"
                name="webPushNotification"
                checked={formData.webPushNotification}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <label htmlFor="webPushNotification" className={styles.checkboxLabel}>
                웹 푸시 알림 수신
                <span className={styles.optionalMark}>(선택)</span>
              </label>
              <Tooltip
                content={
                  <>
                    <p>크루들이 토론을 올리면 알림을 받을 수 있습니다.</p>
                    <p>추후 마이페이지에서 언제든지 알림을 해제할 수 있습니다.</p>
                  </>
                }
                position="right"
              >
                <span
                  className={styles.infoIcon}
                  data-testid="notification-info-icon"
                >
                  <Info size={16} />
                </span>
              </Tooltip>
            </div>
          </div>

          <div className={styles.submitWrapper}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
            >
              회원가입
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
