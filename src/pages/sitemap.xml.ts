import { posts, postUrl, base } from '../lib/posts';
export async function GET({ site }) {
  const paths = [`${base}/`, `${base}/en.html`, `${base}/blog/`, ...(await posts(false)).map(post => postUrl(post.id))];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${new URL(path, site)}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
