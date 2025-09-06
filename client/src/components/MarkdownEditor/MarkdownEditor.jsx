import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './MarkdownEditor.css';

const MarkdownEditor = ({ value, onChange }) => {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <button
          className={`editor-tab ${!isPreview ? 'active' : ''}`}
          onClick={() => setIsPreview(false)}
        >
          작성
        </button>
        <button
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
            placeholder="마크다운 형식으로 내용을 작성해주세요.
            
# 제목 1
## 제목 2
### 제목 3

- 목록 1
- 목록 2
  - 하위 목록

**굵게**, *기울임*, ~~취소선~~

```javascript
function hello() {
  console.log('Hello, world!');
}
```
            "
            className="markdown-input"
          />
        ) : (
          <div className="markdown-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {value || '내용을 입력해주세요.'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor; 