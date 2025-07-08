import { ConfigProvider, theme } from "antd";
import ThemeModeContext from "./contexts/ThemeMode.jsx";
import LocalizationContext from "./contexts/Localization.jsx";
import AppRouter from "./routes/AppRouter.jsx";
import { useThemeLocale } from "./hooks/useThemeLocale";
import { APP_CONFIG } from "@config/env";

import InitAntStaticApi from "./utils/InitAntStaticApi.jsx";

import ar_EG from "antd/locale/ar_EG";
import en_US from "antd/locale/en_US";

function App() {
    const {
        darkMode,
        localization,
        darkModeChange,
        localizationChange,
        isInitialized,
    } = useThemeLocale();

    if (!isInitialized) return null;

    const antdLocale = localization === "en" ? en_US : ar_EG;

    document.title = APP_CONFIG.name;

    return (
        <ConfigProvider
            locale={antdLocale}
            theme={{
                algorithm: darkMode
                    ? theme.darkAlgorithm
                    : theme.defaultAlgorithm,
            }}
            direction={localization === "en" ? "ltr" : "rtl"}
        >
            <ThemeModeContext.Provider value={{ darkMode, darkModeChange }}>
                <LocalizationContext.Provider value={{ localizationChange }}>
                    <AppRouter />
                    <InitAntStaticApi />
                </LocalizationContext.Provider>
            </ThemeModeContext.Provider>
        </ConfigProvider>
    );
}

export default App;
