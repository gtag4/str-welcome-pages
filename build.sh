#!/usr/bin/env bash
# Builds a deployable folder per property under dist/<property-slug>/
# Usage: ./build.sh
# Each folder in dist/ is what you drag-and-drop (or connect via git) to its own Netlify site.

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

for prop_file in "$ROOT_DIR"/properties/*.json; do
  slug=$(basename "$prop_file" .json)

  # skip the fill-in-the-blank example
  if [ "$slug" = "example-property" ]; then
    continue
  fi

  out="$DIST_DIR/$slug"
  mkdir -p "$out"

  cp "$ROOT_DIR/index.html" "$out/index.html"
  cp -r "$ROOT_DIR/assets" "$out/assets"
  cp "$prop_file" "$out/property.json"

  # Copy a per-property hero image if one exists: properties/<slug>-hero.<ext>
  for ext in jpg jpeg png webp; do
    hero_src="$ROOT_DIR/properties/${slug}-hero.${ext}"
    if [ -f "$hero_src" ]; then
      cp "$hero_src" "$out/hero.${ext}"
      echo "  + hero image: ${slug}-hero.${ext} -> hero.${ext}"
    fi
  done

  echo "Built $slug -> $out"
done

echo "Done. Deploy each folder under dist/ to its own Netlify site."
