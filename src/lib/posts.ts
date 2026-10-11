import { getCollection } from 'astro:content';
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const postUrl = (id: string) => `${base}/blog/${encodeURIComponent(id)}/`;
export async function posts(includeDrafts = import.meta.env.DEV) {
  return (await getCollection('posts'))
    .filter(post => includeDrafts || !post.data.draft)
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}
