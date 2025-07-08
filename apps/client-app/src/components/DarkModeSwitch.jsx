import { useContext } from "react";
import { Switch } from "antd";
import { MoonFilled, SunFilled } from "@ant-design/icons";

import ThemeModeContext from "../contexts/ThemeMode";

export default function DarkModeSwitch() {
    const themeContext = useContext(ThemeModeContext);
    if (!themeContext) {
        return null; // or handle the null case appropriately
    }
    const { darkMode, darkModeChange } = themeContext;

    return (
        <Switch
            style={{ display: "block" }}
            onClick={darkModeChange}
            checked={!darkMode}
            checkedChildren={<SunFilled style={{ color: "yellow" }} />}
            unCheckedChildren={<MoonFilled />}
        />
    );
}
