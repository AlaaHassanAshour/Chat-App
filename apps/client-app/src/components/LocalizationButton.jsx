import { useContext } from "react";
import { Tooltip } from "antd";
import { TranslationOutlined } from "@ant-design/icons";

import Localization from "../contexts/Localization";

export default function LocalizationButton() {
  const localizationContext = useContext(Localization);
  if (!localizationContext) {
    return null; // or handle the null case appropriately
  }
  const { localizationChange } = localizationContext;

  return (
    <Tooltip placement="bottom" title={"English / عربي"}>
      <TranslationOutlined
        style={{ color: "white", fontSize: "20px", display: "block" }}
        onClick={localizationChange}
      />
    </Tooltip>
  );
}
