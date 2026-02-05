import { FaTimes } from 'react-icons/fa';
import './ImageViewerModal.css';

function ImageViewerModal({ imageUrl, userName, onClose }) {
  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-viewer-close" onClick={onClose}>
          <FaTimes size={24} />
        </button>
        
        <img 
          src={imageUrl} 
          alt={userName}
          className="image-viewer-img"
        />
        
        <div className="image-viewer-info">
          <p>{userName}</p>
        </div>
      </div>
    </div>
  );
}

export default ImageViewerModal;