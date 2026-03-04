import React from 'react';
import { Calendar } from 'lucide-react';
import Card from '../ui/Card/Card';
import styles from './OnlineInfoCard.module.css';

const OnlineInfoCard = ({ endDate }) => {
  return (
    <Card className={styles.card}>
      <div className={styles.metaItem}>
        <Calendar size={16} className={styles.icon} />
        <span className={styles.label}>종료일</span>
        <span className={styles.value}>{endDate}</span>
      </div>
    </Card>
  );
};

export default OnlineInfoCard;
