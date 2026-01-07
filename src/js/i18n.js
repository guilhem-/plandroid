/**
 * i18n.js - Internationalization module
 * Handles language detection, loading, and string translation
 */

const I18n = (() => {
  const SUPPORTED_LANGUAGES = ['en', 'fr', 'es', 'de'];
  const STORAGE_KEY = 'plandroid_language';

  let currentLang = 'en';
  let translations = {};

  /**
   * Detect user's preferred language
   */
  const detectLanguage = () => {
    // 1. Check localStorage for user preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }

    // 2. Check browser language
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }

    // 3. Default to English
    return 'en';
  };

  /**
   * Load translation file for a language
   */
  const loadLanguage = async (lang) => {
    try {
      const response = await fetch(`i18n/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
      translations = await response.json();
      currentLang = lang;
      localStorage.setItem(STORAGE_KEY, lang);
      return true;
    } catch (error) {
      console.error('i18n load error:', error);
      // Fallback to English
      if (lang !== 'en') {
        return loadLanguage('en');
      }
      return false;
    }
  };

  /**
   * Get translated string with optional interpolation
   * @param {string} key - Dot-notation key (e.g., "app.title")
   * @param {object} params - Values to interpolate (e.g., { name: "John" })
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') return key;

    // Interpolate {{param}} placeholders
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  };

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
  };

  /**
   * Initialize i18n system
   */
  const init = async () => {
    const lang = detectLanguage();
    await loadLanguage(lang);
    applyTranslations();
    return currentLang;
  };

  /**
   * Change language
   */
  const setLanguage = async (lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return false;
    await loadLanguage(lang);
    applyTranslations();
    return true;
  };

  /**
   * Get next language in rotation
   */
  const getNextLanguage = () => {
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    return SUPPORTED_LANGUAGES[nextIndex];
  };

  return {
    init,
    t,
    setLanguage,
    getNextLanguage,
    getCurrentLanguage: () => currentLang,
    getSupportedLanguages: () => [...SUPPORTED_LANGUAGES],
    applyTranslations
  };
})();
