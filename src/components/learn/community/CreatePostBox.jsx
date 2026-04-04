import { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from "../../../pages/learn.module.css";

export default function CreatePostBox({ onPost }) {
  const { user } = useAuth();
  const [text, setText]         = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
    if (!text.trim() || !user) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        const fileName = `community/${user.uid}/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const newPost = {
        text: text.trim(),
        tags,
        imageUrl,
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
      removeImage();
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

      {/* Image Preview */}
      {imagePreview && (
        <div className={styles.imagePreviewWrap}>
          <img src={imagePreview} alt="Preview" className={styles.imagePreviewImg} />
          <button className={styles.imageRemoveBtn} onClick={removeImage} type="button">✕</button>
        </div>
      )}

      <input
        className={styles.createTagInput}
        type="text"
        placeholder="Tags (comma-separated): Nutrition, Strength..."
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
      />

      <div className={styles.createFooter}>
        {/* Hidden file input */}
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
          title="Add an image"
        >
          📷 Photo
        </button>

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