import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from "../../../pages/learn.module.css";

export default function CreateArticleBox() {
  const { user } = useAuth();
  const [title, setTitle]       = useState('');
  const [preview, setPreview]   = useState('');
  const [content, setContent]   = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading]   = useState(false);

  // Hidden to regular users
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);

    setLoading(true);
    try {
      const newArticle = {
        title: title.trim(),
        preview: preview.trim() || content.trim().slice(0, 100) + '...',
        content: content.trim(),
        author: user.name || user.displayName || 'Editor',
        authorUid: user.uid,
        tags,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'editorial_articles'), newArticle);
      
      setTitle('');
      setPreview('');
      setContent('');
      setTagInput('');
    } catch (err) {
      console.error('Failed to post article', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createBox} style={{ marginBottom: 24 }}>
      <p className={styles.createBoxHeader}>Publish New Editorial Article</p>

      <input
        className={styles.createTagInput}
        style={{ marginBottom: 12, marginTop: 0 }}
        type="text"
        placeholder="Article Title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <textarea
        className={styles.createTextarea}
        style={{ marginBottom: 12, minHeight: '60px' }}
        placeholder="Short preview text..."
        value={preview}
        onChange={e => setPreview(e.target.value)}
        rows={2}
      />

      <textarea
        className={styles.createTextarea}
        placeholder="Full article content... (Use newlines for paragraphs)"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={6}
      />

      <input
        className={styles.createTagInput}
        type="text"
        placeholder="Tags (comma-separated): Guide, Nutrition..."
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
      />

      <div className={styles.createFooter}>
        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !content.trim()}
        >
          {loading ? 'Publishing...' : 'Publish Article'}
        </button>
      </div>
    </div>
  );
}
