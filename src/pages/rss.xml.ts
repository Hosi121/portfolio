import rss from '@astrojs/rss';
import { posts, postUrl } from '../lib/posts';
export async function GET(context) {
  return rss({ title: 'Hosi121 Blog', description: '片岩拓也のブログ', site: context.site,
    items: (await posts(false)).map(post => ({ title: post.data.title, description: post.data.description, pubDate: new Date(post.data.date), link: postUrl(post.id) })) });
}
