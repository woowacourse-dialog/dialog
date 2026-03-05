import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import styles from './CodeBlock.module.css';

const CodeBlock = ({ language, code, inline = false, className, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [code]);

  // Inline code
  if (inline) {
    return (
      <code className={clsx(styles.inline, className)} {...props}>
        {code}
      </code>
    );
  }

  const displayLanguage = language || 'text';

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <span className={styles.language}>{displayLanguage}</span>
        <button
          className={styles.copyBtn}
          onClick={handleCopy}
          aria-label="코드 복사"
        >
          {isCopied ? (
            <>
              <Check size={14} />
              <span>복사됨!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>복사</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={displayLanguage}
        PreTag="div"
        className={styles.code}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 var(--radius-lg, 8px) var(--radius-lg, 8px)',
          fontFamily: "'JetBrains Mono', var(--font-family-code)",
        }}
        {...props}
      >
        {String(code).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
