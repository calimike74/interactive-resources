'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, ChevronLeft, ChevronRight, RotateCcw, ThumbsUp, ThumbsDown,
  Info, BookOpen, RefreshCcw, PieChart, BookmarkCheck, Star, Lightbulb,
  Brain, Sparkles, BookCopy
} from 'lucide-react';

const AcousticsFlashcards = () => {
  const allCards = {
    basic: [
      {
        id: "b1",
        question: "What are reverberations and how do they help us understand our environment?",
        answer: "Reverberations tell us what type of room we're occupying through waveforms bouncing off surrounding objects like floors, walls, and ceilings. They provide our brain with spatial information about the environment.",
        furtherLearning: "Try clapping your hands in different rooms - a bathroom, bedroom, and outside. Notice how the sound character changes.",
        practicalExample: "In a large cathedral, you hear long, sustained reverberations, while in a small, carpeted room, the sound dies quickly.",
        difficulty: 1,
        image: "reverb-concept",
        category: "fundamentals"
      },
      {
        id: "b2",
        question: "What are the three things that happen when a sound wave hits a surface?",
        answer: "When a sound wave hits a surface, three things occur: Transmission (some sound moves through the object), Reflection (some sound bounces off, creating echoes), and Absorption (some sound is trapped by the object).",
        furtherLearning: "Test this by speaking through different materials - a thin door vs a thick wall vs a curtain.",
        practicalExample: "A glass window allows transmission, a hard wall creates reflection, and acoustic foam provides absorption.",
        difficulty: 1,
        image: "wave-interaction",
        category: "fundamentals"
      },
      {
        id: "b3",
        question: "What are the three stages of reverberations?",
        answer: "Reverberations are divided into three stages: Direct Sound (original sound reaching the ears first; the ~3.5ms figure is for a source about 1.2m away and scales with distance), Early Reflections (provide room dimension info, ~5-25ms), and Late Reflections (early reflections bouncing off each other until below hearing threshold).",
        furtherLearning: "In a DAW, look at an impulse response to visually identify these three distinct stages.",
        practicalExample: "When you speak in a large hall, you hear your voice directly first, then early reflections from nearby walls, then a wash of late reflections creating the reverb tail.",
        difficulty: 1,
        image: "reverb-stages",
        category: "fundamentals"
      },
      {
        id: "b4",
        question: "What is RT60 and what does it measure?",
        answer: "RT60 (Reverberation Time 60) is the time it takes for sound pressure level to fall by 60dB below the initial level. It's a common measure of how 'reverberant' a space is.",
        furtherLearning: "Use a clap test or room analysis software to measure the RT60 of different spaces in your school or home.",
        practicalExample: "A concert hall might have an RT60 of 2-3 seconds, while a recording studio booth might have 0.2 seconds.",
        difficulty: 1,
        image: "rt60-decay",
        category: "measurements"
      }
    ],
    intermediate: [
      {
        id: "i1",
        question: "How do different materials affect sound wave behavior?",
        answer: "Hard surfaces are more reflective, soft surfaces are more absorptive, thicker/denser objects provide more absorption, and thinner objects allow more transmission. The effect also depends on the frequency range of the original waveform.",
        furtherLearning: "Compare how your voice sounds when speaking toward a brick wall vs a thick curtain vs a thin window.",
        practicalExample: "Concrete walls reflect most frequencies, while thick fiberglass insulation absorbs them. A thin wooden door transmits more sound than a heavy metal door.",
        difficulty: 2,
        image: "material-properties",
        category: "materials"
      },
      {
        id: "i2",
        question: "How does room size affect reverberation characteristics?",
        answer: "In smaller rooms, sound waves reach walls more quickly, creating shorter early reflection times. Room dimensions also determine which frequencies are reinforced or cancelled through standing wave patterns.",
        furtherLearning: "Record the same sound source in rooms of different sizes and analyze the difference in reverb tail length.",
        practicalExample: "A small vocal booth has very short early reflections (under 10ms), while a large warehouse might have early reflections arriving 50-100ms after the direct sound.",
        difficulty: 2,
        image: "room-size-effect",
        category: "room-design"
      },
      {
        id: "i3",
        question: "What is SPL and how does it relate to decay time measurements?",
        answer: "SPL stands for Sound Pressure Level, measured in decibels (dB). In reverberation measurements, we plot SPL on the Y-axis and time on the X-axis to visualize how quickly the sound energy decays in a space.",
        furtherLearning: "Use an SPL meter app to measure how sound levels change over time after a loud clap in different rooms.",
        practicalExample: "An impulse response graph shows the initial spike in SPL, followed by the decay curve that defines the room's acoustic character.",
        difficulty: 2,
        image: "spl-graph",
        category: "measurements"
      },
      {
        id: "i4",
        question: "Why are early reflections particularly important for our perception?",
        answer: "Early reflections (5-25ms) are vital because they provide your brain with information about the dimensions and characteristics of the room. They help us unconsciously understand the space we're in.",
        furtherLearning: "Try listening to music with headphones that simulate different room early reflections to hear how they change spatial perception.",
        practicalExample: "In a narrow hallway, early reflections come from the sides. In a high-ceiling room, they come from above. Your brain uses this to map the space.",
        difficulty: 2,
        image: "early-reflections",
        category: "perception"
      }
    ],
    advanced: [
      {
        id: "a1",
        question: "How would you analyze the acoustic properties of a small, empty room with fibreglass insulation?",
        answer: "Due to the small size, sound will arrive at walls quickly, creating short early reflection times. The fibreglass absorption material on all six surfaces will absorb most reflections, resulting in a very short RT60 and 'dead' acoustic character with minimal reverberation.",
        furtherLearning: "Design an acoustic treatment plan for a home studio, calculating surface areas and absorption coefficients needed.",
        practicalExample: "A vocal isolation booth uses this principle - small dimensions plus maximum absorption creates an acoustically 'dry' environment perfect for close-mic recording.",
        difficulty: 3,
        image: "treated-room",
        category: "acoustic-design"
      },
      {
        id: "a2",
        question: "How do different frequencies behave differently in acoustic spaces?",
        answer: "Different frequencies have different wavelengths, so they interact with room boundaries and materials differently. Low frequencies require larger/thicker absorption materials and are more affected by room dimensions, while high frequencies are more easily absorbed by thin materials.",
        furtherLearning: "Use frequency analysis tools to see how different frequency bands decay at different rates in the same room.",
        practicalExample: "A room might have a 0.3s RT60 for high frequencies but 1.2s RT60 for low frequencies, creating a 'boomy' character.",
        difficulty: 3,
        image: "frequency-response",
        category: "advanced-analysis"
      },
      {
        id: "a3",
        question: "What factors determine the optimal RT60 for different applications?",
        answer: "Optimal RT60 depends on room volume, intended use, and frequency content. Speech intelligibility requires shorter RT60 (0.6-1.2s), while orchestral music benefits from longer RT60 (1.8-2.2s). Room size also affects the ideal range.",
        furtherLearning: "Research the RT60 specifications for different venue types - recording studios, concert halls, lecture theaters, and churches.",
        practicalExample: "A podcast recording room targets 0.2-0.4s RT60, while a concert hall aims for 2.0s RT60 to enhance musical bloom and blend.",
        difficulty: 3,
        image: "optimal-rt60",
        category: "acoustic-design"
      },
      {
        id: "a4",
        question: "How can you use reflection patterns to enhance or control acoustic environments?",
        answer: "Strategic placement of reflective and absorptive surfaces can control early reflection timing and direction. Angled surfaces can redirect reflections, while diffusive surfaces can scatter them to avoid flutter echoes and standing waves.",
        furtherLearning: "Study concert hall designs to see how architects use reflection patterns to distribute sound evenly to all seats.",
        practicalExample: "A recording studio might use angled walls to reflect sound away from microphones, while a concert hall uses curved surfaces to focus reflections toward the audience.",
        difficulty: 3,
        image: "reflection-control",
        category: "advanced-design"
      }
    ]
  };

  // SVG illustrations for acoustic concepts
  const illustrations = {
    "reverb-concept": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram showing sound source radiating waves in a room, reaching a listener — room boundaries create reflections">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <rect x="20" y="20" width="160" height="60" stroke="#64748b" strokeWidth="2" fill="none" />
        <circle cx="50" cy="50" r="4" fill="#DCC892" />
        <text x="45" y="65" fill="#DCC892" fontSize="8">Source</text>
        <circle cx="50" cy="50" r="8" stroke="#DCC892" strokeWidth="1" fill="none" opacity="0.7" />
        <circle cx="50" cy="50" r="16" stroke="#DCC892" strokeWidth="1" fill="none" opacity="0.5" />
        <circle cx="50" cy="50" r="24" stroke="#DCC892" strokeWidth="1" fill="none" opacity="0.3" />
        <circle cx="150" cy="50" r="3" fill="#10b981" />
        <text x="142" y="65" fill="#10b981" fontSize="8">Listener</text>
        <text x="85" y="15" fill="#64748b" fontSize="9">Room Boundaries</text>
        <text x="100" y="95" fill="#ef4444" fontSize="8">Reflections provide spatial info</text>
      </svg>
    ),
    "wave-interaction": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram showing incident sound wave hitting a wall, splitting into transmitted, reflected, and absorbed components">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <rect x="120" y="10" width="8" height="80" fill="#64748b" />
        <text x="130" y="55" fill="#64748b" fontSize="8">Wall</text>
        <path d="M10,50 Q30,40 50,50 Q70,60 90,50 Q110,40 120,50" stroke="#DCC892" strokeWidth="2" fill="none" />
        <text x="60" y="35" fill="#DCC892" fontSize="7">Incident Wave</text>
        <path d="M128,50 Q140,45 150,50 Q160,55 170,50 Q180,45 190,50" stroke="#10b981" strokeWidth="2" fill="none" />
        <text x="135" y="35" fill="#10b981" fontSize="7">Transmitted</text>
        <path d="M120,50 Q110,60 90,50 Q70,40 50,50 Q30,60 10,50" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="3,2" />
        <text x="50" y="70" fill="#ef4444" fontSize="7">Reflected</text>
        <text x="105" y="85" fill="#DCC892" fontSize="7">Absorbed</text>
      </svg>
    ),
    "reverb-stages": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Graph showing the three stages of reverberation over time: direct sound, early reflections (5–25 ms), and late reflections (25 ms+)">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <line x1="20" y1="80" x2="180" y2="80" stroke="#000" strokeWidth="1" />
        <text x="90" y="95" fill="#000" fontSize="8">Time (ms)</text>
        <line x1="30" y1="20" x2="30" y2="80" stroke="#DCC892" strokeWidth="3" />
        <text x="15" y="15" fill="#DCC892" fontSize="7">Direct</text>
        <text x="15" y="90" fill="#DCC892" fontSize="6">~3.5ms @1.2m</text>
        <line x1="50" y1="30" x2="50" y2="80" stroke="#10b981" strokeWidth="2" />
        <line x1="60" y1="35" x2="60" y2="80" stroke="#10b981" strokeWidth="2" />
        <line x1="75" y1="25" x2="75" y2="80" stroke="#10b981" strokeWidth="2" />
        <line x1="85" y1="40" x2="85" y2="80" stroke="#10b981" strokeWidth="2" />
        <text x="55" y="15" fill="#10b981" fontSize="7">Early Reflections</text>
        <text x="55" y="90" fill="#10b981" fontSize="6">5-25ms</text>
        <path d="M100,30 L105,35 L110,32 L115,38 L120,34 L125,40 L130,36 L135,42 L140,38 L145,45 L150,42 L155,48 L160,45 L165,52 L170,50 L175,58" stroke="#ef4444" strokeWidth="1.5" fill="none" />
        <text x="120" y="15" fill="#ef4444" fontSize="7">Late Reflections</text>
        <text x="120" y="90" fill="#ef4444" fontSize="6">25ms+</text>
      </svg>
    ),
    "rt60-decay": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Graph showing RT60: SPL decay curve from an initial impulse, measuring the time for sound to fall 60 dB">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <line x1="30" y1="80" x2="180" y2="80" stroke="#000" strokeWidth="1" />
        <line x1="30" y1="20" x2="30" y2="80" stroke="#000" strokeWidth="1" />
        <text x="100" y="95" fill="#000" fontSize="8">Time</text>
        <line x1="40" y1="25" x2="40" y2="80" stroke="#DCC892" strokeWidth="3" />
        <text x="42" y="30" fill="#DCC892" fontSize="7">Initial Impulse</text>
        <path d="M40,25 Q60,35 80,45 Q100,55 120,62 Q140,68 160,72 Q180,76 195,78" stroke="#ef4444" strokeWidth="2" fill="none" />
        <text x="8" y="28" fill="#64748b" fontSize="6">0dB</text>
        <text x="5" y="82" fill="#64748b" fontSize="6">-60dB</text>
        <line x1="40" y1="82" x2="180" y2="82" stroke="#10b981" strokeWidth="2" />
        <text x="100" y="90" fill="#10b981" fontSize="8">RT60</text>
      </svg>
    ),
    "material-properties": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram comparing three surface types: hard/reflective, soft/absorptive, and thin/transmissive">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <rect x="20" y="20" width="40" height="60" fill="#9ca3af" stroke="#64748b" strokeWidth="2" />
        <text x="25" y="15" fill="#64748b" fontSize="8">Hard Surface</text>
        <text x="30" y="90" fill="#64748b" fontSize="7">(Reflective)</text>
        <rect x="80" y="20" width="40" height="60" fill="#fef3c7" stroke="#DCC892" strokeWidth="2" />
        <text x="85" y="15" fill="#DCC892" fontSize="8">Soft Surface</text>
        <text x="87" y="90" fill="#DCC892" fontSize="7">(Absorptive)</text>
        <rect x="140" y="20" width="4" height="60" fill="#e5e7eb" stroke="#6b7280" strokeWidth="1" />
        <text x="130" y="15" fill="#6b7280" fontSize="8">Thin Surface</text>
        <text x="132" y="90" fill="#6b7280" fontSize="7">(Transmissive)</text>
      </svg>
    ),
    "room-size-effect": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram comparing a small room with quick reflections to a large room with delayed reflections">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <rect x="10" y="20" width="60" height="40" stroke="#DCC892" strokeWidth="2" fill="none" />
        <circle cx="25" cy="40" r="2" fill="#DCC892" />
        <text x="12" y="15" fill="#DCC892" fontSize="8">Small Room</text>
        <text x="15" y="70" fill="#ef4444" fontSize="7">Quick reflections</text>
        <rect x="100" y="10" width="90" height="70" stroke="#10b981" strokeWidth="2" fill="none" />
        <circle cx="125" cy="45" r="2" fill="#10b981" />
        <text x="102" y="8" fill="#10b981" fontSize="8">Large Room</text>
        <text x="130" y="90" fill="#DCC892" fontSize="7">Delayed reflections</text>
        <text x="75" y="95" fill="#64748b" fontSize="8">Room size affects reflection timing</text>
      </svg>
    ),
    "spl-graph": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Graph showing SPL decay curve over time, with initial impulse and early reflection markers">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <line x1="30" y1="80" x2="180" y2="80" stroke="#000" strokeWidth="1" />
        <line x1="30" y1="20" x2="30" y2="80" stroke="#000" strokeWidth="1" />
        <text x="100" y="95" fill="#000" fontSize="8">Time</text>
        <path d="M35,25 L45,30 L55,35 L70,40 L90,48 L120,55 L150,62 L180,68" stroke="#ef4444" strokeWidth="3" fill="none" />
        <line x1="35" y1="25" x2="35" y2="75" stroke="#DCC892" strokeWidth="2" />
        <text x="37" y="22" fill="#DCC892" fontSize="7">Initial Impulse</text>
        <line x1="45" y1="30" x2="45" y2="70" stroke="#10b981" strokeWidth="1.5" />
        <line x1="55" y1="35" x2="55" y2="68" stroke="#10b981" strokeWidth="1.5" />
        <text x="50" y="15" fill="#10b981" fontSize="7">Early Reflections</text>
        <text x="120" y="15" fill="#ef4444" fontSize="8">SPL Decay Curve</text>
      </svg>
    ),
    "early-reflections": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Room diagram showing direct sound path between source and listener, plus ceiling and floor early reflections with approximate timings">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <rect x="20" y="20" width="160" height="50" stroke="#64748b" strokeWidth="2" fill="none" />
        <circle cx="60" cy="45" r="3" fill="#DCC892" />
        <text x="50" y="35" fill="#DCC892" fontSize="8">Source</text>
        <circle cx="140" cy="45" r="3" fill="#10b981" />
        <text x="125" y="35" fill="#10b981" fontSize="8">Listener</text>
        <line x1="63" y1="45" x2="137" y2="45" stroke="#DCC892" strokeWidth="2" />
        <text x="95" y="40" fill="#DCC892" fontSize="7">Direct (~3.5ms @1.2m)</text>
        <path d="M60,45 L25,25 L140,45" stroke="#ef4444" strokeWidth="2" fill="none" />
        <text x="30" y="20" fill="#ef4444" fontSize="7">Ceiling (~8ms)</text>
        <path d="M60,45 L25,65 L140,45" stroke="#DCC892" strokeWidth="2" fill="none" />
        <text x="30" y="80" fill="#DCC892" fontSize="7">Floor (~10ms)</text>
      </svg>
    ),
    "treated-room": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Small treated room diagram with fibreglass absorption on the walls, showing very short RT60 (~0.2 s)">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <rect x="30" y="20" width="140" height="60" stroke="#64748b" strokeWidth="2" fill="none" />
        <path d="M35,25 Q40,22 45,25 Q50,28 55,25 Q60,22 65,25" stroke="#DCC892" strokeWidth="2" fill="none" />
        <path d="M35,40 Q40,37 45,40 Q50,43 55,40 Q60,37 65,40" stroke="#DCC892" strokeWidth="2" fill="none" />
        <path d="M35,55 Q40,52 45,55 Q50,58 55,55 Q60,52 65,55" stroke="#DCC892" strokeWidth="2" fill="none" />
        <circle cx="80" cy="50" r="3" fill="#DCC892" />
        <text x="45" y="15" fill="#DCC892" fontSize="8">Fibreglass</text>
        <text x="45" y="92" fill="#DCC892" fontSize="8">Absorption</text>
        <text x="90" y="15" fill="#64748b" fontSize="9">Small Treated Room</text>
        <text x="90" y="92" fill="#64748b" fontSize="8">Very short RT60 (~0.2s)</text>
      </svg>
    ),
    "frequency-response": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Graph showing frequency-dependent RT60: bass frequencies have longer decay than high frequencies">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <line x1="30" y1="80" x2="180" y2="80" stroke="#000" strokeWidth="1" />
        <line x1="30" y1="20" x2="30" y2="80" stroke="#000" strokeWidth="1" />
        <text x="100" y="95" fill="#000" fontSize="8">Frequency (Hz)</text>
        <path d="M35,35 Q50,30 70,40 Q90,50 110,55 Q130,60 150,65 Q170,68 180,70" stroke="#DCC892" strokeWidth="3" fill="none" />
        <text x="40" y="25" fill="#ef4444" fontSize="7">Bass</text>
        <text x="40" y="32" fill="#ef4444" fontSize="7">Longer RT60</text>
        <text x="130" y="75" fill="#10b981" fontSize="7">Highs</text>
        <text x="130" y="82" fill="#10b981" fontSize="7">Shorter RT60</text>
        <text x="80" y="15" fill="#DCC892" fontSize="9">Frequency-Dependent RT60</text>
      </svg>
    ),
    "optimal-rt60": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Bar chart showing optimal RT60 values by application: recording studio shortest, church longest">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <line x1="30" y1="80" x2="180" y2="80" stroke="#000" strokeWidth="1" />
        <line x1="30" y1="20" x2="30" y2="80" stroke="#000" strokeWidth="1" />
        <text x="90" y="95" fill="#000" fontSize="8">Application Type</text>
        <rect x="40" y="75" width="15" height="5" fill="#10b981" />
        <text x="35" y="90" fill="#10b981" fontSize="7">Recording</text>
        <rect x="70" y="65" width="15" height="15" fill="#DCC892" />
        <text x="70" y="90" fill="#DCC892" fontSize="7">Speech</text>
        <rect x="100" y="50" width="15" height="30" fill="#DCC892" />
        <text x="100" y="90" fill="#DCC892" fontSize="7">Theater</text>
        <rect x="130" y="35" width="15" height="45" fill="#ef4444" />
        <text x="130" y="90" fill="#ef4444" fontSize="7">Concert</text>
        <rect x="160" y="30" width="15" height="50" fill="#DCC892" />
        <text x="162" y="90" fill="#DCC892" fontSize="7">Church</text>
        <text x="90" y="15" fill="#64748b" fontSize="9">Optimal RT60 by Application</text>
      </svg>
    ),
    "reflection-control": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram showing an angled reflector directing sound versus a diffuser scattering energy">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        <path d="M50,20 L80,40 L60,70" stroke="#DCC892" strokeWidth="3" fill="none" />
        <text x="45" y="15" fill="#DCC892" fontSize="8">Angled Reflector</text>
        <text x="75" y="70" fill="#ef4444" fontSize="7">Controlled reflection</text>
        <path d="M120,20 L125,25 L130,18 L135,27 L140,15 L145,30 L150,12 L155,32 L160,20" stroke="#10b981" strokeWidth="3" fill="none" />
        <text x="130" y="12" fill="#10b981" fontSize="8">Diffuser</text>
        <text x="135" y="50" fill="#DCC892" fontSize="7">Scattered energy</text>
        <text x="70" y="90" fill="#64748b" fontSize="9">Controlling Reflection Patterns</text>
      </svg>
    )
  };

  const [difficulty, setDifficulty] = useState("basic");
  const [currentCards, setCurrentCards] = useState(allCards.basic);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidence, setConfidence] = useState({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [studyMode, setStudyMode] = useState("learn");
  const [masteryScore, setMasteryScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    let newCards = [];
    if (difficulty === "all") {
      newCards = [...allCards.basic, ...allCards.intermediate, ...allCards.advanced];
    } else {
      newCards = allCards[difficulty];
    }
    setCurrentCards(newCards);
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [difficulty]);

  useEffect(() => {
    if (currentCards.length > 0) {
      const totalCards = currentCards.length;
      const masteredCards = currentCards.filter(c => confidence[c.id] === true).length;
      setMasteryScore((masteredCards / totalCards) * 100);
    }
  }, [confidence, currentCards]);

  const handleNext = () => {
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setShowHint(false);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setShowHint(false);
    }
  };

  const toggleAnswer = () => setShowAnswer(!showAnswer);
  const toggleHint = () => setShowHint(!showHint);

  const resetDeck = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setConfidence({});
    setShowSummary(false);
    setShowHint(false);
  };

  const setCardConfidence = (confident) => {
    setConfidence({ ...confidence, [currentCards[currentIndex].id]: confident });
    setTimeout(handleNext, 300);
  };

  const needsReview = currentCards.filter(card => confidence[card.id] === false);
  const mastered = currentCards.filter(card => confidence[card.id] === true);
  const notReviewed = currentCards.filter(card => confidence[card.id] === undefined);

  const getProgressColor = (score) => {
    if (score < 30) return "bg-red-500";
    if (score < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Summary View
  if (showSummary) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-lg shadow-lg m-4">
        <h2 className="text-2xl font-bold text-center mb-6">Room Acoustics Mastery</h2>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <PieChart className="h-5 w-5 text-blue-600" />
            Overall Progress
          </h3>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-3">
            <div className={`h-full rounded-full transition-all ${getProgressColor(masteryScore)}`} style={{ width: `${masteryScore}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-medium">Mastered</div>
              <div className="text-green-600 font-bold text-xl">{mastered.length}</div>
            </div>
            <div>
              <div className="font-medium">Need Review</div>
              <div className="text-red-600 font-bold text-xl">{needsReview.length}</div>
            </div>
            <div>
              <div className="font-medium">Not Seen</div>
              <div className="text-gray-600 font-bold text-xl">{notReviewed.length}</div>
            </div>
          </div>
        </div>

        {needsReview.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-red-600" />
              Cards Needing Review
            </h3>
            <div className="space-y-2">
              {needsReview.map((card, idx) => (
                <div key={idx} className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                  <p className="font-medium text-sm">{card.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {mastered.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <BookmarkCheck className="h-5 w-5 text-green-600" />
              Mastered Concepts
            </h3>
            <div className="space-y-2">
              {mastered.map((card, idx) => (
                <div key={idx} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                  <p className="font-medium text-sm">{card.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button type="button"
            onClick={resetDeck}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Study Again
          </button>
          <button type="button"
            onClick={() => {
              setDifficulty(difficulty === "basic" ? "intermediate" : difficulty === "intermediate" ? "advanced" : "basic");
              setShowSummary(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-field-100 hover:bg-field-200 text-field-800 rounded-lg transition-colors"
          >
            <Star className="h-4 w-4" />
            Try {difficulty === "basic" ? "Intermediate" : difficulty === "intermediate" ? "Advanced" : "Basic"}
          </button>
        </div>
      </div>
    );
  }

  // Main Flashcard View
  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      {/* Hero with video background */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        minHeight: '240px',
        backgroundColor: '#1a1a2e',
      }}>
        <video aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={(e) => { e.target.style.opacity = 1; }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0,
            transition: 'opacity 0.8s ease-out',
          }}
          src="/acoustics-hero.mp4"
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
            Room Acoustics & Reverberations
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '1.125rem',
            lineHeight: 1.6,
            maxWidth: '480px', margin: '0 auto',
            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
            Master the science of sound in spaces. Explore reflections, absorption, RT60, and acoustic treatment.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-blue-800">Room Acoustics & Reverberations</h2>

          <div className="flex gap-2 flex-wrap">
            {/* Study Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button type="button"
                onClick={() => setStudyMode("learn")}
                className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                  studyMode === "learn" ? "bg-white shadow-sm" : "text-gray-600"
                }`}
              >
                <BookCopy className="h-3 w-3" /> Learn
              </button>
              <button type="button"
                onClick={() => setStudyMode("test")}
                className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                  studyMode === "test" ? "bg-white shadow-sm" : "text-gray-600"
                }`}
              >
                <Brain className="h-3 w-3" /> Test
              </button>
            </div>

            {/* Difficulty Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {["basic", "intermediate", "advanced", "all"].map((level) => (
                <button type="button"
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors capitalize ${
                    difficulty === level ? "bg-white shadow-sm" : "text-gray-600"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Room Acoustics Study Guide:</h3>
              <ol className="list-decimal pl-4 space-y-1 text-sm">
                <li>Click on cards to flip between questions and explanations</li>
                <li>Use visual hints to understand acoustic concepts</li>
                <li>Track your progress with confidence ratings</li>
              </ol>
              <button type="button"
                onClick={() => setShowInstructions(false)}
                className="mt-3 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm"
              >
                Let's Start!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div
          role="img"
          aria-label={`Progress: ${currentCards.filter(c => confidence[c.id] === true).length} mastered, ${currentCards.filter(c => confidence[c.id] === false).length} needs review, card ${currentIndex + 1} current`}
          className="flex justify-center gap-1 flex-wrap mb-2"
        >
          {currentCards.map((card, idx) => (
            <div
              key={card.id}
              className={`h-2 w-6 rounded-full transition-colors ${
                confidence[card.id] !== undefined
                  ? confidence[card.id] ? 'bg-green-500' : 'bg-red-500'
                  : idx === currentIndex ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Card {currentIndex + 1} of {currentCards.length}</span>
          <span className="flex items-center gap-1">
            <BookmarkCheck className="h-3 w-3 text-green-500" />
            {Object.values(confidence).filter(Boolean).length} mastered
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-500" />
            {currentCards[currentIndex]?.category?.replace('-', ' ')}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${getProgressColor(masteryScore)}`} style={{ width: `${masteryScore}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-transform ${showAnswer ? 'scale-[1.02]' : ''}`}>
        <div className={`p-6 ${showAnswer ? 'bg-blue-50' : ''}`}>
          {/* Difficulty Stars */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex">
              {[...Array(currentCards[currentIndex]?.difficulty || 1)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <button type="button"
              onClick={toggleHint}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Lightbulb className="h-3 w-3" />
              {showHint ? "Hide Visual" : "Visual Hint"}
            </button>
          </div>

          {/* Question Side */}
          {!showAnswer && (
            <div className="min-h-[200px] flex flex-col justify-between">
              <div className="flex items-center justify-center py-8 cursor-pointer" onClick={toggleAnswer}>
                <p className="text-xl text-center leading-relaxed font-medium">
                  {currentCards[currentIndex]?.question}
                </p>
              </div>

              {showHint && currentCards[currentIndex]?.image && (
                <div className="mt-4 p-2 bg-white rounded-lg border">
                  {illustrations[currentCards[currentIndex].image]}
                </div>
              )}

              <div className="flex justify-center mt-4">
                <button type="button"
                  onClick={toggleAnswer}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {studyMode === "learn" ? "Show Explanation" : "Show Answer"}
                </button>
              </div>
            </div>
          )}

          {/* Answer Side */}
          {showAnswer && (
            <div className="py-4">
              <p className="text-lg text-center leading-relaxed font-medium mb-6">
                {currentCards[currentIndex]?.answer}
              </p>

              {currentCards[currentIndex]?.image && (
                <div className="mb-6">
                  {illustrations[currentCards[currentIndex].image]}
                </div>
              )}

              {studyMode === "learn" && (
                <div className="space-y-3">
                  <div className="bg-field-50 p-3 rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold">Practical Example: </span>
                      {currentCards[currentIndex]?.practicalExample}
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold">Try This: </span>
                      {currentCards[currentIndex]?.furtherLearning}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-6">
                <button type="button"
                  onClick={() => setCardConfidence(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Need Review
                </button>
                <button type="button"
                  onClick={() => setCardConfidence(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Got It!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex gap-2">
          <button type="button"
            onClick={resetDeck}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-yellow-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          {Object.keys(confidence).length > 0 && (
            <button type="button"
              onClick={() => setShowSummary(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-blue-50"
            >
              <BarChart className="h-4 w-4" />
              Summary
            </button>
          )}
        </div>

        <button type="button"
          onClick={handleNext}
          disabled={currentIndex === currentCards.length - 1 && studyMode === "test" && !showAnswer}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AcousticsFlashcards;
