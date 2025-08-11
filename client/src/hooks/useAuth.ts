import { useQuery, useQueryClient } from "@tanstack/react-query";
// Note: Using direct fetch instead of apiRequest for auth endpoints

interface User {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  safetyScore: number;
  totalAnalyses: number;
  scamsDetected: number;
  lastActiveAt: string;
  createdAt: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/auth/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/auth/user", {
          credentials: 'include',
        });
        if (response.status === 401) {
          return null; // Not authenticated
        }
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        return response.json();
      } catch (error) {
        console.error('Auth error:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
      // Clear all cached data
      queryClient.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const loginWithDemo = async () => {
    try {
      const response = await fetch("/auth/demo-login", {
        method: "POST",
        credentials: 'include',
      });
      if (response.ok) {
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ["/auth/user"] });
      }
    } catch (error) {
      console.error("Demo login error:", error);
    }
  };

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout,
    loginWithDemo,
    loginWithGoogle: loginWithDemo, // Alias for compatibility
  };
}