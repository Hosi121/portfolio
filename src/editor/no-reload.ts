// Keep server-side content invalidation enabled, but do not navigate away from
// an editor when Astro notices a saved article. Preview refresh is explicit.
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => new Promise<void>(() => {}));
}
