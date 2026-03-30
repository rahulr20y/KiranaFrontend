import { useEffect, useState, useCallback } from 'react';
import styles from '../styles/toast.module.css';

export default function NotificationToast({ message, type = 'info', duration = 5000, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Wait for fade out animation
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exit : ''}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && '📩'}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
      <button onClick={handleClose} className={styles.closeBtn}>&times;</button>
    </div>
  );
}
