import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from "../../../pages/learn.module.css";
import CreatePostBox from './CreatePostBox';
import CommunityPostCard from './CommunityPostCard';

const ALL_TAGS = ['Nutrition', 'Strength', 'Cardio', 'Recovery', 'Mindset', 'Beginner'];

export default function CommunityFeed() {
  const { user } = useAuth();
  const [posts, setPosts]         = useState([]);   // ← always an array
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sort, setSort]           = useState('latest');

  useEffect(() => {
    const q = query(collection(db, 'community_posts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load community posts', err);
      setPosts([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNewPost = () => { /* handled by onSnapshot */ };

  const handleUpvote = async (postId) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'community_posts', postId);
      const post = posts.find(p => p._id === postId);
      if (post.upvotes?.includes(user.uid)) {
        await updateDoc(postRef, {
          upvotes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          upvotes: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      console.error('Upvote failed', err);
    }
  };

  const handleComment = async (postId, text) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'community_posts', postId);
      const commentData = {
        _id: Date.now().toString(),
        text,
        user: {
          uid: user.uid,
          name: user.displayName || 'Anonymous'
        },
        createdAt: new Date().toISOString()
      };
      await updateDoc(postRef, {
        comments: arrayUnion(commentData)
      });
    } catch (err) {
      console.error('Comment failed', err);
    }
  };

  // Filter
  let filtered = posts.filter(p => {
    const matchSearch = !search || p.text?.toLowerCase().includes(search.toLowerCase());
    const matchTag    = !activeTag || p.tags?.includes(activeTag);
    return matchSearch && matchTag;
  });

  // Sort
  if (sort === 'top') {
    filtered = [...filtered].sort((a, b) => (b.upvotes?.length ?? 0) - (a.upvotes?.length ?? 0));
  } else {
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return (
    <>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tagsRow}>
          <button
            className={`${styles.tagChip} ${!activeTag ? styles.tagChipActive : ''}`}
            onClick={() => setActiveTag('')}
          >
            All
          </button>
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              className={`${styles.tagChip} ${activeTag === tag ? styles.tagChipActive : ''}`}
              onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="latest">Latest</option>
          <option value="top">Most Upvoted</option>
        </select>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.communityLayout}>
          {/* Feed */}
          <div className={styles.feedColumn}>
            {user ? (
              <CreatePostBox onPost={handleNewPost} />
            ) : (
              <div className={styles.guestPrompt}>
                <Link to="/login">Log in</Link> to share posts with the community.
              </div>
            )}

            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className={styles.skeleton} style={{ height: 130 }} />
              ))
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💬</div>
                <p className={styles.emptyText}>
                  {search || activeTag ? 'No posts match your filters.' : 'No posts yet — be the first!'}
                </p>
              </div>
            ) : (
              filtered.map(post => (
                <CommunityPostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onUpvote={handleUpvote}
                  onComment={handleComment}
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebarColumn}>
            <h3 className={styles.sidebarTitle}>Community Rules</h3>
            <p className={styles.sidebarTip}>🏋️ Stay on topic — fitness, nutrition, and wellness only.</p>
            <p className={styles.sidebarTip}>✅ Be supportive. Constructive feedback only.</p>
            <p className={styles.sidebarTip}>🚫 No spam, self-promotion, or offensive content.</p>
            <p className={styles.sidebarTip}>📌 Tag your posts to help others find them.</p>
          </aside>
        </div>
      </div>
    </>
  );
}