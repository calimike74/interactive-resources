# Product

## Register

product

## Users

A-Level Music Technology students (Pearson Edexcel — Component 4 *Producing and analysing*, and Component 3 from 2026–27) who are revising, learning a new topic, or practising for assessment. A secondary teacher view supports lesson use and progress oversight.

Context of use is split: independent revision at home and live use within 40-minute lessons, frequently on a phone (the app ships as an iOS build via Capacitor and leads with a bottom tab bar). Sessions are short and goal-directed — "understand this concept", "practise this question type", "check what I've forgotten" — rather than open-ended browsing.

## Product Purpose

Interactive tools that pair authoritative reading with active interaction and retrieval practice, turning abstract Music Technology concepts (synthesis, EQ, compression, delay, signal flow, acoustics) into things a student can manipulate and feel. The guiding model is **read → interact → retrieve**: conceptual preparation first, hands-on exploration second, spaced retrieval to make it stick.

Success looks like a student arriving at the exam with intuition, not just recall — having *built* the mental model through interaction rather than only having read about it.

## Brand Personality

**Warm · crafted · trustworthy.**

The voice is that of a knowledgeable, calm teacher who respects the student's intelligence: precise without being cold, encouraging without being childish. The interface should feel hand-made and considered — an analog, editorial warmth (paper textures, a classic serif, an earthy palette) rather than a slick SaaS product or a gamified app. Emotionally it should evoke confidence and calm focus: the reassurance of a well-made instrument you can trust.

## Anti-references

- **Generic AI-template / neobrutalism.** No harsh borders, clashing bright accents, sticker-like drop shadows, or default training-data fonts. Specifically excludes punchy / playful / deliberately anti-aesthetic styling.
- **Childish edtech.** No cartoon mascots, primary-colour blocks, or gamified-badge clutter. The tone is credibly A-Level, not primary-school.
- (Watch also: cold corporate-SaaS dashboards, and over-used editorial-magazine cliché — display-serif + italic + drop-caps + broadsheet grid — on screens that aren't genuinely long-form.)

## Design Principles

1. **Read, then interact.** Interaction extends understanding; it never replaces the conceptual reading that should precede it. Tools assume the student arrives with vocabulary primed.
2. **Desirable difficulty over hand-holding.** Make the student do the cognitive work — guided inquiry, not step-by-step spoon-feeding. Friction that aids learning is a feature.
3. **Exam-aligned, always.** Every tool maps to the Edexcel specification and an assessment lens. Nothing exists as decoration only.
4. **Quiet credibility.** Trust is earned through clarity and correctness, not flash. The interface should read as a well-made instrument, not a toy.
5. **Practise the craft it teaches.** This is a music-technology tool; its own motion, timing, and finish should model the care and precision the subject demands.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA**.
- **Reduced motion** is honoured (already enforced in `globals.css`); decorative animation collapses to instant, looping motion stops.
- Type and contrast must hold up in two very different conditions: a phone screen in a student's hand and a projector at the front of a classroom.
- Avoid conveying meaning by colour alone (relevant given the three-accent palette).
