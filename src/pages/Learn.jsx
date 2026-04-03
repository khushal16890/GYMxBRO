import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import styles from "../pages/learn.module.css"
import { useAuth } from '../context/AuthContext';
import EditorialList from '../components/learn/editorial/EditorialList';
import EditorialDetail from '../components/learn/editorial/EditorialDetail';
import CommunityFeed from '../components/learn/community/CommunityFeed';
import AdminPanel from '../components/learn/AdminPanel';

export default function Learn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isDetailPage = location.pathname.includes('/learn/editorial/');
  const isCommunity = location.pathname.includes('/learn/community');
  const isAdmin = location.pathname.includes('/learn/admin');
  
  let activeTab = 'editorial';
  if (isCommunity) activeTab = 'community';
  if (isAdmin) activeTab = 'admin';

  return (
    <div className={styles.learnPage}>
      {!isDetailPage && (
        <header className={styles.learnHeader}>
          <div className={styles.learnHeaderTop}>
            <div>
              <p className={styles.learnSubtitle}>Knowledge Hub</p>
              <h1 className={styles.learnTitle}>
                GYMx<span>BRO</span> Learn
              </h1>
            </div>
          </div>

          <div className={styles.tabsRow}>
            <button
              className={`${styles.tab} ${activeTab === 'editorial' ? styles.tabActive : ''}`}
              onClick={() => navigate('/learn')}
            >
              Editorial
              <span className={styles.tabBadge}>Pro</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'community' ? styles.tabActive : ''}`}
              onClick={() => navigate('/learn/community')}
            >
              Community
            </button>
            {user?.role === 'admin' && (
              <button
                className={`${styles.tab} ${activeTab === 'admin' ? styles.tabActive : ''}`}
                onClick={() => navigate('/learn/admin')}
              >
                Admin Dashboard
              </button>
            )}
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<EditorialList />} />
        <Route path="/editorial/:id" element={<EditorialDetail />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}