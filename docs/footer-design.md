# Footer design

Reference: user-provided blue-and-cream footer with an engraved prairie landscape.
The shared `src/components/SiteFooter.astro` serves the Japanese and English portfolio and the blog. Navigation is limited to Blog, GitHub, and CV, alongside the home signature and back-to-top link. The user requested fewer links, so duplicate section links and category headings were removed. After reviewing the whole page, the footer navigation was aligned to the 40rem body column, using the existing paper background, muted text, and small signature. The repeated introduction was removed. The landscape spans the full viewport width and bottom edge as a desaturated decorative strip with reduced opacity and a fading top edge, so it finishes the page without competing with the header. It uses a responsive grid and is hidden in print.

## Illustration

Asset: `public/images/footer-landscape.webp` (2172 × 724). Generated with the built-in image_gen tool; encoded as WebP at quality 85 for delivery. The original PNG remains in the tool's generated_images directory. Illustration is decorative (`alt=""`) and loads lazily. The upper edge fades into the paper while the sides and bottom extend to the page boundaries. A blurred underlay and a vertically masked detail layer progressively sharpen the landscape toward the bottom; both layers reuse the same image asset.

Final generation prompt:

> Use case: illustration-story. Create a wide panoramic website footer illustration, aspect ratio 3:1. Antique fine copperplate engraving / woodcut of a quiet expansive western prairie, low mesas and distant hills on the horizon, finely hatched grasses and wildflowers in foreground, a very small solitary rider on horseback slightly left of center. Exactly two ink colors: deep royal navy blue #123e79 and warm pale cream #f6e9ca. Cream ground with intricate blue etched linework. Top 25 percent is perfectly solid flat blue #123e79 sky, no clouds, no stars, so it blends into a blue website background. Irregular distant hill silhouette. The scene fills the entire lower edge and both sides, no border, no lettering, no logos, no UI. Elegant historical print, extremely fine detailed crosshatching and dry ink texture. This is a decorative image asset only, not a screenshot of a website. Save generated image for use in the local project.
