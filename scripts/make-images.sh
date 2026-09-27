#!/usr/bin/env bash
# Makes one flat illustration per cached seed word with the local nano-banana-kie CLI (kie.ai,
# Nano Banana 2 at 1K), logs a sidecar JSON next to the original per the /generate convention,
# and writes a 512px jpg into public/seeds/<key>/<word>.jpg. Existing jpgs are never remade.
#   scripts/make-images.sh            # every word below that has no jpg yet
#   scripts/make-images.sh coral kite # only these words
# Then run scripts/make-seeds.ts to attach the image paths to the seed JSON.
set -euo pipefail
cd "$(dirname "$0")/.."
GEN="/Users/chichi/Desktop/CLAUDE CODE/generations"
STYLE="Flat vector illustration for a children's speech therapy flashcard: %s. One clear subject, centered, bright friendly colors, thick clean outlines, soft shading, plain white background. No text, no letters, no numbers, no words."

LIST='
k-initial-1-2-ocean-6|kelp|tall green kelp seaweed swaying underwater with small fish
k-initial-1-2-ocean-6|crab|a friendly red crab on wet sand
k-initial-1-2-ocean-6|coral|colorful coral on a reef with two small fish
k-initial-1-2-ocean-6|kayak|a yellow kayak with a paddle on calm blue water
k-initial-1-2-ocean-6|current|an ocean current shown as swirling blue water carrying fish along
k-initial-1-2-ocean-6|cove|a small sandy cove with cliffs on both sides and calm water
k-initial-1-2-ocean-6|cabin|a small wooden cabin on a beach
k-initial-1-2-ocean-6|kite|a colorful kite flying above a beach
k-initial-1-2-ocean-6|coast|a sandy coastline with waves and a lighthouse
k-initial-1-2-ocean-6|cork|a cork bobbing on water
k-initial-1-2-ocean-6|calm|a calm flat sea at sunrise
k-initial-1-2-ocean-6|crew|a boat crew of three smiling sailors waving from a boat
k-initial-1-2-ocean-6|catch|a child catching a fish with a net
k-initial-1-2-ocean-6|kid|a smiling kid in a sun hat at the beach
k-initial-1-2-ocean-6|cooler|a blue picnic cooler on the sand
k-initial-1-2-ocean-6|kingdom|an underwater castle kingdom with fish and a crown
r-medial-1-2-farm-7|barn|a red barn with white doors
r-medial-1-2-farm-7|corn|an ear of yellow corn with green husk
r-medial-1-2-farm-7|horse|a brown horse standing in a green field
r-medial-1-2-farm-7|porch|a farmhouse porch with a rocking chair
r-medial-1-2-farm-7|garden|a vegetable garden with neat rows of plants
r-medial-1-2-farm-7|orange|a bright orange fruit with a leaf
r-medial-1-2-farm-7|morning|a sunrise over a farm with a rooster crowing
r-medial-1-2-farm-7|narrow|a narrow dirt path between two wooden fences
l-initial-1-2-zoo-5|lion|a friendly lion with a big golden mane
l-initial-1-2-zoo-5|llama|a fluffy white llama standing in grass
l-initial-1-2-zoo-5|leopard|a spotted leopard resting on a tree branch
l-initial-1-2-zoo-5|lemur|a ring-tailed lemur with a long striped tail
l-initial-1-2-zoo-5|lizard|a green lizard sitting on a rock
l-initial-1-2-zoo-5|lobster|a red lobster with big claws
l-initial-1-2-zoo-5|lynx|a lynx cat with tufted ears
l-initial-1-2-zoo-5|loon|a black and white loon bird swimming on a lake
s-final-1-2-space-8|space|outer space with planets, stars, and a rocket
s-final-1-2-space-8|glass|a clear glass of water
s-final-1-2-space-8|pass|a child passing a ball to a friend
s-final-1-2-space-8|class|a classroom with a teacher pointing at a board with no writing
s-final-1-2-space-8|gas|a big striped gas planet like Jupiter
s-final-1-2-space-8|mass|a huge heavy boulder next to a small pebble
s-final-1-2-space-8|bus|a yellow school bus
s-final-1-2-space-8|loss|a child watching a red balloon float away
'

only=("$@")
echo "$LIST" | while IFS='|' read -r key word desc; do
  [ -z "$key" ] && continue
  if [ ${#only[@]} -gt 0 ] && ! printf '%s\n' "${only[@]}" | grep -qx "$word"; then continue; fi
  out="public/seeds/$key/$word.jpg"
  if [ -f "$out" ]; then echo "$word: jpg exists, skipping"; continue; fi
  prompt=$(printf "$STYLE" "$desc")
  # Reuse a PNG from an earlier run before spending credits again.
  png=$(ls -t "$GEN"/minnow_"$word"_*.png 2>/dev/null | head -1 || true)
  if [ -z "$png" ]; then
    ts=$(date +%s)
    name="minnow_${word}_${ts}"
    echo "$word: generating"
    nano-banana-kie "$prompt" -o "$name" -d "$GEN" -s 1K -a 1:1 -f png > "/tmp/minnow-img-$word.log" 2>&1 || { echo "$word: FAILED (see /tmp/minnow-img-$word.log)"; continue; }
    png="$GEN/$name.png"
    [ -f "$png" ] || { echo "$word: no png produced"; continue; }
    printf '{"model":"nano_banana_2","provider":"kie","prompt":%s,"refs":[],"params":{"aspect":"1:1","size":"1K"},"cost_est":"$0.05","created":"%s","project":"minnow"}\n' \
      "$(printf '%s' "$prompt" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$GEN/$name.json"
  else
    echo "$word: reusing $(basename "$png")"
  fi
  mkdir -p "public/seeds/$key"
  ffmpeg -y -loglevel error -i "$png" -vf "scale=512:512" -q:v 4 "$out" || { echo "$word: convert failed"; continue; }
  echo "$word: saved $out ($(du -h "$out" | cut -f1))"
done
