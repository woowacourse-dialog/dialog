import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal/Modal';
import Button from '../../components/ui/Button/Button';
import styles from './ProfileEditModal.module.css';

const ProfileEditModal = ({ isOpen, onClose, userInfo, onSave }) => {
  const [nickname, setNickname] = useState('');
  const [track, setTrack] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && userInfo) {
      setNickname(userInfo.nickname);
      setTrack(userInfo.track);
      setError('');
    }
  }, [isOpen, userInfo]);

  const handleSave = async () => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError('닉네임을 입력해주세요');
      return;
    }
    if (trimmedNickname.length < 2 || trimmedNickname.length > 15) {
      setError('닉네임은 2글자 이상 15자 이내여야 합니다.');
      return;
    }
    if (!track) {
      setError('트랙을 선택해주세요');
      return;
    }

    setUpdating(true);
    setError('');
    try {
      await onSave({ nickname: trimmedNickname, track });
      handleClose();
    } catch (e) {
      if (e.response?.data?.message) {
        setError(e.response.data.message);
      } else {
        setError('정보 수정에 실패했습니다.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setNickname('');
    setTrack('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="정보 수정">
      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            className={styles.input}
            disabled={updating}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>트랙</label>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className={styles.select}
            disabled={updating}
          >
            <option value="">트랙 선택</option>
            <option value="BACKEND">백엔드</option>
            <option value="FRONTEND">프론트엔드</option>
            <option value="ANDROID">안드로이드</option>
          </select>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={updating}
          loading={updating}
        >
          저장
        </Button>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={updating}
        >
          취소
        </Button>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
