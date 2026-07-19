import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import type { Locale } from './site';

export type LocalizedText = Record<Locale, string>;

export type ProjectImage = {
  src: ImageMetadata;
  alt: LocalizedText;
};

export type Project = {
  slug: string;
  year: string;
  index: string;
  color: string;
  tags: string[];
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  role: LocalizedText;
  outcome: LocalizedText;
  href: string;
  linkLabel?: LocalizedText;
  poster?: ProjectImage;
  gallery?: ProjectImage[];
};

const entries = await getCollection('projects');
const orderedEntries = entries.toSorted(
  (left, right) => left.data.order - right.data.order || left.data.slug.localeCompare(right.data.slug),
);

const slugs = new Set<string>();
const orders = new Set<number>();

for (const entry of orderedEntries) {
  if (slugs.has(entry.data.slug)) throw new Error(`Duplicate project slug: ${entry.data.slug}`);
  if (orders.has(entry.data.order)) throw new Error(`Duplicate project order: ${entry.data.order}`);
  slugs.add(entry.data.slug);
  orders.add(entry.data.order);
}

export const projects: Project[] = orderedEntries.map(({ data }, position) => {
  const images = data.images.map((image) => ({
    src: image.src,
    alt: image.alt,
  }));

  return {
    slug: data.slug,
    year: data.year,
    index: String(position + 1).padStart(2, '0'),
    color: data.color,
    tags: data.tags,
    title: data.title,
    summary: data.summary,
    description: data.description,
    role: data.role,
    outcome: data.outcome,
    href: data.href,
    linkLabel: data.linkLabel,
    poster: images[0],
    gallery: images.length > 0 ? images : undefined,
  };
});
