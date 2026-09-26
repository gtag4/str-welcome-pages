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
  if [ ! -d "$ROOT_DIR/assets" ]; then
    echo "ERROR: $ROOT_DIR/assets does not exist. Did the assets/ folder get committed and pushed to the repo?"
    exit 1
  fi
  cp -r "$ROOT_DIR/assets" "$out/assets"
  cp "$prop_file" "$out/property.json"

  # Copy every per-property image asset: properties/<slug>-<name>.<ext> -> <name>.<ext>
  # (this covers the hero photo, plus any other images a property's JSON references,
  # like a ski trail map or a photo referenced in its content)
  for asset_src in "$ROOT_DIR"/properties/"${slug}"-*.jpg "$ROOT_DIR"/properties/"${slug}"-*.jpeg "$ROOT_DIR"/properties/"${slug}"-*.png "$ROOT_DIR"/properties/"${slug}"-*.webp; do
    [ -f "$asset_src" ] || continue
    asset_name=$(basename "$asset_src")
    out_name="${asset_name#${slug}-}"
    cp "$asset_src" "$out/$out_name"
    echo "  + asset: $asset_name -> $out_name"
  done

  echo "Built $slug -> $out"
done

echo "Done. Deploy each folder under dist/ to its own Netlify site."
