import * as React from "react";
import { useGetMe, useLogin, useRegister, useLogout } from "@workspace/api-client-react";
import { type User } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  register: ReturnType<typeof useRegister>["mutateAsync"];
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const handleLogin = async (data: Parameters<typeof loginMutation.mutateAsync>[0]) => {
    const res = await loginMutation.mutateAsync(data);
    localStorage.setItem("bringwar_token", res.token);
    await refetch();
    setLocation("/dashboard");
    return res;
  };

  const handleRegister = async (data: Parameters<typeof registerMutation.mutateAsync>[0]) => {
    const res = await registerMutation.mutateAsync(data);
    localStorage.setItem("bringwar_token", res.token);
    await refetch();
    setLocation("/dashboard");
    return res;
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // Ignore errors on logout
    }
    localStorage.removeItem("bringwar_token");
    window.location.href = "/login";
  };

  const value = {
    user: user || null,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
