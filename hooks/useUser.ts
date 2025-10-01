
import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

const USER_STORAGE_KEY = 'midpoint-master-user';

export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback((name: string) => {
    const newUser: User = { name, score: 0, completedExercises: 0 };
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((scoreToAdd: number, exercisesToAdd: number) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        score: currentUser.score + scoreToAdd,
        completedExercises: currentUser.completedExercises + exercisesToAdd,
      };
    });
  }, []);

  return { user, login, logout, updateUser };
}
