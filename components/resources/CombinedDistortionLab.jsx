'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Info, Music, Copy, BookOpen, GraduationCap, Lightbulb, Search, Activity } from 'lucide-react';
import HearItAccordion from './HearItAccordion';
import { audioExamples } from '../../lib/audio-examples';

const DistortionLab = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState('learn');

  // Interactive controls (for visualization only - NO AUDIO)
  const [inputGain, setInputGain] = useState(1.5);
  const [frequency, setFrequency] = useState(220);
  const [distortionType, setDistortionType] = useState('hard');
  const [waveformType, setWaveformType] = useState('sine');
  const [showOriginal, setShowOriginal] = useState(true);
  const [showThreshold, setShowThreshold] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Signal chain
  const [chainGain, setChainGain] = useState(1.5);
  const [chainDistortion, setChainDistortion] = useState('soft');
  const [chainFilterFreq, setChainFilterFreq] = useState(2000);
  const [chainFilterEnabled, setChainFilterEnabled] = useState(true);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [quizDifficulty, setQuizDifficulty] = useState('all');

  // Glossary
  const [glossarySearch, setGlossarySearch] = useState('');
  const [expandedTerm, setExpandedTerm] = useState(null);

  // Export
  const [copySuccess, setCopySuccess] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef();

  const DRIVE_THRESHOLD = 0.5;
  const width = 580;
  const height = 200;
  const padding = 40;

  // ============================================================================
  // DISTORTION ALGORITHMS & DATA
  // ============================================================================

  const distortionTypes = {
    hard: {
      name: 'Hard Clipping',
      shortName: 'Hard',
      color: '#DC2626',
      description: 'Sharp, aggressive cutoff creating predominantly odd harmonics. The signal is abruptly cut when it exceeds the threshold.',
      characteristics: ['Transistor circuits', 'Digital clipping', 'Aggressive tone', 'Odd harmonics (3rd, 5th, 7th)'],
      technicalDetail: 'Implements a brick-wall limiter that clips any signal exceeding ±threshold. Creates a near-square wave at high gain.',
      apply: (x, d = DRIVE_THRESHOLD) => Math.max(-d, Math.min(d, x)),
      genres: ['Metal', 'Punk', 'Hard Rock', 'Industrial'],
      plugins: ['Pro Tools Clip', 'FabFilter Saturn (Hard)', 'Soundtoys Decapitator'],
      abletonDevice: 'Saturator (Digital Clip)',
      edexcelRef: 'Transistor-based distortion. High odd-order harmonic content.',
      historicalNote: 'First heard in the 1960s when guitarists began deliberately overdriving their amplifiers.'
    },
    soft: {
      name: 'Soft Clipping',
      shortName: 'Soft',
      color: '#EA580C',
      description: 'Gradual saturation with smoother harmonic content. The signal is progressively compressed as it approaches the threshold.',
      characteristics: ['Overdrive pedals', 'Analog tape', 'Warm compression', 'Smoother harmonics'],
      technicalDetail: 'Uses a hyperbolic tangent or similar curve to gradually reduce gain as signal increases. Preserves more of the original dynamics.',
      apply: (x, d = DRIVE_THRESHOLD) => {
        const normalized = x / d;
        if (Math.abs(normalized) < 1) return x;
        return d * Math.sign(x) * (1 - Math.exp(-Math.abs(normalized)));
      },
      genres: ['Blues', 'Classic Rock', 'Jazz Fusion', 'Country'],
      plugins: ['Waves Abbey Road Saturator', 'UAD Studer', 'Soundtoys Decapitator'],
      abletonDevice: 'Saturator (Soft Sine) / Glue Compressor (Clip)',
      edexcelRef: 'Simulates analog tape saturation. Gradual onset of distortion.',
      historicalNote: 'The sound of analog tape saturation that defined recordings from the 1960s-1990s.'
    },
    tube: {
      name: 'Tube Saturation',
      shortName: 'Tube',
      color: '#CA8A04',
      description: 'Asymmetric warmth emphasising even-order harmonics. Positive and negative peaks are processed differently.',
      characteristics: ['Valve amplifiers', 'Asymmetric response', 'Even harmonics (2nd, 4th, 6th)', 'Musical warmth'],
      technicalDetail: 'Asymmetric transfer function where positive peaks are compressed more than negative. This asymmetry creates even-order harmonics perceived as "warm".',
      apply: (x, d = DRIVE_THRESHOLD) => {
        const normalized = x / d;
        if (x > 0) return d * Math.tanh(normalized * 1.5);
        return d * Math.tanh(normalized * 1.2);
      },
      genres: ['Rock', 'Blues', 'Jazz', 'Vintage recordings'],
      plugins: ['Waves PuigTec', 'UAD Neve', 'Softube Tube-Tech'],
      abletonDevice: 'Dynamic Tube / Amp (Clean)',
      edexcelRef: 'Valve simulation. Asymmetry creates even-order harmonics (2nd, 4th).',
      historicalNote: 'The valve/tube amplifier sound that has defined "warmth" in audio since the 1950s.'
    },
    fuzz: {
      name: 'Fuzz',
      shortName: 'Fuzz',
      color: '#9B7530',
      description: 'Extreme clipping approaching square wave. Creates dense harmonic content and heavy compression.',
      characteristics: ['Square wave tendency', 'Extreme harmonics', 'Sustain', 'Thick texture'],
      technicalDetail: 'Very low threshold with aggressive clipping creates near-square waves. The original waveform is almost completely replaced by a new, harmonically rich signal.',
      apply: (x, d = DRIVE_THRESHOLD) => {
        const normalized = x / d;
        if (normalized > 0.3) return d;
        if (normalized < -0.3) return -d;
        return x * 1.5;
      },
      genres: ['Psychedelic Rock', 'Stoner Rock', 'Garage', 'Alternative'],
      plugins: ['Waves GTR Fuzz', 'Native Instruments Guitar Rig', 'Soundtoys Devil-Loc'],
      abletonDevice: 'Overdrive / Pedal (Fuzz)',
      edexcelRef: 'Hard limiting approaching a square wave. Dominant odd harmonics.',
      historicalNote: 'Accidentally discovered in the 1960s through damaged equipment - Jimi Hendrix made it famous.'
    }
  };

  // Waveform generators (for visualization)
  const waveformTypes = {
    sine: { name: 'Sine', generate: (x) => Math.sin(x) },
    triangle: { name: 'Triangle', generate: (x) => (2 / Math.PI) * Math.asin(Math.sin(x)) },
    sawtooth: { name: 'Sawtooth', generate: (x) => (2 / Math.PI) * (x % (2 * Math.PI)) - 1 },
    square: { name: 'Square', generate: (x) => Math.sin(x) > 0 ? 1 : -1 },
  };

  // ============================================================================
  // HARMONIC SPECTRUM CALCULATION (Enhanced from Gemini version)
  // ============================================================================

  const generateHarmonics = () => {
    const harmonics = [1.0]; // Fundamental
    const driveAmount = Math.max(0, inputGain - 0.5) * 2;

    for (let i = 2; i <= 9; i++) {
      let amp = 0;
      const isOdd = i % 2 !== 0;

      if (distortionType === 'hard') {
        if (isOdd) amp = (1/i) * driveAmount * 0.8;
      } else if (distortionType === 'tube') {
        // Even harmonics emphasized in tube saturation
        if (!isOdd) amp = (1/i) * driveAmount * 0.7;
        else amp = (1/(i*2)) * driveAmount * 0.3;
      } else if (distortionType === 'soft') {
        if (isOdd) amp = (1/(i*i)) * driveAmount * 0.9;
      } else if (distortionType === 'fuzz') {
        if (isOdd) amp = (1/Math.sqrt(i)) * driveAmount;
      }
      harmonics.push(amp);
    }
    return harmonics;
  };

  // ============================================================================
  // WAVEFORM VISUALIZATION
  // ============================================================================

  const generateWaveform = () => {
    const points = 200;
    const original = [];
    const distorted = [];
    const waveGen = waveformTypes[waveformType].generate;

    for (let i = 0; i < points; i++) {
      const x = (i / points) * Math.PI * 4 + animationPhase;
      const cleanValue = waveGen(x) * inputGain;
      const distortedValue = distortionTypes[distortionType].apply(cleanValue);

      original.push({ x: i, y: cleanValue });
      distorted.push({ x: i, y: distortedValue });
    }

    return { original, distorted };
  };

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      setAnimationPhase(prev => (prev + 0.05) % (Math.PI * 2));
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isAnimating]);

  // ============================================================================
  // QUIZ DATA & LOGIC
  // ============================================================================

  const quizQuestions = [
    // Foundation level
    {
      difficulty: 'foundation',
      question: 'What happens to a signal when it is clipped?',
      options: [
        'The peaks are cut off at a threshold',
        'The frequency increases',
        'The signal becomes quieter',
        'The waveform inverts'
      ],
      correct: 0,
      explanation: 'Clipping occurs when the signal amplitude exceeds a threshold, causing the peaks to be "cut off" or flattened.'
    },
    {
      difficulty: 'foundation',
      question: 'Which type of distortion creates predominantly odd harmonics?',
      options: ['Hard clipping', 'Tube saturation', 'Analog tape', 'None of the above'],
      correct: 0,
      explanation: 'Symmetric hard clipping creates predominantly odd harmonics (3rd, 5th, 7th, etc.) due to its symmetrical transfer function.'
    },
    {
      difficulty: 'foundation',
      question: 'What is the main characteristic of soft clipping?',
      options: [
        'Gradual saturation and smoother sound',
        'Sharp aggressive cutoff',
        'Complete signal destruction',
        'No harmonic addition'
      ],
      correct: 0,
      explanation: 'Soft clipping gradually compresses the signal as it approaches the threshold, resulting in a warmer, smoother sound than hard clipping.'
    },

    // Intermediate level
    {
      difficulty: 'intermediate',
      question: 'Why does tube saturation sound "warm"?',
      options: [
        'It adds even-order harmonics',
        'It removes high frequencies',
        'It increases volume',
        'It adds delay'
      ],
      correct: 0,
      explanation: 'Tube saturation creates even-order harmonics (2nd, 4th, 6th) through asymmetric distortion, which are perceived as warm and musical.'
    },
    {
      difficulty: 'intermediate',
      question: 'What distinguishes fuzz from other distortion types?',
      options: [
        'Extreme clipping approaching a square wave',
        'Very subtle saturation',
        'Only adds even harmonics',
        'Works only on bass frequencies'
      ],
      correct: 0,
      explanation: 'Fuzz uses extreme gain and very low threshold, creating near-square waves with dense harmonic content.'
    },
    {
      difficulty: 'intermediate',
      question: 'In Ableton Live, which device would you use for hard clipping?',
      options: ['Saturator (Digital Clip)', 'Dynamic Tube', 'Erosion', 'Reverb'],
      correct: 0,
      explanation: 'The Saturator device in Digital Clip mode provides hard clipping distortion in Ableton Live.'
    },

    // Advanced level
    {
      difficulty: 'advanced',
      question: 'What is the mathematical relationship between odd harmonics in hard clipping?',
      options: [
        'Amplitudes decay proportionally to 1/n (harmonic number)',
        'All harmonics have equal amplitude',
        'Even harmonics are louder than odd',
        'No mathematical relationship exists'
      ],
      correct: 0,
      explanation: 'In symmetric hard clipping, odd harmonic amplitudes typically decay at a rate proportional to 1/n, where n is the harmonic number.'
    },
    {
      difficulty: 'advanced',
      question: 'Why does asymmetric distortion create even harmonics?',
      options: [
        'Positive and negative peaks are processed differently',
        'It doubles the frequency',
        'It only works on complex waveforms',
        'The threshold is frequency-dependent'
      ],
      correct: 0,
      explanation: 'Asymmetric distortion processes positive and negative peaks differently, breaking the waveform symmetry and introducing even harmonics.'
    },
    {
      difficulty: 'advanced',
      question: 'What is Total Harmonic Distortion (THD)?',
      options: [
        'The ratio of harmonic content to fundamental frequency',
        'The total volume of the output',
        'The number of distortion effects used',
        'The frequency of the input signal'
      ],
      correct: 0,
      explanation: 'THD measures the ratio of the sum of harmonic powers to the power of the fundamental frequency, expressed as a percentage.'
    }
  ];

  const filteredQuestions = quizDifficulty === 'all'
    ? quizQuestions
    : quizQuestions.filter(q => q.difficulty === quizDifficulty);

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const isCorrect = answerIndex === filteredQuestions[currentQuestion].correct;
    if (isCorrect) setScore(score + 1);

    setAnsweredQuestions([...answeredQuestions, {
      question: filteredQuestions[currentQuestion].question,
      userAnswer: filteredQuestions[currentQuestion].options[answerIndex],
      correctAnswer: filteredQuestions[currentQuestion].options[filteredQuestions[currentQuestion].correct],
      isCorrect,
      explanation: filteredQuestions[currentQuestion].explanation,
      difficulty: filteredQuestions[currentQuestion].difficulty
    }]);
  };

  const nextQuestion = () => {
    setCurrentQuestion(currentQuestion + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setAnsweredQuestions([]);
  };

  // ============================================================================
  // COPY TO ONENOTE (From Gemini version)
  // ============================================================================

  const copyToOneNote = async () => {
    const date = new Date().toLocaleDateString('en-GB');

    let text = `Distortion Learning Lab - Quiz Results\n${'═'.repeat(50)}\n\n`;
    text += `Date: ${date}\nScore: ${score}/${answeredQuestions.length}\n\n`;

    answeredQuestions.forEach((result, idx) => {
      text += `${'─'.repeat(50)}\nQ${idx + 1} [${result.difficulty}]\n`;
      text += `${result.question}\n\n`;
      text += `Your answer:    ${result.userAnswer}\n`;
      text += `Correct answer: ${result.correctAnswer}\n`;
      text += `Result: ${result.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}\n`;
      if (!result.isCorrect) text += `\nExplanation: ${result.explanation}\n`;
      text += `\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  // ============================================================================
  // GLOSSARY DATA
  // ============================================================================

  const glossaryTerms = [
    {
      term: 'Clipping',
      difficulty: 'foundation',
      definition: 'When an audio signal exceeds the maximum amplitude that a system can handle, resulting in the peaks being "cut off" or flattened.',
      related: ['Hard Clipping', 'Soft Clipping', 'Threshold']
    },
    {
      term: 'Hard Clipping',
      difficulty: 'foundation',
      definition: 'Abrupt, sharp cutoff of signal peaks at a fixed threshold. Creates predominantly odd harmonics and a harsh, aggressive sound.',
      related: ['Clipping', 'Odd Harmonics', 'Transistor']
    },
    {
      term: 'Soft Clipping',
      difficulty: 'foundation',
      definition: 'Gradual compression of signal peaks as they approach the threshold. Produces a warmer, smoother sound than hard clipping.',
      related: ['Clipping', 'Saturation', 'Tape']
    },
    {
      term: 'Saturation',
      difficulty: 'intermediate',
      definition: 'Gentle distortion that occurs when analog equipment is driven hard. Adds harmonics and compression while maintaining musicality.',
      related: ['Soft Clipping', 'Tube', 'Harmonic Content']
    },
    {
      term: 'Tube Saturation',
      difficulty: 'intermediate',
      definition: 'Distortion characteristic of vacuum tube (valve) amplifiers. Creates asymmetric distortion with prominent even-order harmonics.',
      related: ['Even Harmonics', 'Saturation', 'Asymmetric']
    },
    {
      term: 'Odd Harmonics',
      difficulty: 'intermediate',
      definition: 'Harmonic frequencies at odd multiples of the fundamental (3rd, 5th, 7th, etc.). Created by symmetric distortion and sound "hollow" or "square-like".',
      related: ['Hard Clipping', 'Harmonics', 'Square Wave']
    },
    {
      term: 'Even Harmonics',
      difficulty: 'intermediate',
      definition: 'Harmonic frequencies at even multiples of the fundamental (2nd, 4th, 6th, etc.). Created by asymmetric distortion and perceived as "warm" and "musical".',
      related: ['Tube Saturation', 'Harmonics', 'Asymmetric']
    },
    {
      term: 'Threshold',
      difficulty: 'foundation',
      definition: 'The signal level at which distortion begins to occur. Signals below this level pass through unchanged.',
      related: ['Clipping', 'Headroom']
    },
    {
      term: 'Headroom',
      difficulty: 'intermediate',
      definition: 'The safety zone between the normal operating level and the clipping point. More headroom means less risk of unwanted distortion.',
      related: ['Threshold', 'Clipping', 'Gain Staging']
    },
    {
      term: 'THD (Total Harmonic Distortion)',
      difficulty: 'advanced',
      definition: 'A measurement of the harmonic content added by distortion, expressed as a percentage. Calculated as the ratio of harmonic power to fundamental power.',
      related: ['Harmonics', 'Measurement']
    },
    {
      term: 'Transfer Function',
      difficulty: 'advanced',
      definition: 'A graph showing the relationship between input amplitude and output amplitude. The shape determines the type of distortion created.',
      related: ['Clipping', 'Saturation']
    },
    {
      term: 'Asymmetric Distortion',
      difficulty: 'advanced',
      definition: 'Distortion where positive and negative signal peaks are processed differently, creating even-order harmonics.',
      related: ['Tube Saturation', 'Even Harmonics']
    },
    {
      term: 'Fuzz',
      difficulty: 'intermediate',
      definition: 'Extreme distortion with very low threshold and high gain, creating near-square waves with dense harmonic content.',
      related: ['Hard Clipping', 'Square Wave', 'Odd Harmonics']
    },
    {
      term: 'Waveshaper',
      difficulty: 'advanced',
      definition: 'A digital audio processor that applies a transfer function to reshape a waveform, creating various types of distortion.',
      related: ['Transfer Function', 'Digital Distortion']
    },
    {
      term: 'Gain Staging',
      difficulty: 'intermediate',
      definition: 'The practice of managing signal levels through a signal chain to optimize headroom and control where distortion occurs.',
      related: ['Headroom', 'Signal Chain', 'Threshold']
    }
  ];

  const filteredGlossary = glossaryTerms.filter(term =>
    term.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    term.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  const DifficultyBadge = ({ level }) => {
    const colors = {
      foundation: 'bg-green-100 text-green-700 border-green-300',
      intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      advanced: 'bg-red-100 text-red-700 border-red-300'
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded border ${colors[level]}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const waveData = generateWaveform();
  const harmonics = generateHarmonics();
  const activeColor = distortionTypes[distortionType].color;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-gray-50">
      {/* Header */}
      <Card className="mb-4 border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Lightbulb className="w-8 h-8" />
            Distortion Learning Lab
            <span className="text-sm font-normal ml-auto">A-Level Music Technology</span>
          </CardTitle>
          <p className="text-slate-200 text-sm mt-2">
            Interactive visual learning tool for understanding audio distortion concepts
          </p>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="learn" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Learn
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Interactive
          </TabsTrigger>
          <TabsTrigger value="theory" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Theory & Exam
          </TabsTrigger>
          <TabsTrigger value="chain" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            Signal Chain
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
             Quiz
          </TabsTrigger>
          <TabsTrigger value="glossary" className="flex items-center gap-2">
             Glossary
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* LEARN TAB */}
        {/* ================================================================ */}
        <TabsContent value="learn" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {/* Key Concept */}
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <Info className="w-4 h-4 text-blue-700" />
                <AlertDescription className="text-blue-900">
                  <strong>Key Concept:</strong> Distortion occurs when an audio signal exceeds the amplitude threshold
                  of a system. The way peaks are processed determines the type of distortion and its harmonic character.
                </AlertDescription>
              </Alert>

              {/* Distortion Types Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {Object.entries(distortionTypes).map(([key, config]) => (
                  <div
                    key={key}
                    className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: config.color }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <h4 className="font-bold text-lg flex-1 ml-3" style={{ color: config.color }}>
                        {config.name}
                      </h4>
                    </div>

                    <p className="text-gray-700 text-sm mb-3 italic">
                      &quot;{config.description}&quot;
                    </p>

                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 mb-2">
                        More details & examples
                      </summary>

                      <div className="pl-4 space-y-3 mt-3 border-l-2" style={{ borderColor: config.color }}>
                        <div>
                          <p className="font-semibold text-gray-800">Characteristics:</p>
                          <ul className="list-disc pl-5 mt-1 text-gray-600">
                            {config.characteristics.map((char, idx) => (
                              <li key={idx}>{char}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">Technical Detail:</p>
                          <p className="text-gray-600">{config.technicalDetail}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">Common Genres:</p>
                          <p className="text-gray-600">{config.genres.join(', ')}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">Professional Plugins:</p>
                          <p className="text-gray-600 text-xs">{config.plugins.join(', ')}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">Ableton Live:</p>
                          <p className="text-gray-600 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {config.abletonDevice}
                          </p>
                        </div>

                        <div className="bg-amber-50 p-2 rounded border border-amber-200">
                          <p className="text-xs text-amber-900">
                            <strong>Historical Note:</strong> {config.historicalNote}
                          </p>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>

              {/* Quick Reference */}
              <Card className="bg-gray-100 border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Reference Guide</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-bold mb-2">Symmetrical Clipping</h5>
                    <p className="text-gray-600">Positive and negative peaks processed equally → Odd harmonics</p>
                    <p className="text-xs text-gray-500 mt-1">Examples: Hard clip, Soft clip</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-bold mb-2">Asymmetrical Distortion</h5>
                    <p className="text-gray-600">Peaks processed differently → Even harmonics</p>
                    <p className="text-xs text-gray-500 mt-1">Examples: Tube saturation</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-bold mb-2">THD Formula</h5>
                    <p className="text-gray-600 font-mono text-xs">THD = √(H₂² + H₃² + ... + Hₙ²) / H₁</p>
                    <p className="text-xs text-gray-500 mt-1">Ratio of harmonics to fundamental</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <HearItAccordion
            title={audioExamples['distortion'].title}
            tracks={audioExamples['distortion'].tracks}
          />
        </TabsContent>

        {/* ================================================================ */}
        {/* INTERACTIVE TAB */}
        {/* ================================================================ */}
        <TabsContent value="interactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visual Waveform & Harmonic Analysis</CardTitle>
              <p className="text-sm text-gray-600">
                Explore how different distortion types affect waveforms and harmonic content
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <label className="text-sm font-medium mb-2 block">Distortion Type</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(distortionTypes).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setDistortionType(key)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                          distortionType === key
                            ? 'text-white shadow-md'
                            : 'bg-white text-gray-700 border hover:shadow'
                        }`}
                        style={{
                          backgroundColor: distortionType === key ? config.color : undefined,
                          borderColor: config.color
                        }}
                      >
                        {config.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Input Waveform</label>
                  <div className="flex gap-2">
                    {Object.entries(waveformTypes).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setWaveformType(key)}
                        className={`px-3 py-2 rounded text-sm font-medium ${
                          waveformType === key
                            ? 'bg-gray-700 text-white'
                            : 'bg-white text-gray-700 border hover:bg-gray-100'
                        }`}
                      >
                        {config.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    Input Gain: {inputGain.toFixed(2)}x
                  </label>
                  <Slider
                    value={[inputGain]}
                    onValueChange={([val]) => setInputGain(val)}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showOriginal}
                      onChange={(e) => setShowOriginal(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Show original waveform
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showThreshold}
                      onChange={(e) => setShowThreshold(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Show threshold lines
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAnimating}
                      onChange={(e) => setIsAnimating(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Animate
                  </label>
                </div>
              </div>

              {/* Teacher Tip */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <Lightbulb className="w-4 h-4 text-yellow-700" />
                <AlertDescription className="text-yellow-900">
                  <strong>Teaching Tip:</strong> {distortionTypes[distortionType].technicalDetail}
                  {inputGain > 2 && " Notice how extreme gain creates more harmonic content."}
                </AlertDescription>
              </Alert>

              {/* Waveform Visualization */}
              <div className="border-2 rounded-lg p-4 bg-white">
                <h4 className="font-semibold mb-3">Waveform Comparison</h4>
                <svg width={width} height={height} className="w-full">
                  {/* Grid lines */}
                  <line x1={padding} y1={height/2} x2={width-padding} y2={height/2}
                    stroke="#E5E7EB" strokeWidth="1" />

                  {/* Threshold lines */}
                  {showThreshold && (
                    <>
                      <line
                        x1={padding}
                        y1={height/2 - DRIVE_THRESHOLD * (height/2 - 20)}
                        x2={width-padding}
                        y2={height/2 - DRIVE_THRESHOLD * (height/2 - 20)}
                        stroke="#EF4444"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                      />
                      <line
                        x1={padding}
                        y1={height/2 + DRIVE_THRESHOLD * (height/2 - 20)}
                        x2={width-padding}
                        y2={height/2 + DRIVE_THRESHOLD * (height/2 - 20)}
                        stroke="#EF4444"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                      />
                    </>
                  )}

                  {/* Original waveform */}
                  {showOriginal && (
                    <polyline
                      points={waveData.original.map(p =>
                        `${padding + (p.x * (width - 2*padding) / 200)},${height/2 - p.y * (height/2 - 20)}`
                      ).join(' ')}
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  )}

                  {/* Distorted waveform */}
                  <polyline
                    points={waveData.distorted.map(p =>
                      `${padding + (p.x * (width - 2*padding) / 200)},${height/2 - p.y * (height/2 - 20)}`
                    ).join(' ')}
                    fill="none"
                    stroke={activeColor}
                    strokeWidth="3"
                  />
                </svg>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  {showOriginal && (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-gray-400"></div>
                      Original
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-0.5" style={{ backgroundColor: activeColor }}></div>
                    Distorted
                  </span>
                  {showThreshold && (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-red-500 opacity-50"></div>
                      Threshold
                    </span>
                  )}
                </div>
              </div>

              {/* Harmonic Spectrum (Enhanced from Gemini) */}
              <div className="border-2 rounded-lg p-4 bg-white">
                <h4 className="font-semibold mb-3">Harmonic Spectrum Analysis</h4>
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <Info className="w-4 h-4 text-blue-700" />
                  <AlertDescription className="text-blue-900 text-sm">
                    <strong>Teaching Tip:</strong> Note how symmetric clipping (Hard/Soft) emphasizes
                    <span className="text-orange-700 font-bold bg-orange-100 px-1 rounded mx-1">ODD</span>
                    harmonics, while asymmetric distortion (Tube) introduces
                    <span className="text-blue-700 font-bold bg-blue-100 px-1 rounded mx-1">EVEN</span>
                    harmonics.
                  </AlertDescription>
                </Alert>

                <div className="h-[300px] flex items-end justify-around gap-1 px-4 pb-12 relative bg-gray-50 rounded">
                  {/* Background grid */}
                  {[25, 50, 75].map(line => (
                    <div
                      key={line}
                      className="absolute w-full border-t border-gray-200"
                      style={{ bottom: `${line * 0.8}%` }}
                    />
                  ))}

                  {/* Harmonic bars with hover */}
                  {harmonics.map((amp, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end max-w-[60px]"
                    >
                      {/* Bar */}
                      <div
                        className="w-full rounded-t-sm transition-all duration-300 relative border-2"
                        style={{
                          height: `${Math.min(80, amp * 80)}%`,
                          backgroundColor: i === 0 ? '#94a3b8' : activeColor,
                          opacity: i === 0 ? 0.6 : 1,
                          borderColor: i === 0 ? '#64748b' : activeColor
                        }}
                      >
                        {/* Hover tooltip with percentage */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {(amp * 100).toFixed(1)}%
                          {i === 0 && " (Fund)"}
                        </div>
                      </div>

                      {/* Harmonic labels */}
                      <div className="absolute -bottom-8 text-xs font-bold text-gray-600">
                        {i === 0 ? 'Fund' : `${i+1}H`}
                      </div>

                      {/* Odd/Even indicators */}
                      {i > 0 && (
                        <div
                          className={`absolute -bottom-12 text-[9px] font-black uppercase ${
                            (i+1) % 2 === 0 ? 'text-blue-600' : 'text-orange-600'
                          }`}
                        >
                          {(i+1) % 2 === 0 ? 'EVEN' : 'ODD'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-xs text-gray-600 text-center">
                  Hover over bars to see harmonic amplitude percentages
                </div>
              </div>

              {/* Gain Staging Tip */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <Lightbulb className="w-4 h-4 text-yellow-700" />
                <AlertDescription className="text-yellow-900 text-sm">
                  <strong>Gain Staging Tip:</strong>{' '}
                  {inputGain > 2
                    ? 'High input gain creates more harmonics but reduces dynamics. The signal is heavily distorted.'
                    : inputGain > 1.2
                    ? 'Moderate input gain provides a good balance of distortion and dynamics.'
                    : 'Low input gain preserves more of the original dynamics. Increase to add more character.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* THEORY & EXAM TAB */}
        {/* ================================================================ */}
        <TabsContent value="theory" className="space-y-4">
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-field-50">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-700" />
                Edexcel Music Technology Component 4: Theory & Exam Preparation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">

              {/* Key Terminology */}
              <div className="p-5 bg-slate-100 rounded-lg border-2 border-slate-300">
                <h4 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Key Terminology for Exams
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-blue-700">Transfer Function:</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      The graph showing Input vs Output amplitude. Its shape determines distortion character.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-blue-700">Clipping:</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      When a signal exceeds maximum system capability, causing peaks to be &quot;cut off&quot;.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-blue-700">Headroom:</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Safety zone between signal level and clipping point. Essential for gain staging.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-blue-700">THD:</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Total Harmonic Distortion - ratio of harmonic content to fundamental frequency.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-blue-700">Saturation:</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Gentle distortion from analog equipment. Adds harmonics while maintaining musicality.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-blue-700">Gain Staging:</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Managing signal levels through a chain to optimize headroom and control distortion.
                    </p>
                  </div>
                </div>
              </div>

              {/* Odd vs Even Harmonics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-orange-300 rounded-lg bg-orange-50">
                  <h4 className="font-black text-orange-700 mb-2 uppercase flex items-center gap-2">
                    Odd Harmonics
                  </h4>
                  <p className="text-xs font-bold text-orange-600 mb-3">3rd, 5th, 7th, 9th...</p>
                  <p className="text-sm text-gray-800 mb-3">
                    Created by <strong>symmetrical clipping</strong>. Both positive and negative peaks
                    are processed identically.
                  </p>
                  <div className="bg-white p-2 rounded border border-orange-200 text-sm">
                    <strong>Sound Character:</strong> &quot;Hollow&quot;, &quot;gritty&quot;, &quot;square-wave like&quot;, &quot;aggressive&quot;
                  </div>
                  <div className="mt-3 text-xs text-orange-800">
                    <strong>Examples:</strong> Hard clipping, Fuzz
                  </div>
                </div>

                <div className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                  <h4 className="font-black text-blue-700 mb-2 uppercase flex items-center gap-2">
                    Even Harmonics
                  </h4>
                  <p className="text-xs font-bold text-blue-600 mb-3">2nd, 4th, 6th, 8th...</p>
                  <p className="text-sm text-gray-800 mb-3">
                    Created by <strong>asymmetrical distortion</strong>. Positive and negative peaks
                    are processed differently.
                  </p>
                  <div className="bg-white p-2 rounded border border-blue-200 text-sm">
                    <strong>Sound Character:</strong> &quot;Warm&quot;, &quot;thick&quot;, &quot;musical&quot;, &quot;rich&quot;
                  </div>
                  <div className="mt-3 text-xs text-blue-800">
                    <strong>Examples:</strong> Tube saturation, Valve amps
                  </div>
                </div>
              </div>

              {/* Ableton Live Connections */}
              <Card className="border-2 border-slate-300">
                <CardHeader className="bg-slate-100">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Ableton Live Device Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {Object.entries(distortionTypes).map(([key, algo]) => (
                      <div key={key} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <span className="font-bold" style={{ color: algo.color }}>
                          {algo.name}
                        </span>
                        <span className="text-sm font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded border">
                          {algo.abletonDevice}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Edexcel Exam Focus */}
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                <h4 className="font-bold text-lg mb-3 text-green-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Edexcel Component 4: What You Need to Know
                </h4>
                <ul className="space-y-2 text-sm text-gray-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Identify</strong> different types of distortion from audio examples</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Explain</strong> the difference between odd and even harmonics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Describe</strong> how symmetrical vs asymmetrical clipping affects tone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Apply</strong> appropriate distortion types in production contexts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Understand</strong> gain staging and headroom management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Know</strong> which Ableton Live devices create each distortion type</span>
                  </li>
                </ul>
              </div>

              {/* Current Distortion Type Reference */}
              <div className="p-4 bg-white rounded-lg border-2" style={{ borderColor: activeColor }}>
                <h4 className="font-bold mb-2" style={{ color: activeColor }}>
                  Currently Selected: {distortionTypes[distortionType].name}
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Edexcel Reference:</strong> {distortionTypes[distortionType].edexcelRef}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Technical Detail:</strong> {distortionTypes[distortionType].technicalDetail}
                </p>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* SIGNAL CHAIN TAB */}
        {/* ================================================================ */}
        <TabsContent value="chain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Signal Chain Visualization</CardTitle>
              <p className="text-sm text-gray-600">
                Understand how distortion fits into an audio signal path
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Pre-Gain: {chainGain.toFixed(2)}x
                  </label>
                  <Slider
                    value={[chainGain]}
                    onValueChange={([val]) => setChainGain(val)}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Distortion Type</label>
                  <select
                    value={chainDistortion}
                    onChange={(e) => setChainDistortion(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {Object.entries(distortionTypes).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Low-Pass Filter: {chainFilterFreq}Hz
                  </label>
                  <Slider
                    value={[chainFilterFreq]}
                    onValueChange={([val]) => setChainFilterFreq(val)}
                    min={500}
                    max={8000}
                    step={100}
                    disabled={!chainFilterEnabled}
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={chainFilterEnabled}
                      onChange={(e) => setChainFilterEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Enable Low-Pass Filter
                  </label>
                </div>
              </div>

              {/* Signal Flow Visualization */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="bg-white rounded-lg px-4 py-3 border-2 border-blue-400 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">INPUT</div>
                    <div className="font-mono text-sm font-bold">Signal</div>
                  </div>

                  <div className="text-2xl text-gray-400">→</div>

                  <div className="bg-white rounded-lg px-4 py-3 border-2 border-green-400 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">PRE-GAIN</div>
                    <div className="font-mono text-sm font-bold">{chainGain.toFixed(2)}x</div>
                  </div>

                  <div className="text-2xl text-gray-400">→</div>

                  <div
                    className="bg-white rounded-lg px-4 py-3 border-2 shadow-md"
                    style={{ borderColor: distortionTypes[chainDistortion].color }}
                  >
                    <div className="text-xs text-gray-500 mb-1">DISTORTION</div>
                    <div className="font-mono text-sm font-bold" style={{ color: distortionTypes[chainDistortion].color }}>
                      {distortionTypes[chainDistortion].shortName}
                    </div>
                  </div>

                  <div className="text-2xl text-gray-400">→</div>

                  <div className={`bg-white rounded-lg px-4 py-3 border-2 shadow-sm ${
                    chainFilterEnabled ? 'border-mustard-400' : 'border-gray-300 opacity-50'
                  }`}>
                    <div className="text-xs text-gray-500 mb-1">LOW-PASS</div>
                    <div className="font-mono text-sm font-bold">
                      {chainFilterEnabled ? `${chainFilterFreq}Hz` : 'OFF'}
                    </div>
                  </div>

                  <div className="text-2xl text-gray-400">→</div>

                  <div className="bg-white rounded-lg px-4 py-3 border-2 border-red-400 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">OUTPUT</div>
                    <div className="font-mono text-sm font-bold">🔊</div>
                  </div>
                </div>
              </div>

              {/* Gain Staging Explanation */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <Lightbulb className="w-4 h-4 text-yellow-700" />
                <AlertDescription className="text-yellow-900">
                  <strong>Gain Staging in Signal Chain:</strong>{' '}
                  {chainGain > 2
                    ? 'High pre-gain drives the distortion harder, creating more harmonics but less dynamics.'
                    : chainGain > 1.2
                    ? 'Moderate pre-gain provides balanced distortion character.'
                    : 'Low pre-gain keeps distortion subtle. Increase to add more character.'}
                  {chainFilterEnabled && chainFilterFreq < 3000 &&
                    ' The low-pass filter is removing harsh high frequencies for a warmer tone.'}
                </AlertDescription>
              </Alert>

              {/* Common Signal Chain Patterns */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Common Production Signal Chains</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded border">
                    <strong className="text-blue-900">Guitar Distortion:</strong>
                    <p className="text-gray-700 mt-1">
                      Input → Pre-Gain Boost → Distortion (Hard/Fuzz) → EQ (cut harsh highs) → Cabinet Simulator → Output
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded border">
                    <strong className="text-orange-900">Synth Warmth:</strong>
                    <p className="text-gray-700 mt-1">
                      Input → Tube Saturation → Low-Pass Filter → Subtle Compression → Output
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-mustard-50 to-mustard-100 rounded border">
                    <strong className="text-mustard-900">Drum Character:</strong>
                    <p className="text-gray-700 mt-1">
                      Input → Transient Shaper → Soft Clipping → EQ → Parallel Compression → Output
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded border">
                    <strong className="text-green-900">Vocal Saturation:</strong>
                    <p className="text-gray-700 mt-1">
                      Input → De-Esser → Tube/Tape Saturation → EQ → Compression → Reverb → Output
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* QUIZ TAB */}
        {/* ================================================================ */}
        <TabsContent value="quiz" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Assessment Quiz</CardTitle>
              <p className="text-sm text-gray-600">
                Test your understanding of distortion concepts
              </p>
            </CardHeader>
            <CardContent>
              {currentQuestion < filteredQuestions.length ? (
                <div className="space-y-4">
                  {/* Difficulty Filter */}
                  <div className="flex gap-2 p-3 bg-gray-50 rounded border">
                    <span className="text-sm font-medium">Filter by difficulty:</span>
                    {['all', 'foundation', 'intermediate', 'advanced'].map(diff => (
                      <button
                        key={diff}
                        onClick={() => {
                          setQuizDifficulty(diff);
                          resetQuiz();
                        }}
                        className={`px-3 py-1 rounded text-sm ${
                          quizDifficulty === diff
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border hover:bg-gray-100'
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Question {currentQuestion + 1} of {filteredQuestions.length}
                    </span>
                    <span>
                      Score: {score}/{answeredQuestions.length}
                    </span>
                  </div>

                  {/* Question */}
                  <Card className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <DifficultyBadge level={filteredQuestions[currentQuestion].difficulty} />
                      </div>
                      <CardTitle className="text-lg mt-2">
                        {filteredQuestions[currentQuestion].question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredQuestions[currentQuestion].options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => !showFeedback && handleAnswer(idx)}
                          disabled={showFeedback}
                          className={`w-full text-left p-4 rounded border-2 transition-all ${
                            showFeedback
                              ? idx === filteredQuestions[currentQuestion].correct
                                ? 'bg-green-50 border-green-500'
                                : idx === selectedAnswer
                                ? 'bg-red-50 border-red-500'
                                : 'bg-gray-50 border-gray-300'
                              : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-gray-600 min-w-[24px]">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            {showFeedback && idx === filteredQuestions[currentQuestion].correct && (
                              <span className="text-green-600 font-bold">✓</span>
                            )}
                            {showFeedback && idx === selectedAnswer && idx !== filteredQuestions[currentQuestion].correct && (
                              <span className="text-red-600 font-bold">✗</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Feedback */}
                  {showFeedback && (
                    <Alert className={
                      selectedAnswer === filteredQuestions[currentQuestion].correct
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }>
                      <AlertDescription>
                        <strong>
                          {selectedAnswer === filteredQuestions[currentQuestion].correct ? '✓ Correct!' : '✗ Incorrect'}
                        </strong>
                        <p className="mt-2 text-sm">
                          {filteredQuestions[currentQuestion].explanation}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Next Button */}
                  {showFeedback && (
                    <Button onClick={nextQuestion} className="w-full">
                      {currentQuestion < filteredQuestions.length - 1 ? 'Next Question' : 'View Results'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results */}
                  <Card className="border-2 border-blue-500">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-2xl text-center">
                        Quiz Complete!
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                      <div className="text-6xl font-bold text-blue-600 mb-4">
                        {score}/{answeredQuestions.length}
                      </div>
                      <div className="text-xl text-gray-700">
                        {((score / answeredQuestions.length) * 100).toFixed(0)}% Correct
                      </div>
                      <div className="mt-4 text-gray-600">
                        {score === answeredQuestions.length && "Perfect score! Excellent work!"}
                        {score >= answeredQuestions.length * 0.8 && score < answeredQuestions.length && "Great job!"}
                        {score >= answeredQuestions.length * 0.6 && score < answeredQuestions.length * 0.8 && "Good effort! Keep practicing!"}
                        {score < answeredQuestions.length * 0.6 && "Review the material and try again!"}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Options */}
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={copyToOneNote}
                      variant="outline"
                      className={copySuccess ? 'bg-green-100 border-green-400' : ''}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copySuccess ? '✓ Copied!' : 'Copy to OneNote'}
                    </Button>
                    <Button onClick={resetQuiz} variant="outline">
                      Try Again
                    </Button>
                  </div>

                  {/* Detailed Results */}
                  <div className="space-y-3 mt-6">
                    <h4 className="font-semibold text-lg">Detailed Results:</h4>
                    {answeredQuestions.map((result, idx) => (
                      <Card
                        key={idx}
                        className={`border-2 ${
                          result.isCorrect ? 'border-green-300' : 'border-red-300'
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Question {idx + 1}</span>
                            <DifficultyBadge level={result.difficulty} />
                          </div>
                          <p className="text-sm mt-2">{result.question}</p>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <div>
                            <strong>Your answer:</strong> {result.userAnswer}
                            {result.isCorrect ? ' ✓' : ' ✗'}
                          </div>
                          {!result.isCorrect && (
                            <>
                              <div>
                                <strong>Correct answer:</strong> {result.correctAnswer}
                              </div>
                              <div className="p-3 bg-gray-50 rounded border">
                                <strong>Explanation:</strong> {result.explanation}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* GLOSSARY TAB */}
        {/* ================================================================ */}
        <TabsContent value="glossary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Terminology Glossary</CardTitle>
              <p className="text-sm text-gray-600">
                Key terms and definitions for distortion concepts
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search terms or definitions..."
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 rounded-lg focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{filteredGlossary.length} terms</span>
                <span>•</span>
                <span>
                  {filteredGlossary.filter(t => t.difficulty === 'foundation').length} Foundation
                </span>
                <span>•</span>
                <span>
                  {filteredGlossary.filter(t => t.difficulty === 'intermediate').length} Intermediate
                </span>
                <span>•</span>
                <span>
                  {filteredGlossary.filter(t => t.difficulty === 'advanced').length} Advanced
                </span>
              </div>

              {/* Terms */}
              <div className="space-y-2">
                {filteredGlossary.map((item, index) => (
                  <div key={index} className="border-2 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <button
                      onClick={() => setExpandedTerm(expandedTerm === index ? null : index)}
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-semibold text-lg">{item.term}</span>
                        <DifficultyBadge level={item.difficulty} />
                      </div>
                      <span className="text-gray-400">
                        {expandedTerm === index ? '▼' : '▶'}
                      </span>
                    </button>

                    {expandedTerm === index && (
                      <div className="px-4 pb-4 bg-gray-50 border-t">
                        <p className="text-gray-700 mb-3">{item.definition}</p>
                        {item.related && item.related.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">Related Terms:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.related.map((rel, i) => {
                                const relatedIndex = glossaryTerms.findIndex(t => t.term === rel);
                                return (
                                  <button
                                    key={i}
                                    onClick={() => setExpandedTerm(relatedIndex)}
                                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                                  >
                                    {rel}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredGlossary.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No terms found matching &quot;{glossarySearch}&quot;
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500 p-4 bg-white rounded border">
        <p>
          Distortion Learning Lab • A-Level Music Technology Component 4 •
          Visual learning tool (no audio playback)
        </p>
      </div>
    </div>
  );
};

export default DistortionLab;
