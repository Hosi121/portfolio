import { getEntry } from 'astro:content';
export const prerender = false;
export async function GET({ url }) {
  const slug = url.searchParams.get('slug');
  const post = slug ? await getEntry('posts', slug) : undefined;
  return Response.json(post ? { ...post.data, body: post.body?.trim() || '' } : null, { headers: { 'Cache-Control': 'no-store' } });
}
