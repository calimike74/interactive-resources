'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Info } from 'lucide-react';
import { typography, spacing } from '@/lib/theme';

// Educational tooltip content
const tooltips = {
  cutoff: {
    title: "Cutoff Frequency",
    description: "The frequency at which the filter begins to attenuate the signal. At this point, the signal is reduced by -3dB (half power).",
    examTip: "In Ableton's EQ Eight and Auto Filter, this is the main frequency control."
  },
  rolloff: {
    title: "Rolloff Rate (Slope)",
    description: "How steeply the filter attenuates frequencies beyond the cutoff. Measured in dB per octave. Each 6dB/oct represents one 'pole' in the filter circuit.",
    examTip: "6dB/oct = 1-pole (gentle), 12dB/oct = 2-pole (common), 24dB/oct = 4-pole (Moog-style steep)"
  },
  filterType: {
    title: "Filter Type",
    description: "Determines which frequencies pass through: Low-pass allows lows, High-pass allows highs, Band-pass allows a range, Notch removes a range.",
    examTip: "EQ Eight uses all these types. Auto Filter focuses on low-pass and high-pass with resonance."
  },
  resonance: {
    title: "Resonance (Q)",
    description: "Boosts frequencies at the cutoff point, creating a peak. High resonance creates a distinctive 'squelchy' sound common in synth filters.",
    examTip: "In Ableton, this is often labelled 'Res' or 'Q'. Self-oscillation occurs at very high values."
  }
};

// Tooltip component
const InfoTooltip = ({ tooltipKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = tooltips[tooltipKey];

  if (!info) return null;

  return (
    <div className="relative inline-block ml-2">
      <button type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={`Info about ${info.title}`}
      >
        <Info size={16} />
      </button>
      {isOpen && (
        <div role="tooltip" className="absolute z-50 w-72 p-3 bg-white border rounded-lg shadow-lg left-6 top-0">
          <h4 className="font-semibold text-sm mb-1">{info.title}</h4>
          <p className="text-xs text-gray-600 mb-2">{info.description}</p>
          {info.examTip && (
            <p className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-500">
              <strong>DAW Context:</strong> {info.examTip}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Logarithmic frequency slider - converts linear 0-1000 to log scale 20-20000
const FrequencySlider = ({ value, onChange }) => {
  // Convert frequency to slider position (0-1000)
  const freqToSlider = (freq) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    return ((Math.log10(freq) - minLog) / (maxLog - minLog)) * 1000;
  };

  // Convert slider position to frequency
  const sliderToFreq = (pos) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const log = minLog + (pos / 1000) * (maxLog - minLog);
    return Math.round(Math.pow(10, log));
  };

  const sliderPos = freqToSlider(value);

  const formatFreq = (freq) => {
    if (freq >= 1000) return `${(freq/1000).toFixed(freq >= 10000 ? 0 : 1)}kHz`;
    return `${freq}Hz`;
  };

  return (
    <div className="space-y-2">
      <input aria-label="Cutoff frequency"
        type="range"
        min={0}
        max={1000}
        step={1}
        value={sliderPos}
        onChange={(e) => onChange(sliderToFreq(Number(e.target.value)))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-field-600"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>20Hz</span>
        <span>200Hz</span>
        <span>2kHz</span>
        <span>20kHz</span>
      </div>
      <div className="text-center text-sm font-medium text-field-600">
        {formatFreq(value)}
      </div>
    </div>
  );
};

// Linear slider for resonance
const Slider = ({ value, onChange, min, max, step, ariaLabel = 'Slider' }) => (
  <input aria-label={ariaLabel}
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-field-600"
  />
);

// Available rolloff rates with pole count labels
const rolloffOptions = [
  { value: 6, label: "6dB/oct", sublabel: "1-pole" },
  { value: 12, label: "12dB/oct", sublabel: "2-pole" },
  { value: 18, label: "18dB/oct", sublabel: "3-pole" },
  { value: 24, label: "24dB/oct", sublabel: "4-pole" },
  { value: 48, label: "48dB/oct", sublabel: "8-pole" }
];

// Filter types with descriptions
const filterTypes = [
  { value: 'lowpass', label: 'Low Pass', description: 'Passes frequencies below cutoff' },
  { value: 'highpass', label: 'High Pass', description: 'Passes frequencies above cutoff' },
  { value: 'bandpass', label: 'Band Pass', description: 'Passes frequencies around cutoff' },
  { value: 'notch', label: 'Notch', description: 'Removes frequencies around cutoff' }
];

const FilterRolloffVisualization = () => {
  const [activeTab, setActiveTab] = useState('interactive');

  // Primary filter settings
  const [cutoffFrequency, setCutoffFrequency] = useState(1000);
  const [rolloffRate, setRolloffRate] = useState(12);
  const [filterType, setFilterType] = useState('lowpass');
  const [resonance, setResonance] = useState(0);

  // Rolloff comparison (simplified - just compare slopes at same cutoff)
  const [compareRolloff, setCompareRolloff] = useState(24);

  // Generated data
  const [data, setData] = useState([]);

  // Generate filter response curve
  const generateFilterResponse = useCallback((cutoff, rolloff, type, res) => {
    const attenuations = [];
    const bandwidth = 1.5;

    for (let freq = 20; freq <= 20000; freq *= 1.05) {
      const octavesFromCutoff = Math.log2(freq / cutoff);
      let attenuation = 0;
      let resonanceBoost = 0;

      if (res > 0) {
        const resonanceWidth = 0.5;
        const distanceFromCutoff = Math.abs(octavesFromCutoff);
        if (distanceFromCutoff < resonanceWidth * 2) {
          resonanceBoost = res * Math.exp(-(distanceFromCutoff * distanceFromCutoff) / (2 * resonanceWidth * resonanceWidth));
        }
      }

      const n = rolloff / 6; // number of poles
      switch (type) {
        case 'lowpass':
          // nth-order Butterworth: smooth -3 dB at cutoff, no hard corner
          attenuation = -10 * Math.log10(1 + Math.pow(freq / cutoff, 2 * n));
          break;
        case 'highpass':
          // nth-order Butterworth: smooth -3 dB at cutoff, no hard corner
          attenuation = -10 * Math.log10(1 + Math.pow(cutoff / freq, 2 * n));
          break;
        case 'bandpass':
          if (Math.abs(octavesFromCutoff) > bandwidth / 2) {
            attenuation = -rolloff * (Math.abs(octavesFromCutoff) - bandwidth / 2);
          }
          break;
        case 'notch':
          if (Math.abs(octavesFromCutoff) < bandwidth / 2) {
            const notchDepth = 1 - (Math.abs(octavesFromCutoff) / (bandwidth / 2));
            attenuation = -40 * notchDepth;
          }
          break;
      }

      attenuation = Math.min(attenuation + resonanceBoost, resonanceBoost);
      attenuations.push(Math.max(attenuation, -60));
    }
    return attenuations;
  }, []);

  // Generate data points
  useEffect(() => {
    const frequencies = [];
    for (let freq = 20; freq <= 20000; freq *= 1.05) {
      frequencies.push(freq);
    }

    const primaryResponse = generateFilterResponse(cutoffFrequency, rolloffRate, filterType, resonance);

    // For compare tab - generate second rolloff at same cutoff
    const compareResponse = activeTab === 'compare'
      ? generateFilterResponse(cutoffFrequency, compareRolloff, filterType, resonance)
      : [];

    const newData = frequencies.map((freq, i) => ({
      frequency: freq,
      attenuation: primaryResponse[i],
      ...(activeTab === 'compare' && { attenuationB: compareResponse[i] })
    }));

    setData(newData);
  }, [cutoffFrequency, rolloffRate, filterType, resonance, compareRolloff, activeTab, generateFilterResponse]);

  // Filter controls — local render helper (not a component; uses parent closure)
  const renderFilterControls = ({ showComparison = false }) => (
    <div className="space-y-5">
      {/* Cutoff Frequency */}
      <div className="space-y-2">
        <div className="flex items-center">
          <label className="text-sm font-medium">Cutoff Frequency</label>
          <InfoTooltip tooltipKey="cutoff" />
        </div>
        <FrequencySlider
          value={cutoffFrequency}
          onChange={setCutoffFrequency}
        />
      </div>

      {/* Rolloff Rate */}
      <div className="space-y-2">
        <div className="flex items-center">
          <label className="text-sm font-medium">
            Rolloff Rate {showComparison && <span className="text-field-600">(Filter A)</span>}
          </label>
          <InfoTooltip tooltipKey="rolloff" />
        </div>
        <div className="flex flex-wrap gap-2">
          {rolloffOptions.map((option) => (
            <button type="button"
              key={option.value}
              onClick={() => setRolloffRate(option.value)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors flex flex-col items-center ${
                rolloffRate === option.value
                  ? 'bg-field-600 text-white border-field-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{option.label}</span>
              <span className={`text-[10px] ${rolloffRate === option.value ? 'text-field-200' : 'text-gray-400'}`}>
                {option.sublabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Compare Rolloff Rate - only shown in compare tab */}
      {showComparison && (
        <div className="space-y-2">
          <div className="flex items-center">
            <label className="text-sm font-medium">
              Rolloff Rate <span className="text-green-600">(Filter B)</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {rolloffOptions.map((option) => (
              <button type="button"
                key={option.value}
                onClick={() => setCompareRolloff(option.value)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors flex flex-col items-center ${
                  compareRolloff === option.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{option.label}</span>
                <span className={`text-[10px] ${compareRolloff === option.value ? 'text-green-200' : 'text-gray-400'}`}>
                  {option.sublabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Type */}
      <div className="space-y-2">
        <div className="flex items-center">
          <label className="text-sm font-medium">Filter Type</label>
          <InfoTooltip tooltipKey="filterType" />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
        >
          {filterTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </select>
      </div>

      {/* Resonance */}
      <div className="space-y-2">
        <div className="flex items-center">
          <label className="text-sm font-medium">Resonance (Q): {resonance}</label>
          <InfoTooltip tooltipKey="resonance" />
        </div>
        <Slider
          min={0}
          max={24}
          step={1}
          value={resonance}
          onChange={setResonance}
          ariaLabel="Resonance (Q)"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>None</span>
          <span>Moderate</span>
          <span>Self-oscillation</span>
        </div>
      </div>
    </div>
  );

  // Chart — local render helper (not a component; uses parent closure)
  const renderFilterChart = ({ showComparison = false }) => (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            dataKey="frequency"
            scale="log"
            domain={[20, 20000]}
            ticks={[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]}
            tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : `${value}`}
            label={{ value: 'Frequency (Hz)', position: 'bottom', offset: 20 }}
          />
          <YAxis
            domain={[-60, 30]}
            ticks={[-60, -48, -36, -24, -12, 0, 12, 24]}
            label={{ value: 'Amplitude (dB)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => [
              `${value.toFixed(1)} dB`,
              name === 'attenuation'
                ? (showComparison ? `${rolloffRate}dB/oct` : 'Response')
                : `${compareRolloff}dB/oct`
            ]}
            labelFormatter={(label) => `${label.toFixed(0)} Hz`}
          />
          {showComparison && <Legend verticalAlign="top" height={36} />}

          {/* Reference lines */}
          <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
          <ReferenceLine y={-3} stroke="#e74c3c" strokeDasharray="3 3" label={{ value: '-3dB', position: 'right', fill: '#e74c3c', fontSize: 11 }} />
          <ReferenceLine x={cutoffFrequency} stroke="#888" strokeDasharray="3 3" strokeWidth={1} />

          {/* Filter response curves */}
          <Line
            type="monotone"
            dataKey="attenuation"
            name={showComparison ? `${rolloffRate}dB/oct` : 'Response'}
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey="attenuationB"
              name={`${compareRolloff}dB/oct`}
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="text-xs text-gray-500 text-center">
        Vertical dashed line = cutoff frequency | Red line = -3dB point (half power)
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-lg shadow-sm border m-4">
      {/* Hero with video background */}
      <div style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginBottom: spacing[6],
          minHeight: '240px',
      }}>
          <video aria-hidden="true"
              autoPlay muted loop playsInline
              onLoadedData={(e) => { e.target.style.opacity = 1; }}
              style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  opacity: 1, transition: 'opacity 0.8s ease-out',
              }}
              poster="/eq-hero-poster.jpg"
              src="/eq-hero.mp4"
          />
          <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
          }} />
          <div style={{
              position: 'relative',
              maxWidth: '640px', margin: '0 auto',
              padding: `${spacing[12]} ${spacing[6]} ${spacing[10]}`,
              textAlign: 'center',
          }}>
              <h1 style={{
                  fontSize: typography.size['4xl'],
                  fontWeight: typography.weight.bold,
                  color: '#ffffff',
                  lineHeight: typography.lineHeight.tight,
                  marginBottom: spacing[4],
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>Filter Rolloff Visualisation</h1>
              <p style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: typography.size.lg,
                  lineHeight: typography.lineHeight.relaxed,
                  maxWidth: '480px', margin: '0 auto',
              }}>Explore how cutoff frequency, rolloff rate, filter type, and resonance affect the filter response</p>
          </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {['interactive', 'compare', 'learn'].map((tab) => (
            <button type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'interactive' ? 'Interactive' : tab === 'compare' ? 'Compare Rolloff' : 'Learn'}
            </button>
          ))}
        </div>

        {/* Interactive Tab */}
        {activeTab === 'interactive' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {renderFilterControls({ showComparison: false })}
            </div>
            <div className="lg:col-span-2">
              {renderFilterChart({ showComparison: false })}
            </div>
          </div>
        )}

        {/* Compare Rolloff Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm">
                <strong>Compare how different rolloff slopes affect the filter response.</strong> A steeper slope (more poles) means frequencies beyond the cutoff are attenuated more aggressively.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                {renderFilterControls({ showComparison: true })}
              </div>
              <div className="lg:col-span-2">
                {renderFilterChart({ showComparison: true })}
              </div>
            </div>
          </div>
        )}

        {/* Learn Tab */}
        {activeTab === 'learn' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Key Concepts</h3>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">The -3dB Point</h4>
                <p className="text-sm text-gray-600">
                  The cutoff frequency is defined as the point where the signal is reduced by 3dB -
                  this represents half the power. It's the "corner" of the filter response.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Poles and Rolloff</h4>
                <p className="text-sm text-gray-600">
                  Each "pole" in a filter adds 6dB/octave of rolloff. A classic Moog filter is
                  4-pole (24dB/oct), giving that steep, distinctive sound. Digital EQs often
                  offer variable slopes.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Resonance and Q</h4>
                <p className="text-sm text-gray-600">
                  Resonance boosts frequencies at the cutoff point. High Q creates a peak that
                  emphasises the cutoff frequency. At extreme settings, the filter can
                  self-oscillate, producing a sine wave.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">In Ableton Live</h3>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">EQ Eight</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>8 bands with multiple filter types per band</li>
                  <li>Adjustable Q/resonance for each band</li>
                  <li>Multiple rolloff slopes available (12, 24, 48 dB/oct)</li>
                  <li>Visual frequency response display</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Auto Filter</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Classic filter effect with envelope follower</li>
                  <li>Low-pass, high-pass, band-pass, notch modes</li>
                  <li>Resonance control for adding character</li>
                  <li>LFO modulation of cutoff frequency</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h4 className="font-medium mb-2">Exam Tip</h4>
                <p className="text-sm">
                  Be prepared to identify filter types from frequency response graphs.
                  Understand the relationship between rolloff steepness and the number of
                  poles. Know how resonance affects the response at the cutoff frequency.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterRolloffVisualization;
