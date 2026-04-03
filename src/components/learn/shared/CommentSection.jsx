import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from "../../../pages/learn.module.css";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * @param {Array}    comments  - array of comment objects
 * @param {Function|null} onSubmit - pass null to show guest prompt instead of input
 */
export default function CommentSection({ comments, onSubmit }) {
  const [text, setText]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || !onSubmit) return;
    setLoading(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } catch (err) {
      console.error('Comment failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.commentsSection}>
      {/* Comment list */}
      {comments.length > 0 && (
        <div className={styles.commentsList}>
          {comments.map((c, i) => {
            const name = c.user?.name || c.user?.displayName || 'Anonymous';
            const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={c._id || i} className={styles.comment}>
                <div className={styles.commentAvatar}>{initials}</div>
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentAuthor}>{name}</span>
                    {c.createdAt && (
                      <span className={styles.commentTime}>{timeAgo(c.createdAt)}</span>
                    )}
                  </div>
                  <div className={styles.commentText}>{c.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input or guest prompt */}
      {onSubmit ? (
        <div className={styles.commentInputRow}>
          <input
            className={styles.commentInput}
            type="text"
            placeholder="Write a comment... (Enter to send)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={styles.commentSubmit}
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--learn-muted)', paddingTop: 4 }}>
          <Link to="/login" style={{ color: 'var(--learn-accent)', textDecoration: 'none', fontWeight: 600 }}>
            Log in
          </Link>{' '}
          to join the conversation.
        </div>
      )}
    </div>
  );
}