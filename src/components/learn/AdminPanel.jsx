import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import styles from "../../pages/learn.module.css";

const ROLE_HIERARCHY = { user: 0, editor: 1, admin: 2 };

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    // Prevent self-demotion/promotion
    if (userId === user.uid) {
      alert("You cannot change your own role.");
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    const oldRole = targetUser?.role || 'user';

    // Prevent assigning roles above your own
    if (ROLE_HIERARCHY[newRole] > ROLE_HIERARCHY[user.role]) {
      alert("You cannot assign a role higher than your own.");
      return;
    }

    // Confirmation for sensitive changes
    if (newRole === 'admin') {
      if (!window.confirm(`Grant ADMIN access to ${targetUser?.name || targetUser?.email}? This gives them full control.`)) return;
    }
    if (oldRole === 'admin' && newRole !== 'admin') {
      if (!window.confirm(`Remove ADMIN access from ${targetUser?.name || targetUser?.email}?`)) return;
    }

    try {
      // Audit log
      await addDoc(collection(db, 'audit_logs'), {
        action: 'role_change',
        changedBy: user.uid,
        changedByName: user.displayName || user.email,
        targetUser: userId,
        targetName: targetUser?.name || targetUser?.email || 'Unknown',
        oldRole,
        newRole,
        timestamp: new Date().toISOString()
      });

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
          Manage user permissions safely. All role changes are logged for audit purposes.
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
                      disabled={u.uid === user.uid}
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
