import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";
const CLUB_KEY = "club";
const CLUB_ROLE_KEY = "club_role";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Club {
  id: string;
  name: string;
}

export type ClubRole = "member" | "admin";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  club: Club | null;
  clubRole: ClubRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  signIn: (
    token: string,
    refreshToken: string,
    user: User,
    club?: Club | null,
    clubRole?: ClubRole | null
  ) => Promise<void>;
  signOut: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setClub: (club: Club, role: ClubRole) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  getValidToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  club: null,
  clubRole: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  signIn: async (
    token: string,
    refreshToken: string,
    user: User,
    club?: Club | null,
    clubRole?: ClubRole | null
  ) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    if (club) {
      await SecureStore.setItemAsync(CLUB_KEY, JSON.stringify(club));
    }
    if (clubRole) {
      await SecureStore.setItemAsync(CLUB_ROLE_KEY, clubRole);
    }

    set({
      token,
      refreshToken,
      user,
      club: club ?? null,
      clubRole: clubRole ?? null,
      isAuthenticated: true,
      isLoading: false,
      isAdmin: clubRole === "admin",
    });
  },

  signOut: async () => {
    const { refreshToken } = get();

    // Revoke refresh token on server
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore errors during logout
      }
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(CLUB_KEY);
    await SecureStore.deleteItemAsync(CLUB_ROLE_KEY);

    set({
      token: null,
      refreshToken: null,
      user: null,
      club: null,
      clubRole: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      const clubJson = await SecureStore.getItemAsync(CLUB_KEY);
      const clubRole = (await SecureStore.getItemAsync(
        CLUB_ROLE_KEY
      )) as ClubRole | null;

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        const club = clubJson ? (JSON.parse(clubJson) as Club) : null;
        set({
          token,
          refreshToken,
          user,
          club,
          clubRole,
          isAuthenticated: true,
          isLoading: false,
          isAdmin: clubRole === "admin",
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setClub: async (club: Club, role: ClubRole) => {
    await SecureStore.setItemAsync(CLUB_KEY, JSON.stringify(club));
    await SecureStore.setItemAsync(CLUB_ROLE_KEY, role);
    set({ club, clubRole: role, isAdmin: role === "admin" });
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is invalid/expired, sign out
        await get().signOut();
        return null;
      }

      const data = await response.json();

      // Update stored tokens
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);

      set({
        token: data.token,
        refreshToken: data.refreshToken,
      });

      return data.token;
    } catch {
      return null;
    }
  },

  getValidToken: async () => {
    const { token, refreshAccessToken } = get();

    if (!token) {
      return null;
    }

    // Check if token is expired by decoding the JWT
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const bufferMs = 60 * 1000; // 1 minute buffer

      if (expiresAt - bufferMs > now) {
        return token; // Token is still valid
      }

      // Token is expired or about to expire, refresh it
      return await refreshAccessToken();
    } catch {
      // If we can't decode the token, try to refresh
      return await refreshAccessToken();
    }
  },
}));
