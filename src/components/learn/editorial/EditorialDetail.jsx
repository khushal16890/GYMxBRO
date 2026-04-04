import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from "../../../pages/learn.module.css";
import CommentSection from '../shared/CommentSection';

export default function EditorialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked]     = useState(false);
  const [liking, setLiking]   = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'editorial_articles', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { _id: docSnap.id, ...docSnap.data() };
        setPost(data);
        if (user) setLiked(data.likes?.includes(user.uid));
      } else {
        setPost(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Failed to load post', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleLike = async () => {
    if (!user || !post) return;
    setLiking(true);
    try {
      const docRef = doc(db, 'editorial_articles', id);
      if (post.likes?.includes(user.uid)) {
        await updateDoc(docRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(docRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      console.error('Like failed', err);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (text) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'editorial_articles', id);
      const commentData = {
        _id: Date.now().toString(),
        text,
        user: {
          uid: user.uid,
          name: user.displayName || 'Anonymous'
        },
        createdAt: new Date().toISOString()
      };
      await updateDoc(docRef, {
        comments: arrayUnion(commentData)
      });

      // Dual-write to user's comments subcollection for fast profile lookups
      await addDoc(collection(db, 'users', user.uid, 'userComments'), {
        text,
        parentType: 'Editorial Article',
        parentTitle: post?.title?.substring(0, 80) || 'Article',
        parentRef: id,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Comment failed', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.contentArea}>
        <div className={styles.skeleton} style={{ height: 40, width: 120, marginBottom: 32 }} />
        <div className={styles.skeleton} style={{ height: 60, marginBottom: 16 }} />
        <div className={styles.skeleton} style={{ height: 400 }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.contentArea}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>❌</div>
          <p className={styles.emptyText}>Article not found.</p>
        </div>
      </div>
    );
  }

  const authorInitials = post.author
    ? post.author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'GB';

  return (
    <div className={styles.contentArea}>
      <button className={styles.detailBack} onClick={() => navigate('/learn')}>
        ← Back to Editorial
      </button>

      <div className={styles.detailWrapper}>
        {post.tags?.length > 0 && (
          <div className={styles.detailTagsRow}>
            {post.tags.map(tag => (
              <span key={tag} className={styles.cardTag}>{tag}</span>
            ))}
          </div>
        )}

        <h1 className={styles.detailTitle}>{post.title}</h1>

        <div className={styles.detailMeta}>
          <span className={styles.detailMetaItem}>
            <div className={styles.authorDot}>{authorInitials}</div>
            {post.author || 'GymxBro Team'}
          </span>
          <span className={styles.detailMetaItem}>
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </span>
          <span className={styles.detailMetaItem}>
            ♥ {post.likes?.length ?? 0}
          </span>
        </div>

        {/* Cover Image */}
        {post.imageUrl && (
          <div className={styles.detailCoverWrap}>
            <img src={post.imageUrl} alt={post.title} className={styles.detailCoverImg} />
          </div>
        )}

        {/* Article body */}
        <div className={styles.detailContent}>
          {post.content?.split('\n').map((para, i) =>
            para.trim() ? <p key={i}>{para}</p> : null
          )}
        </div>

        {/* Actions */}
        <div className={styles.detailActions}>
          {user ? (
            <button
              className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
              onClick={handleLike}
              disabled={liking}
            >
              {liked ? '♥' : '♡'}&nbsp;{liked ? 'Liked' : 'Like'} · {post.likes?.length ?? 0}
            </button>
          ) : (
            <div className={styles.loginBanner}>
              🔒 <Link to="/login">Log in</Link> to like and comment on articles.
            </div>
          )}
        </div>

        <CommentSection
          comments={post.comments || []}
          onSubmit={user ? handleComment : null}
        />
      </div>
    </div>
  );
}