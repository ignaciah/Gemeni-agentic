
import { User } from "../types";

const AUTH_KEY = 'cyberchat_auth_user';

export const authService = {
  getUser: (): User | null => {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  login: async (provider: 'google' | 'github'): Promise<User> => {
    // Simulate OAuth 2.0 flow
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: User = {
          id: crypto.randomUUID(),
          name: provider === 'google' ? 'Neural Nomad' : 'Cyber Ghost',
          email: provider === 'google' ? 'nomad@neural.net' : 'ghost@git.hub',
          avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${provider === 'google' ? 'A' : 'B'}`,
          provider
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(mockUser));
        resolve(mockUser);
      }, 1500);
    });
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  }
};
