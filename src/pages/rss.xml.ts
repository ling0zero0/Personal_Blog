import type { APIRoute } from 'astro';
import { defaultLocale, localeConfig } from '../config/locales';
import { getPostUrl, getPublishedPosts } from '../data/blog';
import { siteConfig } from '../config/site';

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('The RSS feed requires a configured site URL.');

  const posts = await getPublishedPosts();

  const items = posts.map((post) => {
    const url = new URL(getPostUrl(post), site).href;
    const language = localeConfig[post.data.lang].rssLanguage;
    const categories = post.data.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('');

    return `<item><title>${escapeXml(post.data.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(post.data.description)}</description><pubDate>${post.data.pubDate.toUTCString()}</pubDate><dc:language>${language}</dc:language>${categories}</item>`;
  }).join('');

  const feedUrl = new URL(siteConfig.rssPath, site).href;
  const homeUrl = new URL(`/${defaultLocale}/`, site).href;
  const lastBuildDate = posts[0]?.data.pubDate.toUTCString() ?? new Date(0).toUTCString();
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>${siteConfig.rssTitle}</title><link>${escapeXml(homeUrl)}</link><description>关于代码、设计与机器智能的中英文文章 / Bilingual writing on code, design, and machine intelligence.</description><language>mul</language><lastBuildDate>${lastBuildDate}</lastBuildDate><atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
