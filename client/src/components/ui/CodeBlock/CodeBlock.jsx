import React, { Suspense } from 'react';
import clsx from 'clsx';
import styles from './CodeBlock.module.css';

const LazySyntaxBlock = React.lazy(() => import('./SyntaxHighlighterBlock'));

const CodeBlock = ({ language, code, inline = false, className, ...props }) => {
  if (inline) {
    return (
      <code className={clsx(styles.inline, className)} {...props}>
        {code}
      </code>
    );
  }

  return (
    <Suspense
      fallback={
        <div className={styles.block}>
          <pre><code>{code}</code></pre>
        </div>
      }
    >
      <LazySyntaxBlock language={language} code={code} {...props} />
    </Suspense>
  );
};

export default CodeBlock;
