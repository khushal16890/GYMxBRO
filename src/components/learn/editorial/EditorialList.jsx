import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import styles from "../../../pages/learn.module.css";
import blogData from "../../../assets/blogs.json";
import EditorialCard from './EditorialCard';
import CreateArticleBox from './CreateArticleBox';

const ALL_TAGS = ['Nutrition', 'Strength', 'Cardio', 'Recovery', 'Mindset', 'Beginner'];

export default function EditorialList() {
  const [posts, setPosts]         = useState([]);   // ← always an array, never undefined
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeTag, setActiveTag] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'editorial_articles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load editorial posts', err);
      setPosts([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const insertDemoData = async () => {
    setLoading(true);
    const articlesRef = collection(db, "editorial_articles");
    
    for (const item of blogData) {
      try {
        const article = {
          title: item.title,
          preview: item.preview,
          content: item.full,
          author: "GymxBro Team",
          tags: ["Education", "Guide"],
          likes: [],
          comments: [],
          createdAt: new Date().toISOString()
        };
        await addDoc(articlesRef, article);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
    setLoading(false);
  };

  const filtered = posts.filter(p => {
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.preview?.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || p.tags?.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <>
      <div className={styles.toolbar}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tag filter */}
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
      </div>

      <div className={styles.contentArea}>
        <CreateArticleBox />
        
        {loading ? (
          <div className={styles.editorialGrid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={styles.skeleton} style={{ height: 300 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <p className={styles.emptyText}>
              {search || activeTag ? 'No articles match your filters.' : 'No articles published yet.'}
            </p>
            {!search && !activeTag && (
              <button 
                onClick={insertDemoData} 
                className={styles.btnPrimary} 
                style={{ marginTop: '16px' }}
              >
                Load Demo Articles
              </button>
            )}
          </div>
        ) : (
          <div className={styles.editorialGrid}>
            {filtered.map(post => (
              <EditorialCard
                key={post._id}
                post={post}
                onClick={() => navigate(`/learn/editorial/${post._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}