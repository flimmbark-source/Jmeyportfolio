# Get to the Café local portfolio assets

The V2 portfolio is prepared to use a local gameplay preview and a same-origin browser-play build for Get to the Café.

## Gameplay preview

Place the preview GIF at:

```text
public/previews/get-to-the-cafe.gif
```

The V2 overview and focused project view will automatically use that file when it exists. If it is missing, the existing authored placeholder remains visible instead of showing a broken image.

A short `.webm` or `.mp4` loop may replace the GIF later for better performance, but the current hook expects the GIF path above.

## Browser-play build

The play shell lives at:

```text
/play/get-to-the-cafe
```

It loads the game from:

```text
public/games/get-to-the-cafe/index.html
```

If the game consists of one standalone HTML file, rename/copy it to that path.

If the exported build has supporting JS, CSS, images, audio, models, or other assets, copy the entire exported build directory into:

```text
public/games/get-to-the-cafe/
```

and make sure its entry file is:

```text
public/games/get-to-the-cafe/index.html
```

Relative asset paths inside that build will then resolve from the same folder.

The portfolio's Get to the Café focus state now prefers the local `/play/get-to-the-cafe` route for its primary **Play here** action while retaining itch.io as a secondary external link.

## Codespaces

After uploading the files into those paths, the normal Astro dev server is enough. No extra build step is required for files under `public/`; Astro serves them at the same URL path without the `public` prefix.
