#!/usr/bin/env bash
#
# Generate optimized JPEG thumbnails for the gallery grid.
#
# Full-resolution originals stay in public/images/gallery and are shown in the
# lightbox; the grid loads these small thumbnails instead. Re-run this whenever
# gallery images are added/changed (it skips thumbnails that are already current).
#
# Requires: sips (built into macOS).
#
set -euo pipefail
cd "$(dirname "$0")/.."

SRC_DIR="public/images/gallery"
OUT_DIR="public/images/gallery-thumbs"
MAX=600          # longest edge in px
QUALITY=72       # JPEG quality

count=0
skipped=0
while IFS= read -r -d '' src; do
  rel="${src#"$SRC_DIR"/}"           # e.g. evan-olin/evan-01.png
  out="$OUT_DIR/${rel%.*}.jpg"       # e.g. evan-olin/evan-01.jpg
  if [[ -f "$out" && "$out" -nt "$src" ]]; then
    skipped=$((skipped + 1))
    continue
  fi
  mkdir -p "$(dirname "$out")"
  sips -Z "$MAX" "$src" -s format jpeg -s formatOptions "$QUALITY" --out "$out" >/dev/null 2>&1
  count=$((count + 1))
done < <(find "$SRC_DIR" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) -print0)

echo "Thumbnails generated/updated: $count  (skipped up-to-date: $skipped)"
echo "Output: $OUT_DIR"
