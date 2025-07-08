import { createContext, useContext } from "react";

const LocalizationContext = createContext({
    localizationChange: () => {
        console.warn("LocalizationContext not initialized");
    },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useLocalization = () => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error(
            "useLocalization must be used within a LocalizationContext.Provider"
        );
    }
    return context;
};

export default LocalizationContext;
