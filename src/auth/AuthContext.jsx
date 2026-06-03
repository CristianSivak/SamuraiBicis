/* eslint-disable react-refresh/only-export-components */
// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext({
  user: null,
  role: null,
  profile: null,
  loading: true,
  error: null,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    role: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      if (!firebaseUser) {
        setState({
          user: null,
          role: null,
          profile: null,
          loading: false,
          error: null,
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        user: firebaseUser,
        loading: true,
        error: null,
      }));

      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const profile = snap.exists() ? snap.data() : null;

        if (!active) return;

        setState({
          user: firebaseUser,
          role: profile?.role || null,
          profile,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("[auth] error fetching profile", error);
        if (!active) return;
        setState({
          user: firebaseUser,
          role: null,
          profile: null,
          loading: false,
          error,
        });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const logout = () => signOut(auth);

  const value = useMemo(() => ({
    user: state.user,
    role: state.role,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    logout,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
