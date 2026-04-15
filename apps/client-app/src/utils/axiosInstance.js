// filepath: /src/utils/axiosInstance.js
import axios from "axios";
import { API_CONFIG } from "@config/env";
import { handleApiError } from "./errorHandler.jsx";
import {
    clearAuthSession,
    getAccessToken,
    getRefreshToken,
    normalizeAuthResponse,
    setAuthSession,
} from "./authSession";

let refreshPromise = null;

const buildApiUrl = (path) => new URL(path, API_CONFIG.apiBaseUrlCommon).toString();

const isAuthRefreshRequest = (url = "") =>
    url.includes("/v1/Auth/refresh-token") ||
    url.includes("/v1/auth/refresh-token") ||
    url.includes("/Auth/refresh-token") ||
    url.includes("/auth/refresh-token");

const isAuthLoginRequest = (url = "") =>
    url.includes("/v1/Auth/login") ||
    url.includes("/v1/auth/login") ||
    url.includes("/Auth/login") ||
    url.includes("/auth/login");

const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error("Missing refresh token");
    }

    const response = await axios.post(
        buildApiUrl("v1/Auth/refresh-token"),
        { refreshToken },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    const session = normalizeAuthResponse(response.data);
    if (!session.accessToken) {
        throw new Error("Refresh token response did not include an access token");
    }

    setAuthSession(session);
    return session.accessToken;
};

const createAxiosInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        timeout: API_CONFIG.timeout,
        headers: {
            "Content-Type": "application/json",
        },
    });

    instance.interceptors.request.use(
        (config) => {
            const token = getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            if (config.data instanceof FormData) {
                config.headers.setContentType("multipart/form-data");
            }

            return config;
        },
        (error) => {
            return Promise.reject(handleApiError(error));
        }
    );

    instance.interceptors.response.use(
        (response) => response.data,
        async (error) => {
            const originalRequest = error.config;
            const status = error.response?.status;

            if (
                status === 401 &&
                originalRequest &&
                !originalRequest._retry &&
                !isAuthRefreshRequest(originalRequest.url) &&
                !isAuthLoginRequest(originalRequest.url) &&
                getRefreshToken()
            ) {
                originalRequest._retry = true;

                try {
                    if (!refreshPromise) {
                        refreshPromise = refreshAccessToken().finally(() => {
                            refreshPromise = null;
                        });
                    }

                    const nextAccessToken = await refreshPromise;
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    clearAuthSession();
                    return Promise.reject(handleApiError(refreshError));
                }
            }

            if (status === 401 && (isAuthRefreshRequest(originalRequest?.url) || !getRefreshToken())) {
                clearAuthSession();
            }

            return Promise.reject(handleApiError(error));
        }
    );

    return instance;
};

// Create instances for different APIs
export const apiCommon = createAxiosInstance(API_CONFIG.apiBaseUrlCommon);
