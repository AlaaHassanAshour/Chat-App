import { createContext, useContext } from "react";

const AuthContext = createContext(null);

export default AuthContext;

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};