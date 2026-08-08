'use client';

import React, { useState } from 'react';
import { Music, Sliders, Info, BookOpen, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

export default function MIDIPitchBendController() {
  const [activeTab, setActiveTab] = useState('pitchbend');
  const [pitchBendValue, setPitchBendValue] = useState(8192); // Center position
  const [pitchBendRange, setPitchBendRange] = useState(2); // Semitones
  const [expandedSections, setExpandedSections] = useState({
    bytes: true,
    resolution: false,
    range: false
  });

  // Calculate actual pitch bend in semitones based on value and range
  const calculatePitchBend = () => {
    let normalizedValue;
    if (pitchBendValue >= 8192) {
      // Upward bend: 8192 to 16383 maps to 0 to +1
      normalizedValue = (pitchBendValue - 8192) / 8191;
    } else {
      // Downward bend: 0 to 8192 maps to -1 to 0
      normalizedValue = (pitchBendValue - 8192) / 8192;
    }
    return (normalizedValue * pitchBendRange).toFixed(2);
  };

  // Calculate note name based on pitch bend
  const calculateNote = (baseNote = 'E4') => {
    const semitonesBent = parseFloat(calculatePitchBend());
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // E4 is index 4 in octave 4
    const baseNoteIndex = 4; // E is the 5th note (index 4)
    const baseOctave = 4;

    // Calculate total semitones from C0
    const totalSemitones = baseOctave * 12 + baseNoteIndex + semitonesBent;

    // Calculate new octave and note index
    const newOctave = Math.floor(totalSemitones / 12);
    let newNoteIndex = Math.round(totalSemitones % 12);

    // Handle negative modulo
    if (newNoteIndex < 0) {
      newNoteIndex += 12;
    }

    return notes[newNoteIndex] + newOctave;
  };

  // Convert 14-bit value to two 7-bit bytes
  const get14BitBytes = () => {
    const lsb = pitchBendValue & 0x7F; // Least Significant Byte (lower 7 bits)
    const msb = (pitchBendValue >> 7) & 0x7F; // Most Significant Byte (upper 7 bits)
    return { lsb, msb };
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const { lsb, msb } = get14BitBytes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-mustard-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero with video background */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginBottom: '1.5rem',
          minHeight: '240px',
        }}>
          <video aria-hidden="true"
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={(e) => {
              e.target.style.opacity = 1;
              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) e.target.pause();
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0,
              transition: 'opacity 0.8s ease-out',
            }}
            src="/midi-hero.mp4"
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
          }} />
          <div style={{
            position: 'relative',
            maxWidth: '640px', margin: '0 auto',
            padding: '3rem 1.5rem 2.5rem',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '1rem',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              MIDI Pitch Bend & Controller
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              maxWidth: '480px', margin: '0 auto',
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>
              An interactive guide to pitch bend data, 14-bit resolution, and MIDI controller messages.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button type="button"
              onClick={() => setActiveTab('pitchbend')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'pitchbend'
                  ? 'text-mustard-600 border-b-2 border-mustard-600 bg-mustard-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Task 1A & 1B: Pitch Bend Data
            </button>
            <button type="button"
              onClick={() => setActiveTab('controllers')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'controllers'
                  ? 'text-mustard-600 border-b-2 border-mustard-600 bg-mustard-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Task 1C: MIDI Controllers
            </button>
          </div>
        </div>

        {/* Task 1A & 1B: Pitch Bend Content */}
        {activeTab === 'pitchbend' && (
          <div className="space-y-6">
            {/* Interactive Pitch Bend Simulator */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-6 h-6 text-mustard-600" />
                <h2 className="text-2xl font-bold text-gray-800">Interactive Pitch Bend Simulator</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pitch Bend Control */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Move the Pitch Bend Wheel
                    </label>
                    <input aria-label="Pitch Bend Wheel"
                      type="range"
                      min="0"
                      max="16383"
                      value={pitchBendValue}
                      onChange={(e) => setPitchBendValue(parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-300 via-mustard-300 to-blue-300 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          #93c5fd 0%,
                          #c4b5fd ${((pitchBendValue / 16383) * 100)}%,
                          #e0e7ff ${((pitchBendValue / 16383) * 100)}%,
                          #93c5fd 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Down (0)</span>
                      <span>Center (8192)</span>
                      <span>Up (16383)</span>
                    </div>
                  </div>

                  <button type="button"
                    onClick={() => setPitchBendValue(8192)}
                    className="w-full bg-mustard-100 hover:bg-mustard-200 text-mustard-700 font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Reset to Center
                  </button>

                  {/* Pitch Bend Range Control */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pitch Bend Range (Semitones)
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      This is the setting you'd change on your synthesiser's global settings page
                    </p>
                    <input aria-label="Pitch Bend Range"
                      type="range"
                      min="1"
                      max="24"
                      value={pitchBendRange}
                      onChange={(e) => setPitchBendRange(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-2xl font-bold text-mustard-600">{pitchBendRange} semitones</span>
                      <span className="text-sm text-gray-600">({(pitchBendRange / 12).toFixed(1)} octaves)</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Display */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-mustard-100 to-blue-100 p-6 rounded-lg">
                    <h3 className="font-bold text-gray-700 mb-3">Current Values</h3>

                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded">
                        <div className="text-sm text-gray-600">14-bit MIDI Value</div>
                        <div className="text-2xl font-bold text-mustard-600">{pitchBendValue}</div>
                      </div>

                      <div className="bg-white p-3 rounded">
                        <div className="text-sm text-gray-600">Pitch Bend Amount</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {calculatePitchBend() > 0 ? '+' : ''}{calculatePitchBend()} semitones
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded">
                        <div className="text-sm text-gray-600">Starting from E4, you're now at:</div>
                        <div className="text-3xl font-bold text-mustard-700">{calculateNote()}</div>
                      </div>

                      <div className="bg-white p-3 rounded">
                        <div className="text-sm text-gray-600">Three MIDI Bytes</div>
                        <div className="font-mono text-sm mt-1">
                          <span className="text-mustard-600">E0</span> <span className="text-gray-500">(Status: Pitch Bend, Channel 1)</span>
                        </div>
                        <div className="font-mono text-sm">
                          <span className="text-blue-600">LSB: {lsb}</span> <span className="text-gray-500">(Least Significant Byte)</span>
                        </div>
                        <div className="font-mono text-sm">
                          <span className="text-green-600">MSB: {msb}</span> <span className="text-gray-500">(Most Significant Byte)</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 italic">
                          Note: Status bytes E0-EF represent pitch bend on channels 1-16
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task 1A: Technical Specifications */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Task 1A: How MIDI Transmits Pitch Bend Data</h2>
              </div>

              {/* Question 1: Bytes */}
              <div className="mb-6">
                <button type="button"
                  onClick={() => toggleSection('bytes')}
                  className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors"
                >
                  <h3 className="font-bold text-gray-800">1. How many bytes does MIDI use?</h3>
                  {expandedSections.bytes ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSections.bytes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                      <div className="font-semibold text-mustard-700 mb-2">Answer:</div>
                      <p className="text-gray-700 mb-3">
                        MIDI uses <strong>THREE bytes total</strong> to transmit pitch bend data:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>1 Status byte</strong> (E0h) - identifies this as a pitch bend message</li>
                        <li><strong>2 Data bytes</strong> - carry the actual pitch bend value (LSB and MSB)</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-mustard-500">
                      <div className="font-semibold text-mustard-700 mb-2">Why does pitch bend need more bytes?</div>
                      <p className="text-gray-700 mb-2">
                        Pitch bend uses <strong>2 data bytes</strong> (instead of 1 like most controllers) because:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>It needs to be <strong>smooth and precise</strong> - you can hear even small jumps in pitch</li>
                        <li>One byte only gives 128 steps (0-127), which sounds <strong>choppy and stepped</strong></li>
                        <li>Two bytes give 16,384 steps, making bends sound <strong>smooth and natural</strong></li>
                        <li>Think of it like video frame rate - 128 steps is like 24fps (visible jumps), while 16,384 is like 240fps (silky smooth)</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Question 2: Range */}
              <div className="mb-6">
                <button type="button"
                  onClick={() => toggleSection('range')}
                  className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors"
                >
                  <h3 className="font-bold text-gray-800">2. What is the total range of pitch bend values?</h3>
                  {expandedSections.range ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSections.range && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-100 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-600 mb-1">Full Downward Bend</div>
                        <div className="text-3xl font-bold text-blue-700">0</div>
                      </div>
                      <div className="bg-mustard-100 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-600 mb-1">Center (No Bend)</div>
                        <div className="text-3xl font-bold text-mustard-700">8192</div>
                      </div>
                      <div className="bg-blue-100 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-600 mb-1">Full Upward Bend</div>
                        <div className="text-3xl font-bold text-blue-700">16383</div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                      <div className="font-semibold text-blue-700 mb-2">Total number of positions:</div>
                      <p className="text-gray-700 mb-2">
                        <strong>16,384 possible positions</strong> (0 to 16,383)
                      </p>
                      <p className="text-sm text-gray-600">
                        This is calculated as 2<sup>14</sup> = 16,384 (because it's 14-bit resolution)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Question 3: 14-bit Resolution */}
              <div className="mb-6">
                <button type="button"
                  onClick={() => toggleSection('resolution')}
                  className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors"
                >
                  <h3 className="font-bold text-gray-800">3. What is 14-bit resolution?</h3>
                  {expandedSections.resolution ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSections.resolution && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                      <div className="font-semibold text-mustard-700 mb-2">What "14-bit" means:</div>
                      <p className="text-gray-700 mb-3">
                        "14-bit" means the system uses <strong>14 binary digits (bits)</strong> to represent the value.
                        This gives us 2<sup>14</sup> = <strong>16,384 different possible values</strong>.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Comparison: 7-bit vs 14-bit</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border-2 border-orange-300 p-3 rounded">
                          <div className="font-semibold text-orange-700 mb-2">7-bit (Most MIDI CC)</div>
                          <ul className="text-sm space-y-1 text-gray-700">
                            <li>Values: 0-127</li>
                            <li>Total steps: <strong>128</strong></li>
                            <li>Used for: Modulation, Volume, Pan</li>
                            <li>Result: Acceptable for on/off controls</li>
                          </ul>
                        </div>
                        <div className="border-2 border-green-300 p-3 rounded">
                          <div className="font-semibold text-green-700 mb-2">14-bit (Pitch Bend)</div>
                          <ul className="text-sm space-y-1 text-gray-700">
                            <li>Values: 0-16,383</li>
                            <li>Total steps: <strong>16,384</strong></li>
                            <li>Used for: Pitch Bend</li>
                            <li>Result: Ultra-smooth, imperceptible steps</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-green-500">
                      <div className="font-semibold text-green-700 mb-2">Why is higher resolution important for pitch bend?</div>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>Human hearing is sensitive to pitch</strong> - We can detect very small changes in pitch (smaller than 1/100th of a semitone)</li>
                        <li><strong>128 steps sound robotic</strong> - With only 7-bit (128 steps), you'd hear a "stepped" or "zipper" effect when bending pitch</li>
                        <li><strong>16,384 steps sound smooth</strong> - 14-bit gives such small increments that the human ear perceives it as perfectly smooth</li>
                        <li><strong>Comparison</strong>: Modulation (CC1) at 7-bit is fine because we're less sensitive to wobble speed, but pitch needs precision</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Task 1B: Synthesiser Settings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Task 1B: Pitch Bend Range in Your Synthesiser</h2>
              </div>

              <div className="space-y-6">
                {/* Question 1: Where to find the setting */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-3">1. Where to change pitch bend range</h3>
                  <div className="bg-white p-4 rounded">
                    <p className="font-semibold text-green-700 mb-2">Location:</p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                      <li>Open your synthesiser on the MIDI track</li>
                      <li>Look for a <strong>"Pitch Bend Range"</strong> (or "Bend Range") control — often in a global or settings tab</li>
                      <li>This is usually shown in <strong>semitones</strong> (default is often 2 semitones)</li>
                    </ol>
                  </div>
                </div>

                {/* Question 2: Common ranges */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-3">2. Common pitch bend range settings</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                      <div className="font-bold text-blue-700 mb-2">2 Semitones</div>
                      <p className="text-sm text-gray-700 mb-2"><strong>Musical use:</strong></p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>Subtle bass slides</li>
                        <li>Realistic guitar bends</li>
                        <li>Adding expressiveness to leads</li>
                        <li>Standard for most synth playing</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-mustard-500">
                      <div className="font-bold text-mustard-700 mb-2">7 Semitones</div>
                      <p className="text-sm text-gray-700 mb-2"><strong>Musical use:</strong></p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>Perfect fifth bends</li>
                        <li>Dramatic pitch dives</li>
                        <li>Sci-fi sound effects</li>
                        <li>Blues-style wide bends</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-green-500">
                      <div className="font-bold text-green-700 mb-2">12 Semitones</div>
                      <p className="text-sm text-gray-700 mb-2"><strong>Musical use:</strong></p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>Full octave bends</li>
                        <li>Extreme pitch effects</li>
                        <li>Theremin-style playing</li>
                        <li>Experimental/ambient music</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Question 3: Creating specific bends */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-3">3. How to create specific pitch bends</h3>

                  <div className="mb-6">
                    <div className="bg-mustard-100 p-3 rounded-lg mb-3">
                      <h4 className="font-bold text-mustard-700 mb-2">Creating a 7-semitone bend (Perfect Fifth)</h4>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Open your synthesiser and go to its <strong>global settings page</strong></li>
                        <li>Set <strong>Pitch Bend Range to 7 semitones</strong></li>
                        <li>In your MIDI clip, open the <strong>Envelope Editor</strong> (bottom of clip view)</li>
                        <li>From the dropdown, select <strong>"MIDI Ctrl" - "Pitch Bend"</strong></li>
                        <li>Draw your envelope:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
                            <li>To bend <strong>UP</strong> 7 semitones: Draw the line to the <strong>maximum value</strong> (top of envelope)</li>
                            <li>To bend <strong>DOWN</strong> 7 semitones: Draw the line to the <strong>minimum value</strong> (bottom of envelope)</li>
                            <li>For a smooth bend: Create a <strong>ramp from center (0) to max or min</strong></li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <div className="bg-blue-100 p-3 rounded-lg mb-3">
                      <h4 className="font-bold text-blue-700 mb-2">Creating a 12-semitone bend (One Octave)</h4>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Open your synthesiser and go to its <strong>global settings page</strong></li>
                        <li>Set <strong>Pitch Bend Range to 12 semitones</strong></li>
                        <li>In your MIDI clip, open the <strong>Envelope Editor</strong></li>
                        <li>Select <strong>"MIDI Ctrl" - "Pitch Bend"</strong></li>
                        <li>Draw your envelope:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
                            <li>To bend <strong>UP</strong> 1 octave: Draw to <strong>maximum</strong> (top)</li>
                            <li>To bend <strong>DOWN</strong> 1 octave: Draw to <strong>minimum</strong> (bottom)</li>
                            <li>For dramatic effect: Try a quick ramp up/down or a slow glide</li>
                          </ul>
                        </li>
                      </ol>
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-700">
                          <strong>Pro tip:</strong> The envelope controls how much of the range you use. Maximum envelope = full range.
                          If you want to bend only 6 semitones with a 12-semitone range, draw the envelope to the halfway point!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Try it yourself section */}
                <div className="bg-gradient-to-r from-mustard-100 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-orange-600" />
                    <h4 className="font-bold text-gray-800">Try it yourself!</h4>
                  </div>
                  <p className="text-gray-700 text-sm">
                    Use the interactive simulator above to experiment with different pitch bend ranges.
                    The simulator shows the data — listen in your DAW to hear how the bend actually sounds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task 1C: MIDI Controllers */}
        {activeTab === 'controllers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-6 h-6 text-mustard-600" />
                <h2 className="text-2xl font-bold text-gray-800">Task 1C: MIDI Controllers Beyond Pitch Bend</h2>
              </div>

              <p className="text-gray-600 mb-6">
                MIDI Controllers (CC messages) are used to control various parameters of your instruments.
                Unlike pitch bend which uses 14-bit resolution, most MIDI CC messages use 7-bit (0-127).
              </p>

              {/* Controller Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* CC 1 - Modulation */}
                <div className="border-2 border-mustard-200 rounded-lg p-5 bg-mustard-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-mustard-700">CC 1 - Modulation Wheel</h3>
                    <span className="bg-mustard-200 text-mustard-800 px-3 py-1 rounded-full text-sm font-semibold">CC 1</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">What it controls:</div>
                      <p className="text-gray-700">
                        Usually adds vibrato (pitch wobble) or other modulation effects to the sound.
                        The exact effect depends on how the synth is programmed.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Value Range:</div>
                      <p className="text-gray-700">0-127 (7-bit)</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-mustard-500">
                      <div className="text-sm font-semibold text-mustard-700 mb-1">Production Example:</div>
                      <p className="text-gray-700 text-sm">
                        <strong>Expressive Lead Synth:</strong> Draw a gradual increase in CC1 modulation during a held note
                        to add vibrato that builds intensity. Perfect for emotional lead lines - start clean,
                        then add wobble as the note sustains (like a singer or guitarist would naturally do).
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Common Uses:</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Adding vibrato to synth leads</li>
                        <li>Creating wobbly LFO effects</li>
                        <li>Filter modulation depth</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* CC 7 - Volume */}
                <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-blue-700">CC 7 - Volume</h3>
                    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">CC 7</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">What it controls:</div>
                      <p className="text-gray-700">
                        Controls the overall volume/loudness of the MIDI channel. This is different from velocity -
                        it affects all notes on the track.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Value Range:</div>
                      <p className="text-gray-700">0-127 (0 = silent, 127 = full volume)</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <div className="text-sm font-semibold text-blue-700 mb-1">Production Example:</div>
                      <p className="text-gray-700 text-sm">
                        <strong>Dynamic String Swells:</strong> Use CC7 automation to create a crescendo effect on a string pad.
                        Start at value 30, then slowly ramp up to 110 over 4 bars for a dramatic build-up in your track.
                        This is smoother than using clip volume automation and happens at the MIDI level.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Common Uses:</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Creating volume swells and fades</li>
                        <li>Balancing instrument layers</li>
                        <li>Ducking effects</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* CC 10 - Pan */}
                <div className="border-2 border-green-200 rounded-lg p-5 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-green-700">CC 10 - Pan</h3>
                    <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">CC 10</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">What it controls:</div>
                      <p className="text-gray-700">
                        Controls the stereo position (left/right placement) of the sound.
                        This creates width and space in your mix.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Value Range:</div>
                      <p className="text-gray-700">0-127 (0 = hard left, 64 = center, 127 = hard right)</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-green-500">
                      <div className="text-sm font-semibold text-green-700 mb-1">Production Example:</div>
                      <p className="text-gray-700 text-sm">
                        <strong>Auto-Pan Effect:</strong> Create movement in a hi-hat pattern by drawing a repeating wave
                        pattern in CC10 that goes from 0 (left) to 127 (right) and back. This creates an auto-pan effect
                        that makes the hi-hats bounce between speakers, adding width and interest to your rhythm section.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Common Uses:</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Creating stereo movement/auto-pan</li>
                        <li>Positioning instruments in mix</li>
                        <li>Adding spatial interest</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* CC 11 - Expression */}
                <div className="border-2 border-orange-200 rounded-lg p-5 bg-orange-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-orange-700">CC 11 - Expression</h3>
                    <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">CC 11</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">What it controls:</div>
                      <p className="text-gray-700">
                        Similar to volume (CC7) but designed for real-time expression changes.
                        Think of it as the "performance intensity" control - like how hard a violinist presses the bow.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Value Range:</div>
                      <p className="text-gray-700">0-127 (affects volume but separately from CC7)</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <div className="text-sm font-semibold text-orange-700 mb-1">Production Example:</div>
                      <p className="text-gray-700 text-sm">
                        <strong>Realistic Orchestral Dynamics:</strong> When working with orchestral samples,
                        use CC11 to control the intensity of each phrase. Draw it higher for forte sections
                        and lower for piano sections. This is more realistic than just using velocity because
                        it affects the whole phrase dynamically, like a real conductor's gestures.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Common Uses:</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Orchestral library dynamics</li>
                        <li>Real-time performance intensity</li>
                        <li>Breath controller simulation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* CC 74 - Filter Cutoff */}
                <div className="border-2 border-pink-200 rounded-lg p-5 bg-pink-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-pink-700">CC 74 - Filter Cutoff / Brightness</h3>
                    <span className="bg-pink-200 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">CC 74</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">What it controls:</div>
                      <p className="text-gray-700">
                        Controls the filter cutoff frequency, which affects the brightness/darkness of the sound.
                        Lower values = darker/duller, higher values = brighter/sharper.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Value Range:</div>
                      <p className="text-gray-700">0-127 (0 = very dark/closed filter, 127 = bright/open filter)</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-pink-500">
                      <div className="text-sm font-semibold text-pink-700 mb-1">Production Example:</div>
                      <p className="text-gray-700 text-sm">
                        <strong>Filter Sweep Build-Up:</strong> Create tension in a breakdown by starting with CC74 at 20
                        (very dark, muffled sound), then slowly automating it up to 110 over 8 bars as you build toward the drop.
                        This classic technique makes the sound gradually "open up" and is perfect for EDM, house, and techno builds.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Common Uses:</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Filter sweep effects</li>
                        <li>Creating build-ups and drops</li>
                        <li>Adding movement to static sounds</li>
                        <li>Controlling synth brightness</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Additional note on velocity */}
                <div className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-700">Note: Velocity (Not a CC!)</h3>
                    <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">0-127</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="text-sm font-semibold text-gray-600 mb-1">What it is:</div>
                      <p className="text-gray-700">
                        Velocity is NOT a MIDI CC - it's part of the Note On message itself.
                        It represents how hard you hit a key (0 = softest, 127 = hardest).
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-gray-400">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Key Difference:</div>
                      <p className="text-gray-700 text-sm">
                        Unlike CC controllers which can change continuously during a note,
                        velocity is set once when the note starts and doesn't change during the note.
                        However, some DAWs let you draw velocity automation in a clip or note editor
                        to control how velocity affects each individual note.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How to use in a DAW */}
              <div className="mt-6 bg-gradient-to-r from-mustard-100 to-blue-100 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-800">How to Draw MIDI CC Automation</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Open the MIDI clip or automation lane for the track</li>
                  <li>Find the CC/automation editor — often shown below or alongside the piano roll</li>
                  <li>Select the CC number you want to control (e.g., "1 Modulation", "7 Volume", etc.)</li>
                  <li>Draw your automation by clicking and dragging to create breakpoints</li>
                  <li>The CC values will be sent to your instrument along with the note data</li>
                </ol>
                <p className="text-sm text-gray-600 mt-3">
                  <strong>Pro tip:</strong> Many DAWs also let you map a MIDI CC straight to a plugin
                  parameter using a MIDI-learn or mapping mode, but drawing it into the clip or
                  automation lane gives you precise, editable automation!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Created for Year 12 A-Level Music Technology Students
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Experiment with the controls above to understand how MIDI data works!
          </p>
        </div>
      </div>
    </div>
  );
}
