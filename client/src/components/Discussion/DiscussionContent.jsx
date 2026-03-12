import React from 'react';
import MarkdownRender from '../Markdown/MarkdownRender';
import styles from './DiscussionContent.module.css';

const DiscussionContent = ({ content }) => {
  return (
    <div className={styles.content}>
      <MarkdownRender content={content} />
    </div>
  );
};

export default DiscussionContent;
