#!/bin/sh
# Renders public/icons/share.png, the 1200x630 picture a link to the site shows when it is shared
# (og:image in index.html): the app icon, the name and the promise, on the page background.
# Needs ImageMagick and the macOS Georgia font. Run from the repository root:
#   sh scripts/make-share-image.sh
set -e
OUT=public/icons/share.png
ICON=public/icons/ios/1024.png
BG="#f8f6f0"   # --color-bg in styles.css
INK="#222222"  # --color-text
SERIF=/System/Library/Fonts/Supplemental/Georgia.ttf
SIZE=280
RADIUS=$((SIZE * 2237 / 10000)) # iOS's corner radius
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

magick -size "${SIZE}x${SIZE}" xc:none -fill white \
  -draw "roundrectangle 0,0,$((SIZE - 1)),$((SIZE - 1)),$RADIUS,$RADIUS" "$TMP/mask.png"
magick "$ICON" -alpha set -resize "${SIZE}x${SIZE}" "$TMP/mask.png" -compose DstIn -composite "$TMP/icon.png"

magick -size 1200x630 "xc:$BG" \
  "$TMP/icon.png" -gravity center -geometry +0-105 -compose over -composite \
  -font "$SERIF" -fill "$INK" -gravity center \
  -pointsize 76 -annotate +0+105 "YourFlashCards" \
  -pointsize 36 -annotate +0+185 "Learn the words you actually need" \
  -strip -define png:compression-level=9 "$OUT"
echo "$OUT"
