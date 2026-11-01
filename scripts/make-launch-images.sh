#!/bin/sh
# Renders the iOS launch images in public/icons/splash/: the app icon, rounded, centred on the
# page background, once per screen size (portrait) and colour scheme. The pages link them with
# media queries (scripts/launch-images.txt lists the sizes; test/app-shell.test.js checks that
# every image is linked). Needs ImageMagick. Run from the repository root:
#   sh scripts/make-launch-images.sh
set -e
OUT=public/icons/splash
ICON=public/icons/ios/1024.png
LIGHT="#f8f6f0" # --color-bg in styles.css
DARK="#161412"  # the dark --color-bg
mkdir -p "$OUT"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

grep -v '^#' scripts/launch-images.txt | while read -r cssw cssh ratio; do
  [ -z "$cssw" ] && continue
  w=$((cssw * ratio))
  h=$((cssh * ratio))
  size=$((w * 28 / 100))  # the icon is 28% of the screen width
  radius=$((size * 2237 / 10000))  # iOS's corner radius
  magick -size "${size}x${size}" xc:none -fill white \
    -draw "roundrectangle 0,0,$((size - 1)),$((size - 1)),$radius,$radius" "$TMP/mask.png"
  magick "$ICON" -alpha set -resize "${size}x${size}" "$TMP/mask.png" -compose DstIn -composite "$TMP/icon.png"
  for scheme in light dark; do
    if [ "$scheme" = light ]; then bg=$LIGHT; else bg=$DARK; fi
    magick -size "${w}x${h}" "xc:$bg" "$TMP/icon.png" -gravity center -compose over -composite \
      -strip -define png:compression-level=9 "$OUT/${w}x${h}-${scheme}.png"
  done
  echo "${w}x${h}"
done
