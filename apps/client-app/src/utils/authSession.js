import { AUTH_CONFIG } from "@config/env";

export const getAccessToken = () => localStorage.getItem(AUTH_CONFIG.tokenKey);

export const getRefreshToken = () => localStorage.getItem(AUTH_CONFIG.refreshTokenKey);

export const setAuthSession = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem(AUTH_CONFIG.tokenKey, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(AUTH_CONFIG.refreshTokenKey, refreshToken);
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
};

export const normalizeAuthResponse = (payload) => ({
  accessToken: payload?.token || payload?.accessToken || payload?.jwtToken || null,
  refreshToken:
    payload?.refreshToken ||
    payload?.refresh_token ||
    payload?.tokens?.refreshToken ||
    payload?.data?.refreshToken ||
    null,
});