import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
    lang: z.enum(['zh', 'en']),
    draft: z.boolean().default(false),
    translationKey: z.string(),
    featured: z.boolean().default(false),
  }),
});

const localizedText = z.object({
  zh: z.string().min(1),
  en: z.string().min(1),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/project.json', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    order: z.number().int().positive(),
    year: z.string().regex(/^\d{4}$/),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    tags: z.array(z.string().min(1)).min(1),
    title: localizedText,
    summary: localizedText,
    description: localizedText,
    role: localizedText,
    outcome: localizedText,
    href: z.url(),
    linkLabel: localizedText.optional(),
    images: z.array(z.object({
      src: image(),
      alt: localizedText,
    })).default([]),
  }),
});

export const collections = { blog, projects };
