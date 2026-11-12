#!/usr/bin/env bash
# Makes web-ready WebP copies of the original images.
#   Originals:  $PHOTOS_SRC (default apps/web/photos-src/), git-ignored
#   Output:     apps/web/src/assets/img/, committed
# Files in $PHOTOS_SRC/sharp/ are converted lossless (text, maps, logos).
# Only converts originals that are newer than their output. Never deletes output.
# Options (environment variables): MAX_WIDTH=1600 QUALITY=75 FORCE=1
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${PHOTOS_SRC:-apps/web/photos-src}"
OUT="apps/web/src/assets/img"
MAX_WIDTH="${MAX_WIDTH:-1600}"
QUALITY="${QUALITY:-75}"
FORCE="${FORCE:-0}"

if [[ ! -d "$SRC" ]]; then
  echo "No originals at $SRC. Nothing to do; the committed images in $OUT are used as they are."
  exit 0
fi
command -v cwebp >/dev/null || { echo "cwebp not found. Install it with: brew install webp"; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"
shopt -s nullglob nocaseglob nocasematch

convert() {  # $1 = original; the remaining arguments are passed to cwebp
  local src="$1" name out input width
  local resize=()
  shift
  name="$(basename "${src%.*}")"
  out="$OUT/$name.webp"
  if [[ "$FORCE" != 1 && -f "$out" && "$out" -nt "$src" ]]; then return; fi

  input="$src"
  if [[ "$src" == *.heic ]]; then  # iPhone photos: cwebp can't read HEIC, so go via JPEG
    input="$TMP/$name.jpg"
    sips -s format jpeg "$src" --out "$input" >/dev/null
  fi

  width="$(sips -g pixelWidth "$input" | awk '/pixelWidth/ { print $2 }')"
  if (( width > MAX_WIDTH )); then resize=(-resize "$MAX_WIDTH" 0); fi  # 0 keeps aspect ratio; never upscale

  cwebp -quiet -metadata none "$@" ${resize[@]+"${resize[@]}"} "$input" -o "$out"
  printf '%-28s %6s -> %6s\n' "$(basename "$src")" "$(du -h "$src" | cut -f1)" "$(du -h "$out" | cut -f1)"
}

for f in "$SRC"/*.{jpg,jpeg,png,webp,heic}; do convert "$f" -q "$QUALITY"; done
for f in "$SRC"/sharp/*.{jpg,jpeg,png,webp,heic}; do convert "$f" -lossless; done
