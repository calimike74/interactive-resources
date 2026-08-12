'use client';

import { useState } from 'react';
import Callout from '@/components/Callout';

// ─── Shared style fragments (Botanical Press, matching MIDIBinaryAssessment.jsx) ─

const FRAUNCES = 'font-[family-name:var(--font-fraunces)]';
const MONO = 'font-[family-name:var(--font-jbmono)]';
const CARD_SHADOW = 'shadow-[0_1px_0_rgba(43,36,24,0.04),0_18px_40px_-24px_rgba(43,36,24,0.22)]';

const ACCENTS = {
  field: { stripe: 'border-t-field-500', badgeBg: 'bg-field-100', badgeText: 'text-field-700', text: 'text-field-700' },
  sienna: { stripe: 'border-t-sienna-500', badgeBg: 'bg-sienna-100', badgeText: 'text-sienna-700', text: 'text-sienna-700' },
  mustard: { stripe: 'border-t-mustard-500', badgeBg: 'bg-mustard-100', badgeText: 'text-mustard-700', text: 'text-mustard-700' },
};

function SectionHeader({ eyebrow, title, children }) {
  return (
    <div className="mb-6">
      <p className={`${MONO} text-xs uppercase tracking-wide text-sienna-600`}>{eyebrow}</p>
      <h2 className={`${FRAUNCES} mt-1 text-3xl font-medium text-ink sm:text-4xl`}>{title}</h2>
      {children && <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-ink/70">{children}</p>}
    </div>
  );
}

function ControllerCard({ accent, name, ccLabel, controls, range, example, uses, plain = false }) {
  const a = ACCENTS[accent];
  return (
    <div className={`rounded-2xl border border-line ${plain ? '' : `border-t-[3px] ${a.stripe}`} bg-paper p-5 ${CARD_SHADOW}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className={`${FRAUNCES} text-lg font-medium italic text-ink`}>{name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${plain ? 'bg-line/60 text-ink/70' : `${a.badgeBg} ${a.badgeText}`}`}>
          {ccLabel}
        </span>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">What it controls</p>
          <p className="text-ink/80">{controls}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">Value range</p>
          <p className={`${MONO} text-ink/80`}>{range}</p>
        </div>
        {example && (
          <div className="rounded-xl bg-cream/60 p-3">
            <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${plain ? 'text-ink/50' : a.text}`}>Production example</p>
            <p className="text-ink/80">{example}</p>
          </div>
        )}
        {uses && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">Common uses</p>
            <ul className="list-inside list-disc space-y-0.5 text-ink/80">
              {uses.map((u) => <li key={u}>{u}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Retrieval quiz ───────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    question: 'How many data bytes does a MIDI pitch bend message use to carry its value?',
    options: ['1', '2', '3', '14'],
    correct: 1,
    explanation: 'Two data bytes — an LSB and an MSB — carry the 14-bit value, after a single status byte (E0h–EFh) identifies the message as pitch bend on a given channel.',
  },
  {
    question: 'What is the pitch bend value at its centre, no-bend, position?',
    options: ['0', '127', '8192', '16383'],
    correct: 2,
    explanation: '8192 is exactly half of 16,384 (2¹⁴) — the middle of the 0–16,383 range, where the wheel sits at rest.',
  },
  {
    question: 'Pitch bend uses 14-bit resolution rather than the usual 7-bit. Why?',
    options: [
      'Because it needs to address 14 MIDI channels at once',
      'Because pitch is sensitive enough that 128 steps would sound audibly stepped',
      'Because it was designed to match 14-bit audio files',
      'Because filter sweeps need 14-bit precision',
    ],
    correct: 1,
    explanation: 'Human hearing is sensitive to small pitch changes. 7-bit gives only 128 steps, which produces an audible "zipper" as the pitch glides; 14-bit gives 16,384 steps — fine enough to sound continuous.',
  },
  {
    question: 'A synthesiser’s Pitch Bend Range is set to 7 semitones. What does this allow?',
    options: [
      'Bending up or down by up to 7 semitones (a perfect fifth) from the held note',
      'Bending only upward, never downward',
      'A fixed 7-semitone transposition of every note played',
      'Seven different pitch bend curves to choose between',
    ],
    correct: 0,
    explanation: 'The range value is symmetric — it sets the maximum bend in either direction from the held note. At 7 semitones, pushing the wheel fully up bends a perfect fifth sharp; pulling it fully down bends a perfect fifth flat.',
  },
  {
    question: 'Which of these is NOT a standard General MIDI CC assignment?',
    options: ['CC1 — Modulation', 'CC7 — Volume', 'CC64 — Sustain', 'CC100 — Reverb Depth'],
    correct: 3,
    explanation: 'CC100 isn’t one of the standard controller assignments covered here. CC1 (modulation), CC7 (volume) and CC64 (sustain) are fixed General MIDI assignments worth memorising alongside CC10 (pan), CC11 (expression) and CC74 (filter cutoff).',
  },
];

function RetrievalQuiz() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = Object.values(answers).filter((a, i) => a === QUIZ_QUESTIONS[i]?.correct).length;
  const allAnswered = Object.keys(answers).length >= QUIZ_QUESTIONS.length;

  return (
    <div className="mt-4">
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q, qi) => (
          <div key={qi} className="rounded-2xl border border-line bg-paper p-5">
            <p className="mb-3 text-sm font-semibold text-ink">{qi + 1}. {q.question}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const isCorrect = oi === q.correct;
                let cls = 'border-line bg-cream/50 text-ink/80 hover:border-sienna-200 hover:bg-sienna-50';
                if (submitted) {
                  if (isCorrect) cls = 'border-emerald-400 bg-emerald-50 text-emerald-900';
                  else if (selected) cls = 'border-rose-400 bg-rose-50 text-rose-900';
                } else if (selected) {
                  cls = 'border-sienna-500 bg-sienna-50 text-ink';
                }
                return (
                  <button type="button"
                    key={oi}
                    disabled={submitted}
                    onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs leading-relaxed text-ink/70">
                {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        {!submitted ? (
          <button type="button"
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="rounded-full bg-field-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-field-600 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/40"
          >
            Check answers
          </button>
        ) : (
          <p className={`text-base font-semibold ${score === QUIZ_QUESTIONS.length ? 'text-field-700' : 'text-sienna-700'}`}>
            {score}/{QUIZ_QUESTIONS.length} correct{score === QUIZ_QUESTIONS.length && ' — every one.'}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MIDIPitchBendController() {
  const [pitchBendValue, setPitchBendValue] = useState(8192); // Centre position
  const [pitchBendRange, setPitchBendRange] = useState(2); // Semitones

  const calculatePitchBend = () => {
    let normalizedValue;
    if (pitchBendValue >= 8192) {
      normalizedValue = (pitchBendValue - 8192) / 8191;
    } else {
      normalizedValue = (pitchBendValue - 8192) / 8192;
    }
    return (normalizedValue * pitchBendRange).toFixed(2);
  };

  const calculateNote = (baseNote = 'E4') => {
    const semitonesBent = parseFloat(calculatePitchBend());
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseNoteIndex = 4;
    const baseOctave = 4;
    const totalSemitones = baseOctave * 12 + baseNoteIndex + semitonesBent;
    const newOctave = Math.floor(totalSemitones / 12);
    let newNoteIndex = Math.round(totalSemitones % 12);
    if (newNoteIndex < 0) newNoteIndex += 12;
    return notes[newNoteIndex] + newOctave;
  };

  const get14BitBytes = () => {
    const lsb = pitchBendValue & 0x7F;
    const msb = (pitchBendValue >> 7) & 0x7F;
    return { lsb, msb };
  };

  const { lsb, msb } = get14BitBytes();
  const bendAmount = calculatePitchBend();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero — a functional 14-bit bend-wheel motif (CSS/SVG, house palette)
          replaces the cold blue server-room/binary stock image. The wheel
          sits at centre (8192 = 0b10000000000000), which is exactly what
          the simulator below opens on. */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginBottom: '1.5rem',
        minHeight: '240px',
        background: '#0d0b08',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 30%, rgba(184,90,63,0.22) 0%, transparent 65%)',
        }} aria-hidden="true" />
        <div style={{
          position: 'relative',
          maxWidth: '760px', margin: '0 auto',
          padding: '2.75rem 1.5rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.75rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontSize: '2.25rem',
              fontWeight: 500,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              MIDI Pitch Bend &amp; Controller
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              maxWidth: '480px', margin: '0 auto',
            }}>
              An interactive guide to pitch bend data, 14-bit resolution, and MIDI controller messages.
            </p>
          </div>

          <svg
            viewBox="0 0 420 150"
            style={{ width: '100%', maxWidth: 380, height: 'auto' }}
            role="img"
            aria-label="A pitch bend wheel at its centre rest position, reading 8192 -- binary 10000000000000, 14 bits, split into MSB 64 and LSB 0."
          >
            <title>The pitch bend wheel at centre: 8192</title>
            <rect x="26" y="10" width="34" height="130" rx="17" fill="none" stroke="#B85A3F" strokeWidth="2" />
            <line x1="43" y1="10" x2="43" y2="26" stroke="#B85A3F" strokeWidth="1.5" opacity="0.6" />
            <line x1="43" y1="124" x2="43" y2="140" stroke="#B85A3F" strokeWidth="1.5" opacity="0.6" />
            <circle cx="43" cy="75" r="15" fill="#B85A3F" />
            <circle cx="43" cy="75" r="15" fill="none" stroke="#F2EBE0" strokeWidth="1.5" opacity="0.5" />
            <text x="10" y="24" fill="rgba(242,235,224,0.55)" fontSize="11" fontFamily="var(--font-jbmono), ui-monospace, monospace" textAnchor="middle">+1</text>
            <text x="10" y="130" fill="rgba(242,235,224,0.55)" fontSize="11" fontFamily="var(--font-jbmono), ui-monospace, monospace" textAnchor="middle">−1</text>

            <g fontFamily="var(--font-jbmono), ui-monospace, monospace">
              <text x="90" y="46" fill="#F2EBE0" fontSize="12" opacity="0.6">14-BIT VALUE · CENTRE</text>
              <text x="90" y="80" fill="#ffffff" fontSize="30" fontWeight="700">8192</text>
              <text x="90" y="106" fill="#DCC892" fontSize="15" letterSpacing="1">10000000000000</text>
              <text x="90" y="130" fill="rgba(242,235,224,0.55)" fontSize="12">MSB 64 · LSB 0</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">

        {/* ─── Section 1: Pitch Bend Data ────────────────────────────────── */}
        <section className="pt-2">
          <SectionHeader eyebrow="1.5 Sequencing" title="Pitch Bend Data">
            A pitch wheel lets a performer bend a note's pitch smoothly, in real time. To keep that glide
            free of audible steps, MIDI gives pitch bend its own message type — and 14 bits of resolution
            instead of the usual 7.
          </SectionHeader>

          {/* Interactive simulator — the working engine, kept verbatim */}
          <div className={`rounded-2xl border border-line bg-paper p-5 sm:p-6 ${CARD_SHADOW}`}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    Move the pitch bend wheel
                  </label>
                  <input aria-label="Pitch Bend Wheel"
                    type="range"
                    min="0"
                    max="16383"
                    value={pitchBendValue}
                    onChange={(e) => setPitchBendValue(parseInt(e.target.value, 10))}
                    className="w-full accent-sienna-500"
                    style={{
                      background: `linear-gradient(to right,
                        #E5B097 0%,
                        #C99F44 ${((pitchBendValue / 16383) * 100)}%,
                        #EBE0BE ${((pitchBendValue / 16383) * 100)}%,
                        #E5B097 100%)`,
                      height: '10px',
                      borderRadius: '999px',
                      appearance: 'none',
                      cursor: 'pointer',
                    }}
                  />
                  <div className="mt-1 flex justify-between text-xs text-ink/50">
                    <span>Down (0)</span>
                    <span>Centre (8192)</span>
                    <span>Up (16383)</span>
                  </div>
                </div>

                {/* Compact live readout — mobile only. The full "Current
                    Values" card is the second grid column, which stacks
                    far below the wheel on a phone; without this, dragging
                    the wheel gives zero visible feedback until you scroll.
                    This is what keeps the wheel and its byte readout
                    co-visible at 390px without a scroll. */}
                <div className={`${MONO} flex items-center justify-center gap-2 rounded-xl bg-cream px-4 py-3 text-sm md:hidden`} aria-live="polite">
                  <span className="font-bold text-ink">{pitchBendValue}</span>
                  <span className="text-ink/40">→</span>
                  <span className="font-bold text-sienna-700">{bendAmount > 0 ? '+' : ''}{bendAmount}&nbsp;st</span>
                  <span className="text-ink/40">→</span>
                  <span className="text-base font-bold text-field-700">{calculateNote()}</span>
                </div>

                <button type="button"
                  onClick={() => setPitchBendValue(8192)}
                  className="w-full rounded-full border border-line bg-cream py-2 text-sm font-semibold text-ink transition hover:border-sienna-300 hover:bg-sienna-50"
                >
                  Reset to centre
                </button>

                <div className="rounded-xl bg-cream p-4">
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    Pitch bend range (semitones)
                  </label>
                  <p className="mb-3 text-xs text-ink/60">
                    This is the setting you would change on your synthesiser's global settings page —
                    see Range &amp; Bending below.
                  </p>
                  <input aria-label="Pitch Bend Range"
                    type="range"
                    min="1"
                    max="24"
                    value={pitchBendRange}
                    onChange={(e) => setPitchBendRange(parseInt(e.target.value, 10))}
                    className="w-full accent-field-500"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xl font-bold text-field-700">{pitchBendRange} semitones</span>
                    <span className={`${MONO} text-xs text-ink/50`}>({(pitchBendRange / 12).toFixed(1)} octaves)</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="rounded-xl bg-cream p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">Current values</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-paper p-3">
                      <div className="text-xs text-ink/50">14-bit MIDI value</div>
                      <div className={`${MONO} text-2xl font-bold text-sienna-700`}>{pitchBendValue}</div>
                    </div>
                    <div className="rounded-lg bg-paper p-3">
                      <div className="text-xs text-ink/50">Pitch bend amount</div>
                      <div className={`${MONO} text-2xl font-bold text-field-700`}>
                        {bendAmount > 0 ? '+' : ''}{bendAmount} semitones
                      </div>
                    </div>
                    <div className="rounded-lg bg-paper p-3">
                      <div className="text-xs text-ink/50">Starting from E4, you're now at</div>
                      <div className={`${FRAUNCES} text-2xl font-medium italic text-ink`}>{calculateNote()}</div>
                    </div>
                    <div className="rounded-lg bg-paper p-3">
                      <div className="mb-1 text-xs text-ink/50">Three MIDI bytes</div>
                      <div className={`${MONO} text-sm`}>
                        <span className="font-semibold text-sienna-700">E0</span> <span className="text-ink/50">status: pitch bend, channel 1</span>
                      </div>
                      <div className={`${MONO} text-sm`}>
                        <span className="font-semibold text-field-700">LSB: {lsb}</span> <span className="text-ink/50">least significant byte</span>
                      </div>
                      <div className={`${MONO} text-sm`}>
                        <span className="font-semibold text-mustard-700">MSB: {msb}</span> <span className="text-ink/50">most significant byte</span>
                      </div>
                      <p className="mt-2 text-xs italic text-ink/50">
                        Status bytes E0h–EFh represent pitch bend on channels 1–16.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Callout type="definition" title="Pitch bend resolution">
              Pitch bend is the one common MIDI message that uses 14-bit resolution instead of the usual
              7-bit. 2<sup>14</sup> = 16,384 possible values (0–16,383), giving a smooth glide with no
              audible "steps". The centre — no bend at all — sits exactly halfway, at 8192.
            </Callout>

            <Callout type="question" title="A pitch bend message carries the value 16383 — full bend up. What are its LSB and MSB bytes?">
              <Callout.Options
                options={['LSB 127, MSB 127', 'LSB 0, MSB 127', 'LSB 127, MSB 0', 'LSB 255, MSB 255']}
                correctIndex={0}
                explanation="16383 in binary is fourteen 1s. Split into two 7-bit bytes, the lower 7 bits (127) become the LSB and the upper 7 bits (127) become the MSB. A MIDI data byte is 7-bit, so it can never reach 255."
              />
            </Callout>

            <Callout type="tip" title="2024 Q1(b)">
              2024's Q1(b) asked exactly this, across three one-mark parts: how many bytes MIDI uses for
              pitch bend, the value at the centre position, and how 16383 is transmitted as LSB/MSB. All
              three are questions about representation, not musicality — get the numbers automatic and
              they're free marks.
            </Callout>

            <Callout type="tip" title="The signed-range version" defaultOpen={false}>
              Some mark schemes describe this same 14-bit space as running from −8192 to +8191 rather
              than 0 to 16,383 (2023 Q2(b)). It's the identical 16,384 values — just counted outward from
              centre instead of up from zero. Recognise both framings.
            </Callout>
          </div>
        </section>

        <hr className="my-10 border-line" />

        {/* ─── Section 2: Range & Bending ─────────────────────────────────── */}
        <section>
          <SectionHeader eyebrow="1.5 Sequencing" title="Range & Bending">
            The 14-bit value above is only half the story. What it actually does to the pitch depends on
            a separate setting — the pitch bend range — configured on the synthesiser or plugin, not
            inside the MIDI data itself.
          </SectionHeader>

          <Callout type="definition" title="Pitch bend range">
            The number of semitones the wheel's full travel represents. It's a setting on the instrument,
            usually shown in semitones (2 is a common default) — not part of the pitch bend message
            itself. The same value from the simulator above (say, full-up at 16383) means a small nudge
            at a 2-semitone range and a full octave leap at a 12-semitone range.
          </Callout>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { st: '2', title: '2 semitones', uses: ['Subtle bass slides', 'Realistic guitar bends', 'Standard default for most synth playing'] },
              { st: '7', title: '7 semitones', uses: ['Perfect-fifth bends, either direction', 'Dramatic pitch dives', 'Blues-style wide bends'] },
              { st: '12', title: '12 semitones', uses: ['Full octave bends', 'Theremin-style playing', 'Experimental / ambient effects'] },
            ].map((r) => (
              <div key={r.st} className="rounded-xl border border-line bg-paper p-4">
                <div className={`${MONO} text-2xl font-bold text-sienna-700`}>{r.st}</div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">{r.title}</div>
                <ul className="list-inside list-disc space-y-0.5 text-sm text-ink/70">
                  {r.uses.map((u) => <li key={u}>{u}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">Drawing a specific bend</h3>
            <p className="mb-4 text-sm leading-relaxed text-ink/70">
              The method is the same wherever you produce: set the instrument's pitch bend range, then
              draw a pitch bend automation lane (sometimes called an envelope or MIDI CC lane) from
              centre towards the top or bottom of its range. A ramp to the very top or bottom uses the
              full range you set; a ramp only halfway there bends by half that amount.
            </p>
            <ol className="list-inside list-decimal space-y-1.5 text-sm text-ink/80">
              <li>Set the instrument's <strong>global pitch bend range</strong> to the number of semitones you want available.</li>
              <li>Open the pitch bend automation lane for your MIDI clip or track.</li>
              <li>Draw a ramp from the centre line to the top (bend up) or bottom (bend down) of the lane.</li>
              <li>A ramp to a point partway up or down bends by that same proportion of the range you set.</li>
            </ol>
            <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-ink/60">
              <p><strong className="text-ink/80">In Ableton Live:</strong> open the clip's Envelope Editor and choose "MIDI Ctrl" → "Pitch Bend" from the dropdown, then draw the ramp.</p>
              <p><strong className="text-ink/80">In Logic Pro:</strong> open the Piano Roll's MIDI Draw pane (or an automation lane) and choose Pitch Bend, then draw the same shape.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Callout type="question" title="A synth's Pitch Bend Range is set to 12 semitones. The wheel is pushed fully up (16383). How far does the pitch actually bend?">
              <Callout.Options
                options={['+2 semitones', '+6 semitones', '+12 semitones', '+24 semitones']}
                correctIndex={2}
                explanation="The range setting defines what the wheel's extremes mean. 16383 is the top of the wheel's travel, so at a 12-semitone range it bends the full 12 semitones — one octave up."
              />
            </Callout>

            <Callout type="listen" title="Try it yourself" collapsible={false}>
              Set the range slider in the simulator above to 12, then drag the bend wheel to its maximum.
              Watch the note readout jump a full octave — then bring the range back down to 2 and repeat
              the same wheel movement.
            </Callout>
          </div>
        </section>

        <hr className="my-10 border-line" />

        {/* ─── Section 3: MIDI Controllers ────────────────────────────────── */}
        <section>
          <SectionHeader eyebrow="1.5 Sequencing" title="MIDI Controllers">
            Beyond pitch bend, MIDI Control Change (CC) messages report a continuous parameter — a
            controller number identifying which control, and a value showing its position. Unlike pitch
            bend, CC data is 7-bit: coarser resolution than pitch bend needs, but plenty for something
            like a mod wheel or a volume fader.
          </SectionHeader>

          <Callout type="definition" title="MIDI CC (Control Change)">
            A Control Change message carries a controller number (0–127, identifying which control —
            modulation, volume, pan…) and a value (0–127, its current position). CC data is always 7-bit:
            128 steps is fine for something like a mod wheel, but too coarse for pitch bend, which is why
            pitch bend has its own 14-bit message type instead.
          </Callout>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <ControllerCard
              accent="field"
              name="CC 1 — Modulation Wheel"
              ccLabel="CC 1"
              controls="Usually adds vibrato (pitch wobble) or another modulation effect to the sound — the exact effect depends on how the instrument is programmed."
              range="0–127 (7-bit)"
              example="Expressive lead synth: draw a gradual increase in CC1 during a held note to add vibrato that builds intensity — clean at first, then wobbling in, the way a singer or guitarist would do it naturally."
              uses={['Adding vibrato to synth leads', 'Wobbly LFO-style effects', 'Filter modulation depth']}
            />
            <ControllerCard
              accent="sienna"
              name="CC 7 — Volume"
              ccLabel="CC 7"
              controls="Sets the overall volume of the MIDI channel. Different from velocity — this affects every note on the track, not just the one it's attached to."
              range="0–127 (0 = silent, 127 = full volume)"
              example="Dynamic string swells: automate CC7 from 30 up to 110 over four bars for a crescendo. This is smoother than clip-volume automation because it happens at the MIDI level, ahead of the instrument."
              uses={['Volume swells and fades', 'Balancing instrument layers', 'Ducking effects']}
            />
            <ControllerCard
              accent="mustard"
              name="CC 10 — Pan"
              ccLabel="CC 10"
              controls="Sets the stereo position (left/right) of the sound, adding width and space to a mix."
              range="0–127 (0 = hard left, 64 = centre, 127 = hard right)"
              example="Auto-pan: draw a repeating wave in CC10 between 0 and 127 to make a hi-hat pattern bounce between speakers, adding movement to a static rhythm part."
              uses={['Stereo movement / auto-pan', 'Positioning instruments in the mix', 'Adding spatial interest']}
            />
            <ControllerCard
              accent="field"
              name="CC 11 — Expression"
              ccLabel="CC 11"
              controls="Similar to volume, but designed for real-time performance changes on top of the track's base level — a 'performance intensity' control, like bow pressure on a violin."
              range="0–127, affects volume separately from CC7"
              example="Realistic orchestral dynamics: draw CC11 higher for forte phrases and lower for piano ones — more realistic than velocity alone, which only sets loudness at the start of each note."
              uses={['Orchestral library dynamics', 'Real-time performance intensity', 'Breath-controller simulation']}
            />
            <ControllerCard
              accent="sienna"
              name="CC 74 — Filter Cutoff / Brightness"
              ccLabel="CC 74"
              controls="Sets the filter cutoff frequency, which controls how bright or dark the sound is. Lower values are darker; higher values are brighter."
              range="0–127 (0 = dark/closed filter, 127 = bright/open filter)"
              example="Filter sweep build-up: start CC74 at 20 (dark, muffled) and automate it up to 110 over eight bars as a breakdown builds toward the drop — a classic EDM/house technique."
              uses={['Filter sweep effects', 'Build-ups and drops', 'Controlling synth brightness']}
            />
            <ControllerCard
              accent="mustard"
              plain
              name="Velocity — not a CC"
              ccLabel="0–127"
              controls="Velocity is not a Control Change message — it's carried inside the Note On message itself, representing how hard a key was struck."
              range="0–127 (0 = softest, 127 = hardest)"
              example="Unlike CC data, velocity is set once when the note starts and doesn't change while the note sounds — though some DAWs let you edit velocity per note after the fact."
              uses={null}
            />
          </div>

          <div className="mt-6 space-y-4">
            <Callout type="question" title="Which MIDI CC number is the standard assignment for the sustain pedal?">
              <Callout.Options
                options={['CC1', 'CC7', 'CC64', 'CC74']}
                correctIndex={2}
                explanation="CC64 is the General MIDI sustain pedal assignment — values 64–127 hold the sustain on, 0–63 release it. CC1 is modulation, CC7 is volume, CC74 is filter cutoff."
              />
            </Callout>

            <Callout type="tip" title="7-bit velocity">
              Note velocity uses the same logic in miniature: 7 bits, 2⁷ = 128 values, 0–127 — which is
              why a fact like "127 is the loudest a note can be struck" (2021 Q2(b), 2 marks) always
              traces back to the bit count, not a musical decision.
            </Callout>

            <Callout type="tip" title="Naming the messages" defaultOpen={false}>
              2019's Q2(b) asked for three MIDI messages other than Note On/Off, worth 3 marks.
              Everything on this page qualifies: Pitch Bend and any of the five Control Change types
              above.
            </Callout>
          </div>
        </section>

        <hr className="my-10 border-line" />

        {/* ─── Retrieval quiz ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader eyebrow="Quick check" title="Retrieval quiz">
            Five questions across everything above. Answer all five, then check.
          </SectionHeader>
          <RetrievalQuiz />
        </section>

      </div>
    </div>
  );
}
