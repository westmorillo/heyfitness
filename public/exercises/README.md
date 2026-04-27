# Exercise Image Format

Each exercise lives in its own slug folder:

```text
public/exercises/<exercise-slug>/guide.png
public/exercises/<exercise-slug>/preview.png
```

Current format:

- `guide.png`: wide 3:2 PNG, target size 1200x800 or larger.
- `guide.png`: five left-to-right movement steps with no title, step numbers, labels, or written instructions inside the image.
- `preview.png`: single-position PNG for exercise list thumbnails.
- `preview.png`: use the most recognizable pose, usually the start or contraction position.
- Clean white/off-white background for readability in dark and light themes.
- Original manga-inspired HeyFitness athlete style, no existing characters or logos.

App mapping lives in:

```text
src/exerciseAssets.js
```

Use stable English exercise names in app data. Keep any exercise title or instructions in the UI/data layer, not baked into new images.
