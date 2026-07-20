import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { locales } from './config/locales';
import projectContract from './config/project-contract.json';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
    lang: z.enum(locales),
    draft: z.boolean().default(false),
    translationKey: z.string().trim().min(1),
    featured: z.boolean().default(false),
  }),
});

const localizedText = z.object({
  zh: z.string().trim().min(1),
  en: z.string().trim().min(1),
}).strict();

const projectUrl = z.url().refine(
  (value) => projectContract.allowedLinkProtocols.includes(new URL(value).protocol),
  'Project links must use http or https.',
);

const projects = defineCollection({
  loader: glob({ pattern: '**/project.json', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    slug: z.string().regex(new RegExp(projectContract.slugPattern)),
    order: z.number().int().positive(),
    year: z.string().regex(new RegExp(projectContract.yearPattern)),
    color: z.string().regex(new RegExp(projectContract.colorPattern)),
    tags: z.array(z.string().trim().min(1)).min(1),
    title: localizedText,
    summary: localizedText,
    description: localizedText,
    role: localizedText,
    outcome: localizedText,
    href: projectUrl,
    linkLabel: localizedText.optional(),
    images: z.array(z.object({
      src: image(),
      alt: localizedText,
    }).strict()).default([]),
  }).strict(),
});

export const collections = { blog, projects };
