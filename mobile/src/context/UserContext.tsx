import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  safetyScore: number;
  analysisCount: number;
  scamsDetected: number;
  joinDate: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateSafetyScore: (score: number) => void;
  incrementAnalysisCount: () => void;
  incrementScamsDetected: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        // Create new user
        const newUser: User = {
          id: `user_${Date.now()}`,
          safetyScore: 50,
          analysisCount: 0,
          scamsDetected: 0,
          joinDate: new Date().toISOString(),
        };
        setUser(newUser);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const updateSafetyScore = (score: number) => {
    if (user) {
      const updatedUser = { ...user, safetyScore: score };
      setUser(updatedUser);
      saveUser(updatedUser);
    }
  };

  const incrementAnalysisCount = () => {
    if (user) {
      const updatedUser = { ...user, analysisCount: user.analysisCount + 1 };
      setUser(updatedUser);
      saveUser(updatedUser);
    }
  };

  const incrementScamsDetected = () => {
    if (user) {
      const updatedUser = { 
        ...user, 
        scamsDetected: user.scamsDetected + 1,
        safetyScore: Math.min(100, user.safetyScore + 2) // Increase safety score when scam is detected
      };
      setUser(updatedUser);
      saveUser(updatedUser);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      updateSafetyScore,
      incrementAnalysisCount,
      incrementScamsDetected,
    }}>
      {children}
    </UserContext.Provider>
  );
};