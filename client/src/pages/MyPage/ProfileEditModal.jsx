import { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="정보 수정">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            style={{
              width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ddd',
              borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box',
            }}
            disabled={updating}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
            트랙
          </label>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ddd',
              borderRadius: '6px', fontSize: '1rem', background: '#fff',
              cursor: 'pointer', boxSizing: 'border-box',
            }}
            disabled={updating}
          >
            <option value="">트랙 선택</option>
            <option value="BACKEND">백엔드</option>
            <option value="FRONTEND">프론트엔드</option>
            <option value="ANDROID">안드로이드</option>
          </select>
        </div>
      </div>
      {error && (
        <div style={{ color: 'red', fontSize: '0.9rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
        <button
          onClick={handleSave}
          disabled={updating}
          style={{
            flex: 1, padding: '0.7rem 1.2rem', background: '#303e4f', color: '#fff',
            border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '1rem',
            cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.6 : 1,
          }}
        >
          {updating ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={handleClose}
          disabled={updating}
          style={{
            flex: 1, padding: '0.7rem 1.2rem', background: '#fff', color: '#666',
            border: '1px solid #ddd', borderRadius: '6px', fontWeight: '600', fontSize: '1rem',
            cursor: updating ? 'not-allowed' : 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
