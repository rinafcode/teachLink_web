
import { toast } from "@/hooks/use-toast";

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'instructor';
  createdAt: string;
}

// Define token response interface
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Define login request interface
export interface LoginRequest {
  email: string;
  password: string;
}

// Define registration request interface
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      this.accessToken = localStorage.getItem("accessToken");
      this.refreshToken = localStorage.getItem("refreshToken");
      const userData = localStorage.getItem("user");
      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error("Failed to load auth data from storage:", error);
      this.logout();
    }
  }

  private saveToStorage() {
    if (this.accessToken) {
      localStorage.setItem("accessToken", this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem("refreshToken", this.refreshToken);
    }
    if (this.user) {
      localStorage.setItem("user", JSON.stringify(this.user));
    }
  }

  private clearStorage() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  async login(credentials: LoginRequest): Promise<User> {
    try {
      // For development/demo purposes, simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: "user-123",
        name: credentials.email.split('@')[0] || "Demo User",
        email: credentials.email,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      
      this.accessToken = "mock-jwt-token-" + Math.random().toString(36).substring(2);
      this.refreshToken = "mock-refresh-token-" + Math.random().toString(36).substring(2);
      this.user = mockUser;
      
      this.saveToStorage();
      return mockUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser: User = {
        id: "user-" + Math.random().toString(36).substring(2),
        name: userData.name,
        email: userData.email,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      
      this.accessToken = "mock-jwt-token-" + Math.random().toString(36).substring(2);
      this.refreshToken = "mock-refresh-token-" + Math.random().toString(36).substring(2);
      this.user = mockUser;
      
      this.saveToStorage();
      return mockUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.clearStorage();
    } catch (error) {
      console.error("Logout error:", error);
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.clearStorage();
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email";
      toast({
        title: "Password Reset Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
      toast({
        title: "Password Reset Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser(): User | null {
    return this.user;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }
}

export const authService = new AuthService();
