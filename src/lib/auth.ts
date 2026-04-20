import { useState, useEffect } from "react";
import { User } from "@workspace/api-client-react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("chat_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (newUser: User) => {
    localStorage.setItem("chat_user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("chat_user");
    setUser(null);
  };

  return { user, login, logout, isAuthenticated: !!user };
}
