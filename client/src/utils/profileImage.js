import dialogIcon from '../assets/dialog_icon.png';

export const getProfileImageSrc = (profileImage, fallback = dialogIcon) => {
  if (!profileImage) return fallback;
  if (profileImage.customImageUri) {
    return profileImage.customImageUri;
  }
  return profileImage.basicImageUri || fallback;
};
