# Summary

This doc defines the code-accurate Figma build sheet for the `0:00 - 0:15` hook section of the ReqAI pitch video.

# Why This Change Exists

- The pitch video needs product visuals that match the real app exactly.
- The first segment should be built from the real landing page rather than invented LinkedIn/resume mockups.
- This gives the team a one-to-one source of truth for the first animated Figma sequence.

# Scope

- Covers only the `0:00 - 0:15` hook section
- Uses the real landing page implementation as the visual source
- Defines frame composition, exact copy, tokens, spacing, and animation order

# Routes Or Surfaces Touched

- `/`

# Data Contract Updates

- None

# Validation Steps

- Compare all copy against [landing-page.tsx](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/packages/shared/src/pages/landing-page.tsx:1)
- Compare nav structure against [top-nav.tsx](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/packages/shared/src/components/top-nav.tsx:1)
- Compare tokens against [globals.css](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/apps/web/src/app/globals.css:1)
- Compare card structure against [card.tsx](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/packages/shared/src/components/card.tsx:1)

# Open Questions Or Follow-Ups

- Whether the pitch video should remain fully code-accurate for all sections or allow stylized intro-only deviations
- Whether later segments should use the live product exactly or slightly zoomed/reframed variants for motion clarity

## Figma Build Sheet

### Goal

Build the first `15` seconds of the pitch video using the real landing page, not external resume or LinkedIn-style mockups.

### Source Of Truth

- [landing-page.tsx](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/packages/shared/src/pages/landing-page.tsx:1)
- [top-nav.tsx](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/packages/shared/src/components/top-nav.tsx:1)
- [globals.css](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/apps/web/src/app/globals.css:1)
- [card.tsx](C:/Users/anivi/OneDrive/Desktop/DevThings/RecAI/RecAI/packages/shared/src/components/card.tsx:1)

### Frame Setup

- Frame size: `1440 x 1024`
- Background: `--paper` = `#F6F4EE`
- Content width: `1240`
- Horizontal page padding: `24`
- Use desktop layout

### Typography

- Body/display font: self-hosted `General Sans`
- Mono utility font: `JetBrains Mono`
- Hero eyebrow:
  - `12px`
  - semibold
  - uppercase
  - letter spacing `0.12em`
  - color `#0E6B4F`
- Hero H1:
  - `44px`
  - semibold
  - line height `1.05`
  - tracking `-0.02em`
  - color `#15201C`
- Hero body:
  - `15px`
  - line height `28px`
  - color `#3A463F`
- Stat eyebrow:
  - `11px`
  - semibold
  - uppercase
  - letter spacing `0.12em`
  - color `#6B7670`
- Stat value:
  - `24px`
  - semibold
  - color `#15201C`
- Stat body:
  - `13px`
  - line height `20px`
  - color `#3A463F`

### Core Tokens

- `--paper`: `#F6F4EE`
- `--surface`: `#FFFFFF`
- `--surface-2`: `#FBFAF6`
- `--hairline`: `#E6E2D8`
- `--ink`: `#15201C`
- `--ink-2`: `#3A463F`
- `--ink-3`: `#6B7670`
- `--verified`: `#0E6B4F`
- `--verified-bg`: `#E6F1EC`
- Radius:
  - large card `14`
  - medium card `10`
- Primary shadow:
  - `0 1px 0 rgba(21,32,28,0.04), 0 1px 2px rgba(21,32,28,0.04)`

### Top Nav

- Height: `56`
- Border bottom: `1px` `#E6E2D8`
- Background: paper at `80%` opacity with blur feel
- Left brand:
  - square icon `24 x 24`
  - fill `#15201C`
  - white `R`
  - green dot at bottom-right
- Wordmark text: `recAI`
- Right side empty for guest view
- Search hidden for this route

### Hero Card

- Full-width white card
- Radius `14`
- Border `1px` `#E6E2D8`
- Shadow `shadow-sm`
- Internal layout:
  - two columns on desktop
  - left `1.2fr`
  - right `1fr`
- Internal padding:
  - horizontal `24` on small
  - `32` on larger
  - vertical `32`
- Gap between columns: `32`

### Exact Hero Copy

- Eyebrow:
  - `Hiring credibility, not candidate polish`
- H1:
  - `Candidate profiles backed by people who actually worked with them.`
- Body:
  - `recAI helps candidates stand out through verified recommendations and helps recruiters search for proven technical and behavioral traits — never self-reported claims.`

### CTA Buttons

- Row gap: `12`
- Primary button:
  - text `Open recruiter portal`
  - dark ink background
  - white text
  - right arrow icon
  - fully rounded pill
  - horizontal padding `20`
  - vertical padding `10`
- Secondary button:
  - text `Open candidate workspace`
  - white background
  - hairline border
  - dark ink text
  - fully rounded pill
  - same padding as primary

### Right-Side Stat Cards

- Three stacked cards
- Gap: `12`
- Card style:
  - background `#FBFAF6`
  - border `1px #E6E2D8`
  - radius `14`
  - padding `20`

#### Card 1

- Eyebrow: `Shared truth`
- Value: `1 profile`
- Body: `Public candidate presence anchored by verified evidence.`

#### Card 2

- Eyebrow: `Search scope`
- Value: `1 job pool`
- Body: `Recruiters search only candidates who opted in to a posting.`

#### Card 3

- Eyebrow: `Verified voices`
- Value: `External`
- Body: `Content comes from managers and coworkers — never the candidate.`

### Trust Flow Card

- Positioned as the next card below the hero section
- White card with standard RecAI card styling
- Card header eyebrow: `Trust flow`
- Inner content: three stacked rows
- Each row:
  - background `#FBFAF6`
  - border `1px #E6E2D8`
  - radius `10`
  - padding `20`
  - left mono step label
  - right text block

#### Trust Flow Exact Copy

- `01` `Candidates request proof from real collaborators`
- Body:
  - `Candidates choose which recommenders to invite. Recommendation content comes from people who actually worked with them, not from the candidate themselves.`
- `02` `Recommenders verify through work email`
- Body:
  - `Each recommender's email domain is checked against the verified-company directory before the form unlocks.`
- `03` `Recruiters search using evidence-backed signals`
- Body:
  - `Filters and natural-language search surface candidates by validated technical and behavioral strengths — never by self-reported claims.`

## Video Timing

### `0:00 - 0:05`

- Show the top nav and hero left column first
- Slow push-in on:
  - eyebrow
  - headline
  - body copy
- Voiceover alignment:
  - `Hiring today runs on self-reported claims.`
  - `Resumes say "built scalable systems," "strong leadership," — but there’s no real proof.`

### `0:05 - 0:10`

- Slide/pan emphasis to the right-side three stat cards
- Hold longest on:
  - `Verified voices / External / Content comes from managers and coworkers — never the candidate.`
- Voiceover alignment:
  - `Recruiters are left guessing: who actually did the work?`
  - `What if candidates were evaluated not by what they say about themselves...`

### `0:10 - 0:15`

- Cut downward into the `Trust flow` card
- Stagger reveal the three rows top to bottom
- End with the third row visible
- Voiceover alignment:
  - `...but by what verified peers say about them?`

## Animation Notes

- Avoid flashy motion
- Use product-demo motion, not ad motion
- Prefer:
  - 5 to 8 percent slow zoom
  - 150 to 250ms staggered card reveals
  - slight vertical slide on trust rows
- Do not change colors, copy, spacing, or hierarchy from the implemented site
