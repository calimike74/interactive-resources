// The MIDI Exam Bench's marking maths. One rule above all: the 14-bit and
// pitch-bend conventions here MUST match the flagship page
// (components/resources/MIDIPitchBendController.jsx, WO-06) byte for byte —
// one site, one set of MIDI maths. Its conventions: lsb = value & 0x7F,
// msb = (value >> 7) & 0x7F; bend normalises upward over 8191 and downward
// over 8192 (the asymmetry of a 14-bit range centred on 8192).
// Dependency-free for `node --test` (tests/midi-engine.test.mjs).

/** 0-127 → seven-character binary string (the width of a MIDI data byte). */
export function toBinary7(n) {
    return n.toString(2).padStart(7, '0');
}

/** Seven-character binary string → decimal. */
export function fromBinary7(bits) {
    return parseInt(bits, 2);
}

/** 14-bit value (0-16383) → its two 7-bit data bytes. */
export function split14(value) {
    return { lsb: value & 0x7f, msb: (value >> 7) & 0x7f };
}

/** Two 7-bit data bytes → the 14-bit value. */
export function combine14(msb, lsb) {
    return (msb << 7) | lsb;
}

/** Pitch-bend value + range setting (semitones) → the sounding offset. */
export function bendSemitones(value, rangeSemitones) {
    const normalised = value >= 8192 ? (value - 8192) / 8191 : (value - 8192) / 8192;
    return normalised * rangeSemitones;
}

/**
 * Length of one division at a tempo, in milliseconds.
 * `division` is the note denominator (4 = crotchet, 8 = quaver, 16 =
 * semiquaver); `feel` is 'straight' | 'dotted' | 'triplet'.
 */
export function divisionMs(bpm, division, feel = 'straight') {
    const straight = (60000 / bpm) * (4 / division);
    if (feel === 'dotted') return straight * 1.5;
    if (feel === 'triplet') return (straight * 2) / 3;
    return straight;
}
