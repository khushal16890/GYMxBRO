import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from "../../../pages/learn.module.css";

export default function CreatePostBox({ onPost }) {
  const { user } = useAuth();
  const [text, setText]         = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || !user) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const newPost = {
        text: text.trim(),
        tags,
        user: {
          uid: user.uid,
          name: user.displayName || 'Anonymous'
        },
        upvotes: [],
        comments: [],
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'community_posts'), newPost);
      onPost && onPost(newPost);
      setText('');
      setTagInput('');
    } catch (err) {
      console.error('Post failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.metaKey) handleSubmit();
  };

  return (
    <div className={styles.createBox}>
      <p className={styles.createBoxHeader}>Share with the Community</p>

      <textarea
        className={styles.createTextarea}
        placeholder="Share a tip, ask a question, or post a workout win... (⌘+Enter to post)"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
      />

      <input
        className={styles.createTagInput}
        type="text"
        placeholder="Tags (comma-separated): Nutrition, Strength..."
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
      />

      <div className={styles.createFooter}>
        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}