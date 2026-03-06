import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../ui/CodeBlock/CodeBlock';
import '../../styles/markdown.css';

const REMARK_PLUGINS = [remarkGfm];

const MARKDOWN_COMPONENTS = {
  code({ inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) {
      return (
        <CodeBlock
          language={match[1]}
          code={String(children).replace(/\n$/, '')}
          {...props}
        />
      );
    }
    return (
      <CodeBlock
        inline
        code={String(children)}
        className={className}
        {...props}
      />
    );
  },
  a({ children, ...props }) {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

const MarkdownRender = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRender;
