import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.mdoc', base: './src/content/posts' }),
    schema: z.object({ title: z.string(), date: z.union([z.string(), z.date()]).transform(value => value instanceof Date ? value.toISOString().slice(0, 10) : value), description: z.string().default(''), draft: z.boolean().default(true), footnotes: z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9-]+$/), text: z.string().min(1) })).default([]) }),
  }),
};
