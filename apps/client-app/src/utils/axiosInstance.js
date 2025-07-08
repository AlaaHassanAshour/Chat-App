// filepath: /src/utils/axiosInstance.js
import axios from "axios";
import { API_CONFIG, AUTH_CONFIG } from "@config/env";
import { handleApiError } from "./errorHandler.jsx";

const createAxiosInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        headers: {
            "Content-Type": "application/json",
        },
    });

    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
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
        (error) => Promise.reject(handleApiError(error))
    );

    return instance;
};

// Create instances for different APIs
export const apiCommon = createAxiosInstance(API_CONFIG.apiBaseUrlCommon);
