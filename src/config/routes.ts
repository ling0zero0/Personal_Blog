import { isLocale, locales, type Locale } from './locales';

export const navigationRoutes = [
  { key: 'home', segment: '' },
  { key: 'projects', segment: 'projects' },
  { key: 'journal', segment: 'journal' },
  { key: 'about', segment: 'about' },
] as const;

export type RouteKey = (typeof navigationRoutes)[number]['key'];
export type LocalizedUrls = Partial<Record<Locale, string>>;

export function getLocalizedPath(locale: Locale, segment = '', ...rest: string[]) {
  const parts = [segment, ...rest].filter(Boolean);
  return parts.length > 0 ? `/${locale}/${parts.join('/')}` : `/${locale}/`;
}

export function getPathLocale(pathname: string) {
  const candidate = pathname.split('/').filter(Boolean)[0];
  return isLocale(candidate) ? candidate : undefined;
}

export function replacePathLocale(pathname: string, locale: Locale) {
  const parts = pathname.split('/').filter(Boolean);
  if (!isLocale(parts[0])) return getLocalizedPath(locale);
  parts[0] = locale;
  const trailingSlash = pathname.endsWith('/') && parts.length > 1 ? '/' : '';
  return `/${parts.join('/')}${parts.length === 1 ? '/' : trailingSlash}`;
}

export function inferLocalizedUrls(pathname: string): LocalizedUrls {
  if (!getPathLocale(pathname)) return {};
  return Object.fromEntries(locales.map((locale) => [locale, replacePathLocale(pathname, locale)])) as LocalizedUrls;
}
