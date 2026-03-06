import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import styles from './CodeBlock.module.css';

export default function SyntaxHighlighterBlock({ language, code, ...props }) {
  const [isCopied, setIsCopied] = useState(false);
  const displayLanguage = language || 'text';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
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
}
