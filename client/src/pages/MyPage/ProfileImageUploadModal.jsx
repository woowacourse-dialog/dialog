import { useState } from 'react';
import Modal from '../../components/ui/Modal/Modal';
import Button from '../../components/ui/Button/Button';
import { getProfileImageSrc } from '../../utils/profileImage';
import styles from './ProfileImageUploadModal.module.css';

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

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.content}>
        <div className={styles.previewWrapper}>
          <img
            src={previewUrl || getProfileImageSrc(profileImage)}
            alt="미리보기"
            className={styles.previewImage}
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className={styles.fileInput}
        />
        <Button
          variant="primary"
          fullWidth
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          loading={uploading}
        >
          프로필 변경
        </Button>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </Modal>
  );
};

export default ProfileImageUploadModal;
