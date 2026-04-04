import styles from "../../../pages/learn.module.css";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Generate a consistent placeholder label from the title
function cardLabel(title = '') {
  return title.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'GB';
}

export default function EditorialCard({ post, onClick }) {
  const initials = post.author
    ? post.author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'GB';

  return (
    <div className={styles.editorialCard} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      
      {post.imageUrl ? (
        <div className={styles.cardImagePlaceholder} style={{ padding: 0 }}>
          <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className={styles.cardImagePlaceholder}>
          {cardLabel(post.title)}
        </div>
      )}

      <div className={styles.cardBody}>
        {post.tags?.length > 0 && (
          <div className={styles.cardTags}>
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className={styles.cardTag}>{tag}</span>
            ))}
          </div>
        )}

        <h3 className={styles.cardTitle}>{post.title}</h3>
        <p className={styles.cardPreview}>{post.preview || post.content?.slice(0, 130)}</p>

        <div className={styles.cardFooter}>
          <div className={styles.cardAuthor}>
            <div className={styles.authorDot}>{initials}</div>
            <span>{post.author || 'GymxBro Team'}</span>
          </div>
          <div className={styles.cardStats}>
            <span className={styles.cardStat}>♥ {post.likes?.length ?? 0}</span>
            <span className={styles.cardStat}>💬 {post.comments?.length ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}