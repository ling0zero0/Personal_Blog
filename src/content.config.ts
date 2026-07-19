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

export const collections = { blog };
