import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import './MarkdownEditorUiw.css';

const MarkdownEditorUiw = ({ value, onChange }) => {
  return (
    <div className="markdown-editor-uiw" data-color-mode="light">
      <MDEditor
        value={value}
        onChange={onChange}
        preview="live"
        height={400}
        highlightEnable={true}
        enableScroll={true}
        textareaProps={{
          placeholder: "마크다운 형식으로 내용을 작성해주세요.\n\n"
        }}
      />
    </div>
  );
};

export default MarkdownEditorUiw; 