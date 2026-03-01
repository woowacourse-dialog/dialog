import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { getProfileImageSrc } from '../../utils/profileImage';

const ProfileImageUploadModal = ({ isOpen, onClose, profileImage, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setError('');
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('파일을 선택해주세요.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await onUpload(selectedFile);
      handleClose();
    } catch {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={previewUrl || getProfileImageSrc(profileImage)}
            alt="미리보기"
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', background: '#f0f0f0' }}
          />
        </div>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          style={{
            padding: '0.5rem 1.2rem',
            background: '#303e4f',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer',
            opacity: uploading || !selectedFile ? 0.6 : 1,
            width: '100%',
          }}
        >
          {uploading ? '업로드 중...' : '프로필 변경'}
        </button>
        {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}
      </div>
    </Modal>
  );
};

export default ProfileImageUploadModal;
