export const locales = ['zh', 'en'] as const;

export type Locale = (typeof locales)[number];

export type LocaleConfig = {
  htmlLang: string;
  ogLocale: string;
  dateLocale: string;
  rssLanguage: string;
  label: string;
};

export const defaultLocale: Locale = 'zh';

export const localeConfig = {
  zh: {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    dateLocale: 'zh-CN',
    rssLanguage: 'zh-CN',
    label: '中文',
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    dateLocale: 'en-GB',
    rssLanguage: 'en',
    label: 'English',
  },
} satisfies Record<Locale, LocaleConfig>;

export function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value);
}

export function getAlternateLocale(locale: Locale) {
  return locales.find((candidate) => candidate !== locale);
}
