import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import NoticeList from './NoticeList';
import './Notice.css';

const NoticeModal = ({ notices, onClose }) => {
  const [selectedNotice, setSelectedNotice] = useState(null);

  const handleNoticeSelect = (notice) => {
    setSelectedNotice(notice);
  };

  const handleBackToList = () => {
    setSelectedNotice(null);
  };

  return (
    <div className="notice-modal-overlay" onClick={onClose}>
      <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notice-modal-header">
          <h2>공지사항</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="notice-modal-content">
          {selectedNotice ? (
            <div className="notice-detail">
              <button className="back-button" onClick={handleBackToList}>
                ← 목록으로
              </button>
              <div className="notice-detail-header">
                <h3>{selectedNotice.title}</h3>
                <div className="notice-meta">
                  <span className="notice-date">{selectedNotice.date}</span>
                  <span className={`notice-priority priority-${selectedNotice.priority}`}>
                    {selectedNotice.priority === 'high' ? '🔴 긴급' : 
                     selectedNotice.priority === 'medium' ? '🟡 중요' : '🟢 일반'}
                  </span>
                </div>
              </div>
              <div className="notice-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
                    h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
                    h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
                    h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
                    p: ({ children }) => <p className="markdown-p">{children}</p>,
                    ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
                    ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
                    li: ({ children }) => <li className="markdown-li">{children}</li>,
                    strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
                    code: ({ children }) => <code className="markdown-code">{children}</code>,
                    pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
                    blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>
                  }}
                >
                  {selectedNotice.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <NoticeList 
              notices={notices}
              onNoticeSelect={handleNoticeSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeModal;
