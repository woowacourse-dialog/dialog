import React, { useState } from 'react';
import MarkdownRender from '../Markdown/MarkdownRender';
import './MarkdownEditor.css';

const MarkdownEditor = ({ value, onChange, placeholder }) => {
  const [isPreview, setIsPreview] = useState(false);

  const defaultPlaceholder = `마크다운 형식으로 내용을 작성해주세요.

# 제목 1
## 제목 2
### 제목 3

- 목록 1
- 목록 2
  - 하위 목록

**굵게**, *기울임*, ~~취소선~~

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`
            `;

  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <button
          type="button"
          className={`editor-tab ${!isPreview ? 'active' : ''}`}
          onClick={() => setIsPreview(false)}
        >
          작성
        </button>
        <button
          type="button"
          className={`editor-tab ${isPreview ? 'active' : ''}`}
          onClick={() => setIsPreview(true)}
        >
          미리보기
        </button>
      </div>
      
      <div className="editor-content">
        {!isPreview ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || defaultPlaceholder}
            className="markdown-input"
          />
        ) : (
          <div className="markdown-preview">
            <MarkdownRender content={value || '내용을 입력해주세요.'} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
