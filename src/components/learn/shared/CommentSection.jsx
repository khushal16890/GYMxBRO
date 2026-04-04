import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from "../../../pages/learn.module.css";

const MAX_COMMENT_LENGTH = 1000;
const COMMENT_COOLDOWN_MS = 2000;

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
  const [error, setError]   = useState('');
  const lastSubmitRef = useRef(0);

  const handleSubmit = async () => {
    if (!text.trim() || !onSubmit) return;

    // Length validation
    if (text.length > MAX_COMMENT_LENGTH) {
      setError(`Comment must be under ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    // Rate limiting
    if (Date.now() - lastSubmitRef.current < COMMENT_COOLDOWN_MS) {
      setError('Please wait before posting again.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onSubmit(text.trim());
      setText('');
      lastSubmitRef.current = Date.now();
    } catch (err) {
      console.error('Comment failed', err);
      setError('Failed to post comment. Please try again.');
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
        <div>
          {error && (
            <div style={{ color: 'var(--learn-red)', fontSize: 12, marginBottom: 6 }}>{error}</div>
          )}
          <div className={styles.commentInputRow}>
            <input
              className={styles.commentInput}
              type="text"
              placeholder="Write a comment... (Enter to send)"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_COMMENT_LENGTH}
            />
            <button
              className={styles.commentSubmit}
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
          {text.length > MAX_COMMENT_LENGTH * 0.8 && (
            <div style={{ fontSize: 11, color: text.length >= MAX_COMMENT_LENGTH ? 'var(--learn-red)' : 'var(--learn-muted)', textAlign: 'right', marginTop: 4 }}>
              {text.length}/{MAX_COMMENT_LENGTH}
            </div>
          )}
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