"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, onAuthStateChanged, logOut } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);

      // Persist display name to localStorage for instant paint on next load
      try {
        if (firebaseUser) {
          const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "";
          localStorage.setItem("gt_user_logged_in", "true");
          localStorage.setItem("gt_user_display_name", name);
        } else {
          localStorage.removeItem("gt_user_logged_in");
          localStorage.removeItem("gt_user_display_name");
        }
      } catch (_) {}
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
