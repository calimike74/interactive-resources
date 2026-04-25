# Hear It in Real Music — Accordion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a collapsible "Hear It in Real Music" accordion to effect/instrument interactive resource components, embedding curated YouTube examples directly in the Learn tab.

**Architecture:** A reusable `HearItAccordion` component that accepts a track list and renders YouTube embeds inside a native `<details>/<summary>` element. Track data lives in a central data file (`lib/audio-examples.js`). Each existing component imports the accordion and places it at the bottom of its Learn tab content. YouTube embeds use `rel=0` to prevent rabbit-holing.

**Tech Stack:** React (client component), YouTube iframe embed API, native HTML `<details>/<summary>` (no extra dependencies), inline styles matching existing theme tokens.

---

## Component-to-Playlist Mapping

Components that will receive the accordion:

| Component File | Resource ID | Playlist Category |
|---|---|---|
| `CombinedDistortionLab.jsx` | combined-distortion-lab | Distortion/Overdrive/Fuzz |
| `DelayEffects.jsx` | delay-effects | Delay |
| `SubtractiveSynthExplorer.jsx` | subtractive-synth-explorer | Mini Moog, ARP, Juno, Prophet 5, Roland SH-101, Korg MS-20, TB-303 |
| `FilterRolloffVisualization.jsx` | filter-rolloff-visualization | Low Pass Filter, Filter Sweeps |
| `AutoFilterImageExplorer.jsx` | autofilter-image-explorer | Filter Sweeps |
| `ReverbImageExplorer.jsx` | reverb-image-explorer | (no playlist yet — note for future) |

Standalone pages or future components:
- Chorus, Flanger/Phaser, Tremolo, Wah Wah, Vocoder, Autotune — could be added to relevant components later
- Synth instruments (CS-80, Korg M1, Fairlight CMI, CR-78, TR-808, LM-1) — add to synthesis topic pages

**Phase 1 (this plan):** Build the reusable component + data file, wire into `CombinedDistortionLab.jsx` and `DelayEffects.jsx` as proof of concept.

**Phase 2 (later):** Roll out to remaining components.

---

### Task 1: Create the audio examples data file

**Files:**
- Create: `lib/audio-examples.js`

**Step 1: Create the data file**

```javascript
// lib/audio-examples.js
// Curated YouTube examples for "Hear It in Real Music" accordion
// Each category maps to an interactive resource component

export const audioExamples = {
  'delay': {
    title: 'Hear Delay in Real Music',
    playlistId: 'PL2A0IuN6DMDjvVhmK9wBt8ffW-Yf-Jia8',
    tracks: [
      {
        videoId: 'XA5HErVE9oI',
        title: 'Mystery Train',
        artist: 'Elvis Presley',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Classic slapback delay on vocals — a short single repeat creating the signature Sun Records rockabilly sound.',
      },
      {
        videoId: 'iIpfWORQWhU',
        title: 'I Ran (So Far Away)',
        artist: 'A Flock of Seagulls',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Lush multi-tap delay on guitar creating the iconic 80s shimmering texture. Listen for how the repeats stack up.',
      },
      {
        videoId: 'GzZWSrr5wFI',
        title: 'Where The Streets Have No Name',
        artist: 'U2',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'The Edge\'s signature dotted-eighth delay synced to tempo. The delay creates a rhythmic pattern that interlocks with the dry signal.',
      },
      {
        videoId: 'JRfuAukYTKg',
        title: 'Titanium',
        artist: 'David Guetta feat. Sia',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Delay on the vocal adds depth and space in the verse. Notice how it\'s pulled back in the chorus to keep things clean.',
      },
    ],
  },

  'distortion': {
    title: 'Hear Distortion in Real Music',
    playlistId: 'PL2A0IuN6DMDgd7bYBoks7kEZ44BunVwKQ',
    tracks: [
      {
        videoId: '_PVjcIO4MT4',
        title: 'Foxey Lady (Miami Pop 1968)',
        artist: 'The Jimi Hendrix Experience',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Fuzz pedal creating extreme harmonic content approaching a square wave. The Fuzz Face gives that dense, buzzy sustain.',
      },
      {
        videoId: 'IZBlqcbpmxY',
        title: 'Voodoo Child',
        artist: 'Jimi Hendrix',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Heavy fuzz distortion combined with wah-wah pedal. Listen for how the two effects interact — the wah sweeps the distorted harmonics.',
      },
    ],
  },

  'chorus': {
    title: 'Hear Chorus in Real Music',
    playlistId: 'PL2A0IuN6DMDgWoY1Psjp3206YsTN5IBRU',
    tracks: [
      {
        videoId: 'ZY1qz8F_-lk',
        title: 'Sugar Mice',
        artist: 'Marillion',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Rich chorus effect on the guitar creating a shimmering, doubled texture. The slight pitch modulation thickens the sound.',
      },
      {
        videoId: 'vabnZ9-ex7o',
        title: 'Come as You Are',
        artist: 'Nirvana',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'The iconic opening riff uses a chorus pedal (Electro-Harmonix Small Clone). Listen for the watery, modulated doubling effect.',
      },
      {
        videoId: 'MbXWrmQW-OE',
        title: 'Message in a Bottle',
        artist: 'The Police',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Andy Summers\' clean guitar tone uses chorus to create that wide, shimmering sound characteristic of early 80s guitar.',
      },
      {
        videoId: 'GK2P0RnMGNM',
        title: 'Continuum',
        artist: 'Jaco Pastorius',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Chorus on fretless bass — listen for how it adds width and movement to the sustained notes, creating an almost synth-like pad effect.',
      },
    ],
  },

  'flanger-phaser': {
    title: 'Hear Flanger/Phaser in Real Music',
    playlistId: 'PL2A0IuN6DMDgvYowhxbLy14XZovbTN8Z-',
    tracks: [
      {
        videoId: 'ZY77zDzNmYw',
        title: 'Station To Station',
        artist: 'David Bowie',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Phaser effect creating that sweeping, jet-like sound. Listen for the notches moving through the frequency spectrum.',
      },
      {
        videoId: 'yIFLJC1VXWI',
        title: 'Don\'t Panic',
        artist: 'Coldplay',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Subtle phaser on the acoustic guitar adding gentle movement and warmth to the strumming.',
      },
      {
        videoId: 'waAlgFq9Xq8',
        title: 'Peg',
        artist: 'Steely Dan',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Classic phaser on the electric guitar. Steely Dan\'s meticulous production makes the effect clearly audible.',
      },
      {
        videoId: 'HaA3YZ0OR94',
        title: 'Just the Way You Are',
        artist: 'Billy Joel',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Phaser on the Fender Rhodes electric piano creating a lush, swirling pad texture underneath the vocal.',
      },
    ],
  },

  'tremolo': {
    title: 'Hear Tremolo in Real Music',
    playlistId: 'PL2A0IuN6DMDj2gZZgOvQ5lm2LHiXVsHtu',
    tracks: [
      {
        videoId: 'qgDrpWWxuto',
        title: 'Bang Bang (My Baby Shot Me Down)',
        artist: 'Nancy Sinatra',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Tremolo on the guitar — the volume pulsing up and down at a regular rate. Creates that haunting, wavering quality.',
      },
      {
        videoId: 'Soa3gO7tL-c',
        title: 'Boulevard of Broken Dreams',
        artist: 'Green Day',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Tremolo on the clean guitar in the intro and verses. The rhythmic volume modulation adds movement to the sparse arrangement.',
      },
    ],
  },

  'filter-sweeps': {
    title: 'Hear Filter Sweeps in Real Music',
    playlistId: 'PL2A0IuN6DMDiauAJFUZU97WQ-dtBBCX_S',
    tracks: [
      {
        videoId: 'ZB_45GFCB50',
        title: 'Red Lights',
        artist: 'Tiesto',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Filter sweep building into the drop — the cutoff frequency rises, letting more high frequencies through, creating that classic EDM build-up.',
      },
      {
        videoId: 'VPRjCeoBqrI',
        title: 'A Sky Full of Stars',
        artist: 'Coldplay',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Filter sweep on the synth pad. Listen for the cutoff opening up gradually, adding brightness and energy.',
      },
      {
        videoId: 'wSUGOhQLabs',
        title: 'Sunny',
        artist: 'Boney M',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Auto-filter/envelope filter on the bass creating a funky, vowel-like sweep on each note.',
      },
      {
        videoId: 'igNBeo3QSqc',
        title: 'Groovejet (original mix)',
        artist: 'Spiller',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Classic house filter sweep — the low-pass filter opens and closes over the loop, shaping the energy of the track.',
      },
    ],
  },

  'low-pass-filter': {
    title: 'Hear Low Pass Filters in Real Music',
    playlistId: 'PL2A0IuN6DMDjeL5gFUnNGGsrv-KVn-gLm',
    tracks: [
      {
        videoId: 'Zo6UnKr6Bwg',
        title: 'Monument (The Inevitable End Version)',
        artist: 'Royksopp feat. Robyn',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Low-pass filter used to create a muffled, underwater feel before the full mix opens up. Classic arrangement technique.',
      },
      {
        videoId: 'szALnKOb_KQ',
        title: 'You Da One',
        artist: 'Rihanna',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Low-pass filter on the instrumental during the verse — the highs are rolled off to create space for the vocal.',
      },
      {
        videoId: 'J8wMGmafBvo',
        title: 'Wow',
        artist: 'Kylie Minogue',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Filter automation throughout — listen for how the brightness of the synth changes as the cutoff frequency moves.',
      },
    ],
  },

  'wah-wah': {
    title: 'Hear Wah Wah in Real Music',
    playlistId: 'PL2A0IuN6DMDihjquxKE6YjlfXOrgog78c',
    tracks: [
      {
        videoId: 'IZBlqcbpmxY',
        title: 'Voodoo Child (Slight Return)',
        artist: 'Jimi Hendrix',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'The definitive wah-wah guitar track. Hendrix sweeps the pedal expressively, creating vowel-like resonant peaks.',
      },
      {
        videoId: 'VR90gQ-SIaY',
        title: 'White Room',
        artist: 'Cream',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Eric Clapton\'s wah-wah in the bridge — a band-pass filter swept by foot pedal, creating the characteristic "wah" vocal quality.',
      },
      {
        videoId: 'sQH5Oaqbf0I',
        title: 'Small Town',
        artist: 'Morcheeba',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Subtle auto-wah on the guitar — an envelope-controlled filter that responds to pick dynamics rather than a foot pedal.',
      },
    ],
  },

  'vocoder': {
    title: 'Hear Vocoder in Real Music',
    playlistId: 'PL2A0IuN6DMDiXxyVFxDT-YdahJVf0rbQP',
    tracks: [
      {
        videoId: '1bGOgY1CmiU',
        title: 'I Just Called To Say I Love You',
        artist: 'Stevie Wonder',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Vocoder processing the vocal through a synth carrier signal. The speech patterns modulate the synth\'s frequency bands.',
      },
      {
        videoId: 'x-G28iyPtz0',
        title: 'Autobahn',
        artist: 'Kraftwerk',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Pioneering vocoder use — the robotic vocal sound that defined electronic music. Voice as a modulator for synthesised carriers.',
      },
      {
        videoId: 'UqyT8IEBkvY',
        title: '24K Magic',
        artist: 'Bruno Mars',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Modern vocoder/talk box effect on the vocal hook. Shows how the classic effect is still used in contemporary pop production.',
      },
      {
        videoId: 'EgqUJOudrcM',
        title: 'How Deep Is Your Love',
        artist: 'Calvin Harris & Disciples',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Vocoder-processed vocal creating a synthetic, filtered quality while retaining speech intelligibility.',
      },
    ],
  },

  'autotune': {
    title: 'Hear Autotune in Real Music',
    playlistId: 'PL2A0IuN6DMDhBxZDfqEz6LYZHfkPfoYDa',
    tracks: [
      {
        videoId: 'safkWMNJdDg',
        title: 'Believe',
        artist: 'Cher',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'The track that introduced the "Cher effect" — Auto-Tune set to zero retune speed, snapping pitch instantly for a robotic vocal quality.',
      },
      {
        videoId: 'dYMAo_yKEsQ',
        title: 'Monument (The Inevitable End Version)',
        artist: 'Royksopp feat. Robyn',
        timestamp: '0:00',
        timestampSeconds: 0,
        description: 'Subtle pitch correction creating an unnaturally smooth vocal. Compare this with the more extreme Cher effect above.',
      },
    ],
  },
};

// Helper: get examples for a specific category
export function getExamplesForCategory(category) {
  return audioExamples[category] || null;
}

// Helper: get examples for multiple categories (e.g. a synth explorer covering several instruments)
export function getExamplesForCategories(categories) {
  return categories
    .map(cat => audioExamples[cat])
    .filter(Boolean);
}
```

**Step 2: Verify the file loads without errors**

Run: `cd interactive-resources && node -e "const a = require('./lib/audio-examples.js'); console.log(Object.keys(a.audioExamples).length + ' categories loaded')"`

Note: This will fail with ESM. If using ESM, verify with: `node --input-type=module -e "import {audioExamples} from './lib/audio-examples.js'; console.log(Object.keys(audioExamples).length)"`

**Step 3: Commit**

```bash
git add lib/audio-examples.js
git commit -m "feat: add curated YouTube audio examples data for Hear It accordion"
```

---

### Task 2: Create the HearItAccordion component

**Files:**
- Create: `components/resources/HearItAccordion.jsx`

**Step 1: Create the component**

The component must:
- Use native `<details>/<summary>` for zero-dependency accordion
- Render YouTube embeds only when expanded (lazy loading)
- Match the existing theme (warm off-white, deep navy, white cards)
- Use inline styles consistent with other components in the project
- Include `rel=0` on YouTube embeds to prevent rabbit-holing
- Show track count badge
- Be fully self-contained and reusable

```jsx
'use client';

import { useState } from 'react';

const styles = {
  wrapper: {
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '24px',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(124, 58, 237, 0.04))',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1a1a2e',
    listStyle: 'none',
    userSelect: 'none',
  },
  summaryLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badge: {
    fontSize: '0.7rem',
    background: '#2563eb',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 500,
  },
  body: {
    padding: '8px 18px 16px',
    borderTop: '1px solid #e5e7eb',
  },
  track: {
    padding: '14px 0',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  trackLast: {
    padding: '14px 0',
    borderBottom: 'none',
  },
  trackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '4px',
  },
  trackTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: 0,
  },
  trackArtist: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: 400,
  },
  timestamp: {
    fontSize: '0.75rem',
    color: '#2563eb',
    fontWeight: 500,
    marginBottom: '6px',
  },
  description: {
    fontSize: '0.8rem',
    color: '#4a4f5a',
    lineHeight: 1.5,
    margin: 0,
  },
  embedContainer: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    borderRadius: '8px',
    marginBottom: '10px',
    background: '#0a0a0a',
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '8px',
  },
  playButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(37, 99, 235, 0.08)',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    borderRadius: '6px',
    color: '#2563eb',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '10px',
  },
};

export default function HearItAccordion({ title, tracks }) {
  const [expandedTrack, setExpandedTrack] = useState(null);

  if (!tracks || tracks.length === 0) return null;

  return (
    <details style={styles.wrapper}>
      <summary style={styles.summary}>
        <span style={styles.summaryLeft}>
          <span role="img" aria-label="headphones">🎧</span>
          {title}
          <span style={styles.badge}>{tracks.length} {tracks.length === 1 ? 'example' : 'examples'}</span>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>&#9660;</span>
      </summary>
      <div style={styles.body}>
        {tracks.map((track, i) => (
          <div
            key={track.videoId + i}
            style={i === tracks.length - 1 ? styles.trackLast : styles.track}
          >
            <div style={styles.trackHeader}>
              <div>
                <h4 style={styles.trackTitle}>
                  {track.title} <span style={styles.trackArtist}>— {track.artist}</span>
                </h4>
              </div>
            </div>
            {track.timestamp && (
              <div style={styles.timestamp}>&#9205; Listen from {track.timestamp}</div>
            )}
            {expandedTrack === i ? (
              <div style={styles.embedContainer}>
                <iframe
                  style={styles.iframe}
                  src={`https://www.youtube.com/embed/${track.videoId}?rel=0&start=${track.timestampSeconds || 0}`}
                  title={`${track.title} by ${track.artist}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <button
                style={styles.playButton}
                onClick={() => setExpandedTrack(i)}
              >
                &#9654; Play video
              </button>
            )}
            <p style={styles.description}>{track.description}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
```

**Step 2: Commit**

```bash
git add components/resources/HearItAccordion.jsx
git commit -m "feat: add reusable HearItAccordion component for YouTube examples"
```

---

### Task 3: Wire into CombinedDistortionLab

**Files:**
- Modify: `components/resources/CombinedDistortionLab.jsx`

**Step 1: Add imports at top of file**

After the existing imports, add:
```javascript
import HearItAccordion from './HearItAccordion';
import { audioExamples } from '../../lib/audio-examples';
```

**Step 2: Find the Learn tab content and add accordion at the bottom**

Search for the `<TabsContent value="learn">` section. After the last element inside it (before `</TabsContent>`), add:

```jsx
<HearItAccordion
  title={audioExamples['distortion'].title}
  tracks={audioExamples['distortion'].tracks}
/>
```

**Step 3: Verify locally**

Run: `npm run dev` (port 3002)
Navigate to: `http://localhost:3002/combined-distortion-lab`
- Confirm accordion appears at bottom of Learn tab, collapsed
- Click to expand — should show 2 tracks
- Click "Play video" — should embed YouTube player inline
- Confirm no layout breakage on other tabs

**Step 4: Commit**

```bash
git add components/resources/CombinedDistortionLab.jsx
git commit -m "feat: add Hear It accordion to Distortion Lab Learn tab"
```

---

### Task 4: Wire into DelayEffects

**Files:**
- Modify: `components/resources/DelayEffects.jsx`

**Step 1: Understand the DelayEffects structure**

This component does NOT use shadcn/ui tabs — it uses its own inline design system with CSS custom properties. Read the full component to find where the "learn" section content ends.

**Step 2: Add imports at top of file**

After the existing imports, add:
```javascript
import HearItAccordion from './HearItAccordion';
import { audioExamples } from '../../lib/audio-examples';
```

**Step 3: Find the learn section and add accordion**

Search for where the learn/overview content section ends in the component. Place the accordion after the last content block of that section:

```jsx
<HearItAccordion
  title={audioExamples['delay'].title}
  tracks={audioExamples['delay'].tracks}
/>
```

**Step 4: Verify locally**

Navigate to: `http://localhost:3002/delay-effects`
- Confirm accordion appears at bottom of the learn section
- Expand and verify 4 tracks show correctly
- Test video embed loads

**Step 5: Commit**

```bash
git add components/resources/DelayEffects.jsx
git commit -m "feat: add Hear It accordion to Delay Effects learn section"
```

---

### Task 5: Build and deploy

**Step 1: Run production build**

Run: `cd interactive-resources && npm run build`
Expected: Build succeeds with no errors

**Step 2: Verify build output mentions no warnings about the new files**

Check for any import or rendering warnings.

**Step 3: Commit any build fixes if needed**

**Step 4: Push to deploy**

```bash
git push
```

This will auto-deploy to music.mikelehnert.co.uk via Vercel.

**Step 5: Verify on production**

Navigate to:
- `https://music.mikelehnert.co.uk/combined-distortion-lab` — check accordion on Learn tab
- `https://music.mikelehnert.co.uk/delay-effects` — check accordion on learn section

---

## Phase 2 (Future — not this plan)

Roll out accordion to remaining components:
- `SubtractiveSynthExplorer.jsx` — multiple synth categories
- `FilterRolloffVisualization.jsx` — low pass filter + filter sweeps
- `AutoFilterImageExplorer.jsx` — filter sweeps
- Create new components or sections for: chorus, flanger/phaser, tremolo, wah wah, vocoder, autotune
- Add synth instrument playlists to synthesis topic pages (CS-80, Korg M1, Fairlight CMI, CR-78, TR-808, LM-1, etc.)
- Add timestamps to individual tracks where the effect is most audible
- Consider linking from revision page quiz feedback to relevant accordion
