import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  fullName: string;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  token: string | null;
  login: (email: string, password: string, orgSlug?: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  logout: () => void;
  switchOrganization: (orgSlug: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedOrg = localStorage.getItem('organization');
    const storedOrgs = localStorage.getItem('organizations');

    if (storedToken && storedUser && storedOrg) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setOrganization(JSON.parse(storedOrg));
      setOrganizations(storedOrgs ? JSON.parse(storedOrgs) : []);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, orgSlug?: string) => {
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
        organizationSlug: orgSlug,
      });

      const { token: newToken, user: newUser, organization: newOrg, organizations: orgs } = response.data;

      setToken(newToken);
      setUser(newUser);
      setOrganization(newOrg);
      setOrganizations(orgs || []);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('organization', JSON.stringify(newOrg));
      localStorage.setItem('organizations', JSON.stringify(orgs || []));

      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, organizationName: string) => {
    try {
      await axios.post(`${apiUrl}/api/auth/register`, {
        email,
        password,
        fullName,
        organizationName,
      });

      // Auto-login after registration
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganization(null);
    setOrganizations([]);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    localStorage.removeItem('organizations');

    delete axios.defaults.headers.common['Authorization'];
  };

  const switchOrganization = async (orgSlug: string) => {
    if (!user) return;

    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email: user.email,
        organizationSlug: orgSlug,
      });

      const { token: newToken, organization: newOrg } = response.data;

      setToken(newToken);
      setOrganization(newOrg);

      localStorage.setItem('token', newToken);
      localStorage.setItem('organization', JSON.stringify(newOrg));

      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Reload page to refresh data
      window.location.reload();
    } catch (error) {
      console.error('Switch organization error:', error);
      throw error;
    }
  };

  const value = {
    user,
    organization,
    organizations,
    token,
    login,
    register,
    logout,
    switchOrganization,
    isAuthenticated: !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}