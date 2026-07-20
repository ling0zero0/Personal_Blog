import { getCollection, type CollectionEntry } from 'astro:content';
import { isLocale, localeConfig, type Locale } from '../config/locales';
import { getLocalizedPath, type LocalizedUrls } from '../config/routes';

export type BlogPost = CollectionEntry<'blog'>;

export type BlogTranslation = {
  slug: string;
  url: string;
  post: BlogPost;
};

export type BlogTranslationIndex = Map<string, Partial<Record<Locale, BlogTranslation>>>;

let allPostsPromise: Promise<BlogPost[]> | undefined;

export function getPostSlug(post: BlogPost) {
  const filename = post.id.replaceAll('\\', '/').split('/').pop();
  if (!filename) throw new Error(`Cannot derive a slug from blog entry: ${post.id}`);
  return filename.replace(/\.(md|mdx)$/i, '');
}

export function getPostUrl(post: BlogPost) {
  return getLocalizedPath(post.data.lang, 'journal', getPostSlug(post));
}

export function buildTranslationIndex(posts: BlogPost[]): BlogTranslationIndex {
  const index: BlogTranslationIndex = new Map();
  const urls = new Set<string>();

  for (const post of posts) {
    const [folderLocale] = post.id.replaceAll('\\', '/').split('/');
    if (!isLocale(folderLocale) || folderLocale !== post.data.lang) {
      throw new Error(`Blog locale mismatch: ${post.id} declares lang "${post.data.lang}".`);
    }

    const translationKey = post.data.translationKey.trim();
    const url = getPostUrl(post);
    if (urls.has(url)) throw new Error(`Duplicate blog route: ${url}`);
    urls.add(url);

    const translations = index.get(translationKey) ?? {};
    if (translations[post.data.lang]) {
      throw new Error(`Duplicate translationKey "${translationKey}" for locale "${post.data.lang}".`);
    }
    translations[post.data.lang] = { slug: getPostSlug(post), url, post };
    index.set(translationKey, translations);
  }

  return index;
}

async function getAllPosts() {
  allPostsPromise ??= getCollection('blog').then((posts) => {
    buildTranslationIndex(posts);
    return posts;
  });
  return allPostsPromise;
}

export async function getPublishedPosts() {
  const posts = await getAllPosts();
  return posts
    .filter((post) => !post.data.draft)
    .toSorted((left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf());
}

export async function getPostsByLocale(locale: Locale) {
  return (await getPublishedPosts()).filter((post) => post.data.lang === locale);
}

export async function getFeaturedPosts(locale: Locale, limit = 2) {
  return (await getPostsByLocale(locale))
    .toSorted((left, right) => Number(right.data.featured) - Number(left.data.featured)
      || right.data.pubDate.valueOf() - left.data.pubDate.valueOf())
    .slice(0, limit);
}

export function getReadingTime(post: BlogPost) {
  const source = post.body ?? '';
  const chineseCharacters = source.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const words = source
    .replace(/[\u3400-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const units = chineseCharacters + words;
  return Math.max(2, Math.ceil(units / (post.data.lang === 'zh' ? 350 : 220)));
}

export function formatPostDate(post: BlogPost, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(localeConfig[post.data.lang].dateLocale, options).format(post.data.pubDate);
}

export function getTranslationAlternates(post: BlogPost, posts: BlogPost[]): LocalizedUrls {
  const translationIndex = buildTranslationIndex(posts);
  const translations = translationIndex.get(post.data.translationKey);
  if (!translations) return { [post.data.lang]: getPostUrl(post) };
  return Object.fromEntries(
    Object.entries(translations).map(([locale, entry]) => [locale, entry?.url]),
  ) as LocalizedUrls;
}

export function getRelatedPosts(post: BlogPost, posts: BlogPost[], limit = 2) {
  const tags = new Set(post.data.tags);
  return posts
    .filter((candidate) => candidate.data.lang === post.data.lang && candidate.id !== post.id)
    .map((candidate) => ({
      candidate,
      score: candidate.data.tags.filter((tag) => tags.has(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .toSorted((left, right) => right.score - left.score
      || right.candidate.data.pubDate.valueOf() - left.candidate.data.pubDate.valueOf())
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
