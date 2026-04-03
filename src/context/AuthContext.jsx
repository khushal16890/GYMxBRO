import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // only treat them as logged in if email is verified
      // Google accounts skip this — they're always verified
      if (currentUser && !currentUser.emailVerified && currentUser.providerData[0]?.providerId === "password") {
        setUser(null);
        setLoading(false);
      } else if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          let role = "user";
          
          if (!userDoc.exists()) {
            // Give them a default user role
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Anonymous',
              email: currentUser.email,
              role: role,
              createdAt: new Date().toISOString()
            });
          } else {
            role = userDoc.data().role || "user";
          }
          
          Object.defineProperty(currentUser, 'role', { value: role, writable: true, configurable: true });
          setUser(currentUser);
        } catch (err) {
          console.error("Failed to fetch user role", err);
          setUser(currentUser); // fallback
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);