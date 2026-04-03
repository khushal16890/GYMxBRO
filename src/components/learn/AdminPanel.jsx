import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import styles from "../../pages/learn.module.css";

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if admin
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(fetchedUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
    } catch (e) {
      console.error("Error updating role:", e);
      alert("Failed to update role. Check your permissions.");
    }
  };

  if (!user) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🔒</div>
        <p className={styles.emptyText}>You must be logged in to view this page.</p>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🛑</div>
        <p className={styles.emptyText}>Access Denied. You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.contentArea}>
      <div className={styles.toolbar} style={{ padding: '0 0 24px', border: 'none' }}>
        <h2 className={styles.detailTitle} style={{ fontSize: '32px', margin: 0 }}>
          Admin Dashboard
        </h2>
        <p className={styles.detailMetaItem} style={{ border: 'none', margin: '8px 0 0' }}>
          Manage user permissions safely. "Admin" users can change roles. "Editor" users can write Editorial articles.
        </p>
      </div>

      <div className={styles.editorialGrid} style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div className={styles.skeleton} style={{ height: 60 }} />
        ) : (
          <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--learn-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: 'var(--learn-dim)' }}>Name</th>
                <th style={{ padding: '12px', color: 'var(--learn-dim)' }}>Email</th>
                <th style={{ padding: '12px', color: 'var(--learn-dim)' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--learn-border)' }}>
                  <td style={{ padding: '16px 12px', color: 'var(--learn-text)', fontWeight: 600 }}>
                    {u.name}
                  </td>
                  <td style={{ padding: '16px 12px', color: 'var(--learn-muted)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <select
                      className={styles.sortSelect}
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.uid === user.uid} // prevent demoting self
                      style={{ 
                        opacity: u.uid === user.uid ? 0.5 : 1, 
                        border: u.role === 'admin' ? '1px solid var(--learn-red)' : u.role === 'editor' ? '1px solid var(--learn-accent)' : '1px solid var(--learn-border)' 
                      }}
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
