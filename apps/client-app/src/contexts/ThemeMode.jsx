import { createContext, useContext } from "react";

const ThemeModeContext = createContext({
  darkMode: false,
  darkModeChange: () => {
    console.warn('ThemeModeContext not initialized');
  },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeModeContext.Provider');
  }
  return context;
};

export default ThemeModeContext;
