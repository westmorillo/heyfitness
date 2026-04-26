# Exercise Image Format

Each exercise image lives in its own slug folder:

```text
public/exercises/<exercise-slug>/guide.png
```

Current pilot format:

- Wide 3:2 PNG, target size 1200x800 or larger.
- One complete instructional poster per exercise.
- Five left-to-right movement steps.
- Spanish title and step copy baked into the image.
- Clean white background for readability in dark and light themes.
- Original manga-inspired HeyFitness athlete style, no existing characters or logos.

App mapping lives in:

```text
src/exerciseAssets.js
```

Use stable English exercise names in app data, and Spanish instructional copy inside the generated guide image.
