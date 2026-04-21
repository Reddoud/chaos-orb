# CHAOS ORB ◎

A small, cozy oracle of **dubious wisdom**. Type a question, receive absurd cosmic advice. Zero dependencies, zero backend — just a single HTML file, some CSS, and a sprinkle of JavaScript.

## What it does

- **Ask anything.** The Orb pulses, glitches, hums on WebAudio, and delivers a randomized-but-deterministic prophecy seeded by your question.
- **Re-divine.** Don't like the answer? Same question, new salt, new prophecy.
- **Share.** Render the prophecy to a 1200×630 share card and copy to clipboard (falls back to download).
- **Sound toggle, parallax starfield, particle bursts, scanlines.** Because vibes.

## Run it

Just open `index.html` in a browser. Or serve the folder:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploy

Any static host works. GitHub Pages is the natural home — push to a repo and enable Pages on `main` / root.

## Stack

- Vanilla HTML / CSS / JS (no build step)
- Web Audio API for sfx
- Canvas 2D for share cards

Not real advice. Please do not actually mail a raccoon anything.
