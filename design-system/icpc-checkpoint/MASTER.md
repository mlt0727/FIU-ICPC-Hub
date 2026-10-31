# ICPC Checkpoint — Design System (Master)

Decided with Lingtong on 2026-10-31. Built with the ui-ux-pro-max skill, then simplified on Lingtong's feedback.
Page-specific rules go in `pages/<page>.md` and override this file.

## Principles

1. **Plain and obvious.** Many volunteers are not CS students and may not know what a programming contest is.
   Everyday words only: "Now", "Next", "Done". No contest or developer jargon (no "AC", "RUNNING", "PENDING", terminal prompts).
2. **One card per task** with exactly three things: time, task name, location. Nothing decorative.
3. **Mobile first.** Designed at 375px; on wider screens the content column stays at most 480px wide, centered.
4. **The current task is unmistakable**: amber 2px outline plus the word "Now" (never color alone).

## Colors (dark theme only)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0E1420` | Page background |
| `--card` | `#141B28` | Card background |
| `--card-now` | `#1A1F2B` | Current task card background |
| `--border` | `#2A3547` | Card border (1px) |
| `--text` | `#E6EDF6` | Main text |
| `--text-2` | `#9AA7BA` | Times, locations, labels (about 6.9:1 on `--card`) |
| `--text-done` | `#7D8BA1` | All text on finished cards (about 4.9:1; do not use opacity) |
| `--now` | `#F5B942` | Current task outline and "Now" label (about 9:1 on `--card-now`) |
| `--danger` | `#F87171` | Errors on the admin page |

A light theme is not planned. Add one only if the dark page is hard to read outdoors on the day.

## Typography

- **Inter** (Google Fonts, `display=swap`), weights 400 and 500 only. All numbers use `font-variant-numeric: tabular-nums`.
- Sizes: 12 (labels), 13 (time, location), 16 (task name, body minimum), 22 (person's name).
- Times are 12-hour US style: `8:00 AM`, ranges `8:00 – 10:00 AM`, and `11:00 AM – 12:00 PM` across noon.

## Components

**Header**: small line `ICPC Checkpoint · Sat, Nov 7`, then the name, then three columns: Arrive, Leave, Total.

**Task card**: radius 12px, padding 12px, 10px gap between cards.
- Line 1: time (`--text-2`). Current card: `Now · ` prefix in `--now`. Finished card: ` · Done` suffix.
- Line 2: task name, 16px, weight 500.
- Line 3: map-pin icon + location (`--text-2`). The icon is decorative (`aria-hidden`).
- Breaks (Lunch, Dinner) and all-hands (Orientation) use the same card; no special styling.

**Tech team**: header only, then one card with the tech team notes. No task cards.

## Interaction and accessibility

- Touch targets at least 44×44px; visible focus ring (2px `--now`).
- The "current task" check runs on the phone's clock and updates every minute without reloading.
- Respect `prefers-reduced-motion`; the design uses no animation anyway.
- Icons: one outline icon set, SVG only, no emoji.
