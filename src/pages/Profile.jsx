import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import styles from './Profile.module.css';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updatingMode, setUpdatingMode] = useState(false);
  
  const [activeTab, setActiveTab] = useState('program'); // 'program', 'posts', 'comments'
  
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [myProgram, setMyProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize newName when user is available
  useEffect(() => {
    if (user) {
      setNewName(user.displayName || user.name || '');
    }
  }, [user]);

  // Fetch all user data
  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      setLoading(true);
      
      try {
        let fetchedPosts = [];
        let fetchedComments = [];
        let fetchedProgram = null;

        // 1. Fetch Active Program
        const programRef = doc(db, 'users', user.uid, 'programs', 'active');
        const programSnap = await getDoc(programRef);
        if (programSnap.exists()) {
          fetchedProgram = programSnap.data();
        }

        // 2. Fetch Community Posts by this user
        const qPosts = query(collection(db, 'community_posts'), where('user.uid', '==', user.uid));
        const postSnap = await getDocs(qPosts);
        postSnap.forEach(d => {
          fetchedPosts.push({ id: d.id, type: 'community_post', ...d.data() });
        });

        // 3. Fetch Editorial Articles (if they are admin/editor)
        if (user.role === 'admin' || user.role === 'editor') {
          const qArticles = query(collection(db, 'editorial_articles'), where('authorUid', '==', user.uid));
          const artSnap = await getDocs(qArticles);
          artSnap.forEach(d => {
            fetchedPosts.push({ id: d.id, type: 'editorial_article', ...d.data() });
          });
        }

        // 4. Fetch Comments
        const allComPostsSnap = await getDocs(collection(db, 'community_posts'));
        allComPostsSnap.forEach(d => {
          const data = d.data();
          if (data.comments && Array.isArray(data.comments)) {
            data.comments.forEach(c => {
              if (c.user && c.user.uid === user.uid) {
                fetchedComments.push({
                  id: c._id,
                  type: 'comment',
                  parentType: 'Community Post',
                  parentTitle: data.text,
                  parentRef: d.id,
                  text: c.text,
                  createdAt: c.createdAt
                });
              }
            });
          }
        });

        const allArtSnap = await getDocs(collection(db, 'editorial_articles'));
        allArtSnap.forEach(d => {
          const data = d.data();
          if (data.comments && Array.isArray(data.comments)) {
            data.comments.forEach(c => {
              if (c.user && c.user.uid === user.uid) {
                fetchedComments.push({
                  id: c._id,
                  type: 'comment',
                  parentType: 'Editorial Article',
                  parentTitle: data.title,
                  parentRef: d.id,
                  text: c.text,
                  createdAt: c.createdAt
                });
              }
            });
          }
        });

        fetchedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        fetchedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setMyProgram(fetchedProgram);
        setMyPosts(fetchedPosts);
        setMyComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user.displayName) {
      setIsEditingName(false);
      return;
    }
    
    setUpdatingMode(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: newName.trim()
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: newName.trim()
      });
      
      user.displayName = newName.trim();
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update name:", err);
      alert('Failed to update display name. Please try again later.');
    } finally {
      setUpdatingMode(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔒</div>
          <p className={styles.emptyText}>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const initials = (user.displayName || user.name || 'G B')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={styles.profileContainer}>
      
      {/* Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.avatar}>
          {initials}
        </div>
        
        <div className={styles.userInfo}>
          {isEditingName ? (
            <div className={styles.editNameArea}>
              <input
                className={styles.editInput}
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Enter new display name"
                autoFocus
              />
              <button 
                className={styles.btnPrimary} 
                onClick={handleUpdateName}
                disabled={updatingMode}
              >
                {updatingMode ? 'Saving...' : 'Save'}
              </button>
              <button 
                className={styles.btnSecondary} 
                onClick={() => {
                  setNewName(user.displayName || user.name || '');
                  setIsEditingName(false);
                }}
                disabled={updatingMode}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <h1 className={styles.userName}>{user.displayName || user.name || 'No Name Set'}</h1>
              <p className={styles.userEmail}>{user.email}</p>
              <span className={styles.userRole}>
                {user.role === 'admin' ? 'Admin' : user.role === 'editor' ? 'Editor' : 'Member'}
              </span>
              <button 
                className={styles.btnSecondary} 
                style={{ marginLeft: '1rem', padding: '6px 12px', fontSize: '12px' }} 
                onClick={() => setIsEditingName(true)}
              >
                Edit Name
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{myProgram ? '1' : '0'}</p>
          <p className={styles.statLabel}>Active Program</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{myPosts.length}</p>
          <p className={styles.statLabel}>Posts Written</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{myComments.length}</p>
          <p className={styles.statLabel}>Comments Made</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'program' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('program')}
        >
          My Program
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          My Posts
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'comments' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          My Comments
        </button>
      </div>

      {/* Feed Area */}
      <div className={styles.feedList}>
        {loading ? (
          <div className={styles.loadingSpinner}>Loading your data...</div>
        ) : activeTab === 'program' ? (
          myProgram ? (
            <div className={styles.programCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardType}>Active Program</span>
                <span className={styles.cardDate}>
                  Started {new Date(myProgram.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className={styles.programTitle}>
                {myProgram.planType === 'ai' ? 'AI Generated Plan' : 'Custom Manual Plan'}
              </h3>
              {myProgram.summary && (
                <p className={styles.programSummary}>{myProgram.summary}</p>
              )}
              <div className={styles.programStats}>
                <span className={styles.programStat}>
                  <strong>{myProgram.days?.length || 0}</strong> Days / Wk
                </span>
                <span className={styles.programStat}>
                  <strong>{myProgram.completedDays?.length || 0}</strong> Workouts Done
                </span>
              </div>
              <button 
                className={styles.btnPrimary}
                onClick={() => navigate('/programs')}
              >
                Go to Tracker
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏋️</div>
              <p className={styles.emptyText}>You don&#39;t have an active program.</p>
              <button 
                className={styles.btnPrimary}
                style={{ marginTop: '20px' }}
                onClick={() => navigate('/custom-plan')}
              >
                Create a Plan
              </button>
            </div>
          )
        ) : activeTab === 'posts' ? (
          myPosts.length > 0 ? (
            myPosts.map(post => (
              <div key={post.id} className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardType}>
                    {post.type === 'community_post' ? 'Community Post' : 'Editorial Article'}
                  </span>
                  <span className={styles.cardDate}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {post.type === 'editorial_article' && (
                  <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Bebas Neue', fontSize: '24px', letterSpacing: '1px' }}>{post.title}</h3>
                )}
                <div className={styles.cardContent}>
                  {post.preview || post.text || 'No content provided.'}
                </div>
                <div className={styles.cardActions}>
                  <div className={styles.actionItem}>
                    <span>♥</span> {post.upvotes?.length || post.likes?.length || 0}
                  </div>
                  <div className={styles.actionItem}>
                    <span>💬</span> {post.comments?.length || 0}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <p className={styles.emptyText}>You haven&#39;t created any posts or articles yet.</p>
            </div>
          )
        ) : ( // Comments Tab
          myComments.length > 0 ? (
            myComments.map(comment => (
              <div key={comment.id} className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardType}>Comment on {comment.parentType}</span>
                  <span className={styles.cardDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.commentContext}>
                  &quot;{comment.parentTitle}&quot;
                </div>
                <div className={styles.cardContent}>
                  {comment.text}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <p className={styles.emptyText}>You haven&#39;t made any comments yet.</p>
            </div>
          )
        )}
      </div>

    </div>
  );
}