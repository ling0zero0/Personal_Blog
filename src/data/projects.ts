import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

type ProjectData = CollectionEntry<'projects'>['data'];

export type ProjectImage = ProjectData['images'][number];

export type Project = Omit<ProjectData, 'order' | 'images'> & {
  index: string;
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
  const { order: _order, images, ...project } = data;

  return {
    ...project,
    index: String(position + 1).padStart(2, '0'),
    poster: images[0],
    gallery: images.length > 0 ? images : undefined,
  };
});
