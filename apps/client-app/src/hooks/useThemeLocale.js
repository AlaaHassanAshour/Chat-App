import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FEATURES, LOCALIZATION } from '@config/env';

/**
 * @typedef {Object} ThemeLocaleReturn
 * @property {boolean} darkMode - Current theme state (true for dark mode, false for light mode)
 * @property {'en' | 'ar'} localization - Current language/locale setting
 * @property {() => void} darkModeChange - Function to toggle between dark and light mode
 * @property {() => void} localizationChange - Function to toggle between English and Arabic
 * @property {boolean} isInitialized - Whether the theme and locale have been initialized
 */

/**
 * Custom hook for managing theme and localization settings.
 * 
 * Features:
 * - Manages dark/light mode theme with system preference detection
 * - Handles English/Arabic localization with RTL support
 * - Persists settings in localStorage
 * - Syncs with system theme changes
 * - Provides initialization status
 * 
 * @example
 * const { 
 *   darkMode, 
 *   localization, 
 *   darkModeChange, 
 *   localizationChange,
 *   isInitialized 
 * } = useThemeLocale();
 * 
 * @returns {ThemeLocaleReturn} Object containing theme and locale state and controls
 */
export const useThemeLocale = () => {
  const { i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(null);
  const [localization, setLocalization] = useState(null);

  const windowQuery = window?.matchMedia?.('(prefers-color-scheme:dark)');

  /**
   * Handles system theme change events
   * @param {MediaQueryListEvent} event - System theme change event
   */
  const darkModeChangeWithEvent = useCallback((event) => {
    setDarkMode(event.matches);
    localStorage.setItem('darkMode', event.matches.toString());
  }, []);

  /**
   * Toggles between dark and light mode
   * Persists the setting in localStorage
   */
  const darkModeChange = useCallback(() => {
    const newDarkMode = !darkMode;
    localStorage.setItem('darkMode', newDarkMode ? 'true' : 'false');
    setDarkMode(newDarkMode);
  }, [darkMode]);

  /**
   * Toggles between English and Arabic localization
   * Updates i18n language and persists the setting
   */
  const localizationChange = useCallback(() => {
    const newLocalization = localization === LOCALIZATION.defaultLanguage 
      ? LOCALIZATION.supportedLanguages.find(lang => lang !== LOCALIZATION.defaultLanguage)
      : LOCALIZATION.defaultLanguage;
    
    localStorage.setItem('localization', newLocalization);
    setLocalization(newLocalization);
    i18n.changeLanguage(newLocalization);
  }, [localization, i18n]);

  // Listen for system theme changes
  useEffect(() => {
    windowQuery.addEventListener('change', darkModeChangeWithEvent);
    return () => {
      windowQuery.removeEventListener('change', darkModeChangeWithEvent);
    };
  }, [windowQuery, darkModeChangeWithEvent]);

  // Initialize theme and locale settings
  useEffect(() => {
    const initializeThemeAndLocale = () => {
      // Theme initialization - Use stored preference or system default
      const darkModeLocalStorage = localStorage.getItem('darkMode');
      if (darkModeLocalStorage) {
        setDarkMode(darkModeLocalStorage === 'true');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultDarkMode = prefersDark || FEATURES.enableDarkMode;
        localStorage.setItem('darkMode', defaultDarkMode.toString());
        setDarkMode(defaultDarkMode);
      }

      // Locale initialization - Use stored preference or detect from browser
      const localizationLocalStorage = localStorage.getItem('localization');
      if (localizationLocalStorage && LOCALIZATION.supportedLanguages.includes(localizationLocalStorage)) {
        setLocalization(localizationLocalStorage);
        i18n.changeLanguage(localizationLocalStorage);
      } else {
        const userLang = navigator.language.split('-')[0];
        const defaultLang = LOCALIZATION.supportedLanguages.includes(userLang) 
          ? userLang 
          : LOCALIZATION.defaultLanguage;
        
        localStorage.setItem('localization', defaultLang);
        setLocalization(defaultLang);
        i18n.changeLanguage(defaultLang);
      }
    };

    initializeThemeAndLocale();
  }, [i18n]);

  return {
    darkMode,
    localization,
    darkModeChange,
    localizationChange,
    isInitialized: darkMode !== null && localization !== null
  };
}; 