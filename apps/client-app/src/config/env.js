/**
 * Environment configuration utility
 * Provides type-safe access to environment variables
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  apiBaseUrlCommon: import.meta.env.VITE_API_BASE_URL_COMMON,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT),
};

/**
 * Authentication Configuration
 */
export const AUTH_CONFIG = {
  tokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY,
};

/**
 * Feature Flags
 */
export const FEATURES = {
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDarkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
};

/**
 * Localization Configuration
 */
export const LOCALIZATION = {
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE,
  supportedLanguages: JSON.parse(import.meta.env.VITE_SUPPORTED_LANGUAGES || '["en"]'),
};

/**
 * Application Configuration
 */
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME,
  version: import.meta.env.VITE_APP_VERSION,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
export const validateEnvVariables = () => {
  const required = [
    'VITE_API_BASE_URL_COMMON',
  ];

  const missing = required.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Validate environment variables when importing this module
validateEnvVariables(); 