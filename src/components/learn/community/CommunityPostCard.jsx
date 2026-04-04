import { useState } from 'react';
import styles from "../../../pages/learn.module.css";
import CommentSection from '../shared/CommentSection';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommunityPostCard({ post, currentUser, onUpvote, onComment, onDelete }) {
  const [showComments, setShowComments] = useState(false);

  // upvotes array stores Firebase UIDs as strings on the backend
  const hasUpvoted = currentUser && post.upvotes?.includes(currentUser.uid);

  // Avatar initials from Firebase displayName
  const displayName = post.user?.name || post.user?.displayName || 'Anonymous';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.communityCard}>
      <div className={styles.communityCardHeader}>
        <div className={styles.communityUser}>
          <div className={styles.communityAvatar}>{initials}</div>
          <div>
            <div className={styles.communityUsername}>{displayName}</div>
            <div className={styles.communityTime}>{timeAgo(post.createdAt)}</div>
          </div>
        </div>

        {post.tags?.length > 0 && (
          <div className={styles.cardTags}>
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className={styles.cardTag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      <p className={styles.communityText}>{post.text}</p>

      {post.imageUrl && (
        <div className={styles.postImageWrap}>
          <img src={post.imageUrl} alt="Post attachment" className={styles.postImage} />
        </div>
      )}

      <div className={styles.communityCardFooter}>
        <button
          className={`${styles.upvoteBtn} ${hasUpvoted ? styles.upvoteBtnActive : ''}`}
          onClick={() => currentUser ? onUpvote(post._id) : null}
          title={!currentUser ? 'Log in to upvote' : ''}
        >
          ▲ {post.upvotes?.length ?? 0}
        </button>

        <button
          className={styles.commentToggle}
          onClick={() => setShowComments(v => !v)}
        >
          💬 {post.comments?.length ?? 0} {showComments ? '▲' : '▼'}
        </button>

        {currentUser && onDelete && (post.user?.uid === currentUser.uid || currentUser.role === 'admin') && (
          <button
            className={styles.commentToggle}
            onClick={() => onDelete(post._id)}
            style={{ marginLeft: 'auto', color: 'var(--learn-red)' }}
            title="Delete post"
          >
            🗑 Delete
          </button>
        )}
      </div>

      {showComments && (
        <CommentSection
          comments={post.comments || []}
          onSubmit={currentUser ? (text) => onComment(post._id, text) : null}
        />
      )}
    </div>
  );
}