import { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from "../../../pages/learn.module.css";

export default function CreateArticleBox() {
  const { user } = useAuth();
  const [title, setTitle]       = useState('');
  const [preview, setPreview]   = useState('');
  const [content, setContent]   = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Hidden to regular users
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!validExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
      alert('Invalid file extension.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);

    setLoading(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileName = `editorial/${user.uid}/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const newArticle = {
        title: title.trim(),
        preview: preview.trim() || content.trim().slice(0, 100) + '...',
        content: content.trim(),
        author: user.name || user.displayName || 'Editor',
        authorUid: user.uid,
        imageUrl,
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
      removeImage();
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

      {/* Image Preview */}
      {imagePreview && (
        <div className={styles.imagePreviewWrap}>
          <img src={imagePreview} alt="Cover Preview" className={styles.imagePreviewImg} />
          <button className={styles.imageRemoveBtn} onClick={removeImage} type="button">✕</button>
        </div>
      )}

      <input
        className={styles.createTagInput}
        type="text"
        placeholder="Tags (comma-separated): Guide, Nutrition..."
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
      />

      <div className={styles.createFooter}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <button
          className={styles.imagePickerBtn}
          onClick={() => fileInputRef.current?.click()}
          type="button"
          title="Add a cover image"
        >
          📷 Cover Image
        </button>

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
