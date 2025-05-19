import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div className="language-switcher-panel">
      <select
        className="language-switcher info"
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value)}
      >
        <option value="ru">Ru</option>
        <option value="en">En</option>
      </select>
    </div>
  );
}
