'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, ChevronLeft, ChevronRight, RotateCcw, ThumbsUp, ThumbsDown, Info, BookOpen, RefreshCcw, PieChart, BookmarkCheck, Star, Settings, BookCopy, Play, EyeOff, Lightbulb, Brain, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const AudioLeadsFlashcards = () => {
  const allCards = {
    basic: [
      {
        id: "b1",
        question: "What is an XLR connector and what is it primarily used for?",
        answer: "XLR is a 3-pin balanced analog audio connector that locks in place. It's primarily used for microphones, connecting pro audio equipment, and balanced line-level connections.",
        furtherLearning: "Practice identifying XLR connectors on microphones and mixing desks. Notice how they lock securely in place.",
        practicalExample: "When connecting a dynamic microphone to a mixing desk, you'll use an XLR cable. The locking mechanism prevents accidental disconnection during live performances.",
        difficulty: 1,
        image: "xlr-connector",
        category: "connectors"
      },
      {
        id: "b2",
        question: "What's the difference between a TS and TRS 1/4\" jack?",
        answer: "TS (Tip-Sleeve) is a 2-conductor unbalanced jack used for instruments. TRS (Tip-Ring-Sleeve) is a 3-conductor jack that can carry balanced mono signals or unbalanced stereo signals.",
        furtherLearning: "Examine guitar cables (TS) versus headphone cables (TRS) to see the physical difference in the connector.",
        practicalExample: "A guitar cable uses TS for connecting to an amp, while studio monitor cables use TRS for balanced connections to reduce noise.",
        difficulty: 1,
        image: "ts-trs-comparison",
        category: "connectors"
      },
      {
        id: "b3",
        question: "What is a balanced signal and why is it important?",
        answer: "A balanced signal uses three conductors (hot, cold, ground) to cancel out interference. The cold wire carries an inverted copy of the signal, allowing noise to be cancelled at the receiving end.",
        furtherLearning: "Compare the noise levels of a long balanced XLR cable versus a long unbalanced TS cable in a noisy environment.",
        practicalExample: "Professional studios use balanced XLR and TRS connections for long cable runs between equipment to maintain clean audio without hum or interference.",
        difficulty: 1,
        image: "balanced-signal",
        category: "fundamentals"
      },
      {
        id: "b4",
        question: "What are RCA connectors typically used for?",
        answer: "RCA (phono) connectors are unbalanced cables commonly used in consumer audio and DJ equipment. They usually come in red/white pairs for stereo connections.",
        furtherLearning: "Look at the back of CD players, DJ mixers, or home audio equipment to identify RCA connectors.",
        practicalExample: "DJ turntables connect to mixers using RCA cables, with red for right channel and white for left channel audio.",
        difficulty: 1,
        image: "rca-connectors",
        category: "connectors"
      }
    ],
    intermediate: [
      {
        id: "i1",
        question: "What is the standard pin assignment for XLR connectors?",
        answer: "XLR pin assignment: Pin 1 = Ground/Shield, Pin 2 = Hot/Positive (+), Pin 3 = Cold/Negative (-). This standard ensures compatibility across all professional audio equipment.",
        furtherLearning: "Practice wiring XLR connectors following the standard pin assignment. This is essential for audio technicians.",
        practicalExample: "When making custom XLR cables, following Pin 2 hot ensures your cables work with all professional equipment without phase issues.",
        difficulty: 2,
        image: "xlr-pinout",
        category: "technical"
      },
      {
        id: "i2",
        question: "Why shouldn't you use long TS instrument cables?",
        answer: "TS cables are unbalanced and susceptible to noise and high-frequency signal loss over long runs. They should be kept as short as practical to maintain signal quality.",
        furtherLearning: "Test a guitar with different cable lengths to hear the difference in tone and noise levels.",
        practicalExample: "A 20-foot guitar cable will sound duller and noisier than a 6-foot cable due to capacitance and interference pickup.",
        difficulty: 2,
        image: "cable-length-effects",
        category: "fundamentals"
      },
      {
        id: "i3",
        question: "How does a 3.5mm connector work and where is it commonly used?",
        answer: "3.5mm (1/8\") mini-jack is a smaller TRS connector carrying unbalanced stereo audio. Tip = left, ring = right, sleeve = ground. Used for consumer devices like phones and laptops.",
        furtherLearning: "Use a 3.5mm to dual 1/4\" adapter to connect a phone to a mixing desk and understand the signal flow.",
        practicalExample: "Students often need 3.5mm to dual mono 1/4\" cables to connect their phones or laptops to studio equipment for playback.",
        difficulty: 2,
        image: "mini-jack-wiring",
        category: "connectors"
      },
      {
        id: "i4",
        question: "What makes Speakon connectors special and when are they used?",
        answer: "Speakon connectors are locking connectors designed for high-current speaker connections. They carry amplified speaker-level signals from power amplifiers to passive loudspeakers.",
        furtherLearning: "Examine PA systems to see how Speakon connectors are used between amplifiers and speakers.",
        practicalExample: "Large PA systems use Speakon cables because they can handle high power safely and won't accidentally disconnect during a performance.",
        difficulty: 2,
        image: "speakon-connector",
        category: "connectors"
      }
    ],
    advanced: [
      {
        id: "a1",
        question: "How can RCA connectors be used for digital audio, and what should you watch out for?",
        answer: "Orange RCA connectors carry S/PDIF digital coaxial signals. Unlike analog RCA, these carry digital audio data. However, standard RCA cables may not have the correct impedance (75\u03A9) for digital use.",
        furtherLearning: "Compare dedicated 75\u03A9 coaxial cables versus standard RCA cables for digital connections and note any differences in reliability.",
        practicalExample: "When connecting a digital mixer's S/PDIF output to an audio interface, use proper 75\u03A9 digital coax cable rather than standard RCA for best results.",
        difficulty: 3,
        image: "digital-rca",
        category: "digital"
      },
      {
        id: "a2",
        question: "Why is impedance matching important in professional audio connections?",
        answer: "Impedance matching ensures maximum power transfer and prevents signal reflections. Microphone inputs (high Z) versus line inputs (low Z) require different impedance levels for optimal performance.",
        furtherLearning: "Study how DI boxes convert high-impedance instrument signals to low-impedance balanced signals suitable for mixing desks.",
        practicalExample: "Plugging a guitar directly into a mixing desk's line input sounds weak because of impedance mismatch - a DI box solves this problem.",
        difficulty: 3,
        image: "impedance-matching",
        category: "technical"
      },
      {
        id: "a3",
        question: "How do you troubleshoot signal problems in complex audio setups?",
        answer: "Systematic troubleshooting: Check connections first, test cables individually, verify signal levels, check for ground loops, and ensure proper impedance matching throughout the signal chain.",
        furtherLearning: "Practice fault-finding on different audio setups, learning to isolate problems to specific cables or connections.",
        practicalExample: "When experiencing hum in a recording setup, systematically disconnect cables to identify whether it's a ground loop, faulty cable, or impedance issue.",
        difficulty: 3,
        image: "signal-troubleshooting",
        category: "technical"
      },
      {
        id: "a4",
        question: "What are the considerations when using XLR for digital audio protocols?",
        answer: "XLR can carry digital protocols like AES/EBU, but requires 110\u03A9 impedance cables rather than standard 75\u03A9 analog XLR cables. Digital signals are more sensitive to cable quality and length.",
        furtherLearning: "Research the differences between analog and digital XLR cables, particularly impedance specifications and maximum cable lengths.",
        practicalExample: "Professional digital mixing consoles often use AES/EBU connections over XLR, requiring specific digital audio cables rather than standard microphone cables.",
        difficulty: 3,
        image: "digital-xlr",
        category: "digital"
      }
    ]
  };

  // SVG illustrations for different connector types
  const illustrations = {
    "xlr-connector": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* XLR Male Connector */}
        <circle cx="60" cy="50" r="25" fill="#2d3748" stroke="#1a202c" strokeWidth="2" />
        <circle cx="60" cy="50" r="20" fill="#4a5568" />

        {/* Pins */}
        <circle cx="60" cy="40" r="3" fill="#e2e8f0" /> {/* Pin 1 - Ground */}
        <circle cx="52" cy="58" r="3" fill="#e2e8f0" /> {/* Pin 2 - Hot */}
        <circle cx="68" cy="58" r="3" fill="#e2e8f0" /> {/* Pin 3 - Cold */}

        {/* Labels */}
        <text x="60" y="35" fill="#e2e8f0" fontSize="6" textAnchor="middle">1</text>
        <text x="48" y="63" fill="#e2e8f0" fontSize="6" textAnchor="middle">2</text>
        <text x="72" y="63" fill="#e2e8f0" fontSize="6" textAnchor="middle">3</text>

        {/* Cable */}
        <rect x="85" y="45" width="40" height="10" fill="#2d3748" rx="5" />

        {/* XLR Female */}
        <circle cx="150" cy="50" r="25" fill="#4a5568" stroke="#2d3748" strokeWidth="2" />
        <circle cx="150" cy="50" r="20" fill="#2d3748" />

        {/* Female pin holes */}
        <circle cx="150" cy="40" r="2" fill="#1a202c" />
        <circle cx="142" cy="58" r="2" fill="#1a202c" />
        <circle cx="158" cy="58" r="2" fill="#1a202c" />

        <text x="100" y="20" fill="#2d3748" fontSize="10" textAnchor="middle">XLR Connector</text>
        <text x="60" y="85" fill="#2d3748" fontSize="8" textAnchor="middle">Male</text>
        <text x="150" y="85" fill="#2d3748" fontSize="8" textAnchor="middle">Female</text>
      </svg>
    ),
    "ts-trs-comparison": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* TS Jack */}
        <rect x="20" y="30" width="60" height="8" fill="#4a5568" rx="4" />
        <rect x="20" y="32" width="30" height="4" fill="#e2e8f0" /> {/* Tip */}
        <rect x="55" y="32" width="25" height="4" fill="#2d3748" /> {/* Sleeve */}
        <line x1="50" y1="30" x2="50" y2="46" stroke="#1a202c" strokeWidth="1" />

        <text x="50" y="25" fill="#2d3748" fontSize="10" textAnchor="middle">TS (Unbalanced)</text>
        <text x="35" y="55" fill="#2d3748" fontSize="7" textAnchor="middle">Tip</text>
        <text x="67" y="55" fill="#2d3748" fontSize="7" textAnchor="middle">Sleeve</text>

        {/* TRS Jack */}
        <rect x="120" y="30" width="60" height="8" fill="#4a5568" rx="4" />
        <rect x="120" y="32" width="20" height="4" fill="#e2e8f0" /> {/* Tip */}
        <rect x="145" y="32" width="15" height="4" fill="#cbd5e0" /> {/* Ring */}
        <rect x="165" y="32" width="15" height="4" fill="#2d3748" /> {/* Sleeve */}

        <line x1="140" y1="30" x2="140" y2="46" stroke="#1a202c" strokeWidth="1" />
        <line x1="160" y1="30" x2="160" y2="46" stroke="#1a202c" strokeWidth="1" />

        <text x="150" y="25" fill="#2d3748" fontSize="10" textAnchor="middle">TRS (Balanced/Stereo)</text>
        <text x="130" y="55" fill="#2d3748" fontSize="7" textAnchor="middle">Tip</text>
        <text x="152" y="55" fill="#2d3748" fontSize="7" textAnchor="middle">Ring</text>
        <text x="172" y="55" fill="#2d3748" fontSize="7" textAnchor="middle">Sleeve</text>

        {/* Usage examples */}
        <text x="50" y="70" fill="#3182ce" fontSize="8" textAnchor="middle">Guitar cables</text>
        <text x="150" y="70" fill="#3182ce" fontSize="8" textAnchor="middle">Headphones/Balanced</text>
      </svg>
    ),
    "balanced-signal": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* Signal waves */}
        <path d="M20,40 Q30,30 40,40 Q50,50 60,40 Q70,30 80,40" stroke="#3182ce" strokeWidth="2" fill="none" />
        <text x="50" y="25" fill="#3182ce" fontSize="8" textAnchor="middle">Hot (+)</text>

        <path d="M20,60 Q30,70 40,60 Q50,50 60,60 Q70,70 80,60" stroke="#e53e3e" strokeWidth="2" fill="none" />
        <text x="50" y="80" fill="#e53e3e" fontSize="8" textAnchor="middle">Cold (-)</text>

        {/* Noise */}
        <path d="M20,35 L25,32 L30,38 L35,35 L40,32 L45,38 L50,35 L55,32 L60,38 L65,35 L70,32 L75,38 L80,35"
              stroke="#9ca3af" strokeWidth="1" fill="none" strokeDasharray="2,1" />
        <text x="50" y="20" fill="#9ca3af" fontSize="6" textAnchor="middle">Noise (same on both)</text>

        {/* At receiving end */}
        <text x="120" y="30" fill="#2d3748" fontSize="9" textAnchor="middle">At Receiver:</text>
        <text x="120" y="45" fill="#2d3748" fontSize="8" textAnchor="middle">Hot - Cold = Clean Signal</text>
        <text x="120" y="60" fill="#2d3748" fontSize="8" textAnchor="middle">(Noise cancels out)</text>

        {/* Clean output */}
        <path d="M140,75 Q150,65 160,75 Q170,85 180,75" stroke="#10b981" strokeWidth="3" fill="none" />
        <text x="160" y="90" fill="#10b981" fontSize="8" textAnchor="middle">Clean Output</text>
      </svg>
    ),
    "rca-connectors": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* Red RCA */}
        <circle cx="60" cy="40" r="15" fill="#e53e3e" />
        <circle cx="60" cy="40" r="8" fill="#2d3748" />
        <circle cx="60" cy="40" r="3" fill="#e2e8f0" />
        <text x="60" y="65" fill="#e53e3e" fontSize="10" textAnchor="middle">Red (Right)</text>

        {/* White RCA */}
        <circle cx="140" cy="40" r="15" fill="#f7fafc" stroke="#2d3748" strokeWidth="2" />
        <circle cx="140" cy="40" r="8" fill="#2d3748" />
        <circle cx="140" cy="40" r="3" fill="#e2e8f0" />
        <text x="140" y="65" fill="#2d3748" fontSize="10" textAnchor="middle">White (Left)</text>

        {/* Connection line */}
        <line x1="75" y1="40" x2="125" y2="40" stroke="#4a5568" strokeWidth="3" />

        <text x="100" y="20" fill="#2d3748" fontSize="12" textAnchor="middle">RCA Stereo Pair</text>
        <text x="100" y="85" fill="#4a5568" fontSize="9" textAnchor="middle">Consumer Audio / DJ Equipment</text>
      </svg>
    ),
    "xlr-pinout": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* XLR connector diagram */}
        <circle cx="100" cy="45" r="25" fill="#4a5568" stroke="#2d3748" strokeWidth="2" />
        <circle cx="100" cy="45" r="20" fill="#2d3748" />

        {/* Pins with labels */}
        <circle cx="100" cy="32" r="3" fill="#e2e8f0" />
        <text x="100" y="36" fill="#f7fafc" fontSize="7" textAnchor="middle" fontWeight="bold">1</text>

        <circle cx="88" cy="55" r="3" fill="#e2e8f0" />
        <text x="88" y="59" fill="#f7fafc" fontSize="7" textAnchor="middle" fontWeight="bold">2</text>

        <circle cx="112" cy="55" r="3" fill="#e2e8f0" />
        <text x="112" y="59" fill="#f7fafc" fontSize="7" textAnchor="middle" fontWeight="bold">3</text>

        {/* Clear external labels */}
        <text x="100" y="20" fill="#2d3748" fontSize="7" textAnchor="middle">1 = Ground</text>
        <text x="65" y="75" fill="#2d3748" fontSize="7" textAnchor="middle">2 = Hot (+)</text>
        <text x="135" y="75" fill="#2d3748" fontSize="7" textAnchor="middle">3 = Cold (-)</text>

        <text x="100" y="10" fill="#2d3748" fontSize="9" textAnchor="middle">Standard XLR Pinout</text>
      </svg>
    ),
    "cable-length-effects": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* Short cable - clean signal */}
        <text x="20" y="20" fill="#2d3748" fontSize="8">Short Cable (3ft)</text>
        <path d="M20,25 Q30,15 40,25 Q50,35 60,25 Q70,15 80,25 Q90,35 100,25"
              stroke="#10b981" strokeWidth="2" fill="none" />
        <text x="60" y="40" fill="#10b981" fontSize="7" textAnchor="middle">Clean & Bright</text>

        {/* Long cable - degraded signal */}
        <text x="20" y="60" fill="#2d3748" fontSize="8">Long Cable (20ft)</text>
        <path d="M20,65 Q30,58 40,65 Q50,70 60,65 Q70,60 80,65 Q90,68 100,65"
              stroke="#e53e3e" strokeWidth="2" fill="none" strokeDasharray="2,1" />
        <text x="60" y="80" fill="#e53e3e" fontSize="7" textAnchor="middle">Dull & Noisy</text>

        {/* Noise visualization */}
        <path d="M105,25 L110,22 L115,28 L120,25 L125,22 L130,28 L135,25"
              stroke="#9ca3af" strokeWidth="1" fill="none" />
        <path d="M105,65 L110,58 L115,72 L120,60 L125,70 L130,62 L135,68"
              stroke="#9ca3af" strokeWidth="1" fill="none" />

        <text x="150" y="30" fill="#2d3748" fontSize="8">High-frequency loss</text>
        <text x="150" y="45" fill="#2d3748" fontSize="8">and noise pickup</text>
        <text x="150" y="60" fill="#2d3748" fontSize="8">increase with</text>
        <text x="150" y="75" fill="#2d3748" fontSize="8">cable length</text>
      </svg>
    ),
    "mini-jack-wiring": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* 3.5mm connector */}
        <rect x="60" y="40" width="50" height="6" fill="#4a5568" rx="3" />
        <rect x="60" y="41" width="16" height="4" fill="#e2e8f0" /> {/* Tip */}
        <rect x="80" y="41" width="14" height="4" fill="#cbd5e0" /> {/* Ring */}
        <rect x="98" y="41" width="12" height="4" fill="#2d3748" /> {/* Sleeve */}

        <line x1="76" y1="40" x2="76" y2="52" stroke="#1a202c" strokeWidth="1" />
        <line x1="94" y1="40" x2="94" y2="52" stroke="#1a202c" strokeWidth="1" />

        {/* Labels */}
        <text x="68" y="60" fill="#2d3748" fontSize="7" textAnchor="middle">Tip</text>
        <text x="68" y="70" fill="#2d3748" fontSize="6" textAnchor="middle">Left</text>

        <text x="87" y="60" fill="#2d3748" fontSize="7" textAnchor="middle">Ring</text>
        <text x="87" y="70" fill="#2d3748" fontSize="6" textAnchor="middle">Right</text>

        <text x="104" y="60" fill="#2d3748" fontSize="7" textAnchor="middle">Sleeve</text>
        <text x="104" y="70" fill="#2d3748" fontSize="6" textAnchor="middle">Ground</text>

        <text x="85" y="30" fill="#2d3748" fontSize="10" textAnchor="middle">3.5mm TRS</text>
        <text x="85" y="20" fill="#2d3748" fontSize="9" textAnchor="middle">Stereo Mini-Jack</text>
        <text x="85" y="85" fill="#4a5568" fontSize="8" textAnchor="middle">Phone/Laptop Connection</text>
      </svg>
    ),
    "speakon-connector": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* Speakon connector body */}
        <circle cx="80" cy="50" r="20" fill="#1e40af" stroke="#1e3a8a" strokeWidth="2" />

        {/* Locking mechanism */}
        <path d="M70,35 Q80,28 90,35" stroke="#3b82f6" strokeWidth="2" fill="none" />
        <circle cx="80" cy="35" r="2" fill="#3b82f6" />

        {/* Connection points */}
        <rect x="75" y="46" width="10" height="8" fill="#1e3a8a" rx="1" />
        <circle cx="77" cy="50" r="1.5" fill="#f1f5f9" />
        <circle cx="83" cy="50" r="1.5" fill="#f1f5f9" />

        {/* Cable */}
        <rect x="100" y="46" width="35" height="8" fill="#374151" rx="4" />

        {/* Clear labels positioned outside connector */}
        <text x="80" y="15" fill="#2d3748" fontSize="9" textAnchor="middle">Speakon Connector</text>
        <text x="50" y="40" fill="#2d3748" fontSize="7" textAnchor="middle">Twist to lock</text>
        <text x="80" y="85" fill="#2d3748" fontSize="7" textAnchor="middle">Locking Mechanism</text>
        <text x="150" y="40" fill="#2d3748" fontSize="7" textAnchor="middle">High Current</text>
        <text x="150" y="50" fill="#2d3748" fontSize="7" textAnchor="middle">Speaker Cable</text>
      </svg>
    ),
    "digital-rca": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* Orange RCA for digital */}
        <circle cx="70" cy="40" r="18" fill="#fb923c" />
        <circle cx="70" cy="40" r="10" fill="#2d3748" />
        <circle cx="70" cy="40" r="4" fill="#f1f5f9" />
        <text x="70" y="70" fill="#fb923c" fontSize="10" textAnchor="middle">Orange RCA</text>
        <text x="70" y="80" fill="#2d3748" fontSize="8" textAnchor="middle">S/PDIF Digital</text>

        {/* Digital signal representation */}
        <rect x="100" y="35" width="3" height="10" fill="#3b82f6" />
        <rect x="108" y="35" width="3" height="5" fill="#3b82f6" />
        <rect x="116" y="35" width="3" height="10" fill="#3b82f6" />
        <rect x="124" y="35" width="3" height="7" fill="#3b82f6" />
        <rect x="132" y="35" width="3" height="3" fill="#3b82f6" />

        <text x="120" y="55" fill="#2d3748" fontSize="8" textAnchor="middle">Digital Data</text>
        <text x="120" y="20" fill="#2d3748" fontSize="9" textAnchor="middle">75&#937; Impedance Required</text>

        {/* Warning */}
        <text x="100" y="75" fill="#e53e3e" fontSize="7">Standard RCA cables may</text>
        <text x="100" y="85" fill="#e53e3e" fontSize="7">not have correct impedance</text>
      </svg>
    ),
    "impedance-matching": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* High impedance source */}
        <rect x="20" y="30" width="30" height="20" fill="#e53e3e" />
        <text x="35" y="42" fill="#f1f5f9" fontSize="8" textAnchor="middle">High Z</text>
        <text x="35" y="55" fill="#2d3748" fontSize="7" textAnchor="middle">Guitar</text>

        {/* DI Box */}
        <rect x="80" y="25" width="40" height="30" fill="#4a5568" />
        <text x="100" y="40" fill="#f1f5f9" fontSize="8" textAnchor="middle">DI BOX</text>
        <text x="100" y="50" fill="#f1f5f9" fontSize="6" textAnchor="middle">Impedance</text>
        <text x="100" y="60" fill="#f1f5f9" fontSize="6" textAnchor="middle">Converter</text>

        {/* Low impedance output */}
        <rect x="150" y="30" width="30" height="20" fill="#10b981" />
        <text x="165" y="42" fill="#f1f5f9" fontSize="8" textAnchor="middle">Low Z</text>
        <text x="165" y="55" fill="#2d3748" fontSize="7" textAnchor="middle">Mixer</text>

        {/* Arrows */}
        <path d="M50,40 L75,40" stroke="#2d3748" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M125,40 L145,40" stroke="#2d3748" strokeWidth="2" markerEnd="url(#arrowhead)" />

        <text x="100" y="15" fill="#2d3748" fontSize="9" textAnchor="middle">Impedance Matching</text>
        <text x="100" y="80" fill="#2d3748" fontSize="8" textAnchor="middle">Maximum Power Transfer</text>

        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#2d3748" />
          </marker>
        </defs>
      </svg>
    ),
    "signal-troubleshooting": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* Signal chain */}
        <rect x="10" y="35" width="20" height="15" fill="#3b82f6" />
        <text x="20" y="45" fill="#f1f5f9" fontSize="6" textAnchor="middle">Source</text>

        <line x1="30" y1="42" x2="50" y2="42" stroke="#2d3748" strokeWidth="2" />
        <text x="40" y="35" fill="#2d3748" fontSize="6" textAnchor="middle">Cable 1</text>

        <rect x="50" y="35" width="20" height="15" fill="#4a5568" />
        <text x="60" y="45" fill="#f1f5f9" fontSize="6" textAnchor="middle">Device</text>

        <line x1="70" y1="42" x2="90" y2="42" stroke="#2d3748" strokeWidth="2" />
        <text x="80" y="35" fill="#2d3748" fontSize="6" textAnchor="middle">Cable 2</text>

        <rect x="90" y="35" width="20" height="15" fill="#10b981" />
        <text x="100" y="45" fill="#f1f5f9" fontSize="6" textAnchor="middle">Output</text>

        {/* Problem indicators */}
        <text x="40" y="60" fill="#e53e3e" fontSize="8">X</text>
        <text x="40" y="70" fill="#e53e3e" fontSize="6">Faulty?</text>

        {/* Troubleshooting steps */}
        <text x="130" y="20" fill="#2d3748" fontSize="8">Troubleshooting Steps:</text>
        <text x="130" y="35" fill="#2d3748" fontSize="7">1. Check connections</text>
        <text x="130" y="45" fill="#2d3748" fontSize="7">2. Test cables individually</text>
        <text x="130" y="55" fill="#2d3748" fontSize="7">3. Verify signal levels</text>
        <text x="130" y="65" fill="#2d3748" fontSize="7">4. Check impedance</text>
        <text x="130" y="75" fill="#2d3748" fontSize="7">5. Look for ground loops</text>
      </svg>
    ),
    "digital-xlr": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32">
        <rect x="0" y="0" width="200" height="100" fill="#f8fafc" />

        {/* XLR connector */}
        <circle cx="70" cy="45" r="20" fill="#4a5568" stroke="#2d3748" strokeWidth="2" />
        <circle cx="70" cy="38" r="2" fill="#e2e8f0" />
        <circle cx="63" cy="50" r="2" fill="#e2e8f0" />
        <circle cx="77" cy="50" r="2" fill="#e2e8f0" />

        {/* Digital signal */}
        <rect x="100" y="40" width="2" height="10" fill="#3b82f6" />
        <rect x="105" y="40" width="2" height="6" fill="#3b82f6" />
        <rect x="110" y="40" width="2" height="10" fill="#3b82f6" />
        <rect x="115" y="40" width="2" height="4" fill="#3b82f6" />
        <rect x="120" y="40" width="2" height="8" fill="#3b82f6" />

        <text x="70" y="75" fill="#2d3748" fontSize="10" textAnchor="middle">AES/EBU Digital</text>
        <text x="111" y="60" fill="#3b82f6" fontSize="8" textAnchor="middle">Digital Audio</text>

        {/* Specifications */}
        <text x="145" y="30" fill="#2d3748" fontSize="8">110&#937; Impedance</text>
        <text x="145" y="40" fill="#2d3748" fontSize="7">Different from analog</text>
        <text x="145" y="50" fill="#2d3748" fontSize="7">XLR cables (75&#937;)</text>

        <text x="145" y="70" fill="#e53e3e" fontSize="7">Requires proper</text>
        <text x="145" y="80" fill="#e53e3e" fontSize="7">digital audio cable</text>
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
  const [reviewHistory, setReviewHistory] = useState([]);

  // Filter available cards based on selected difficulty
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

  // Calculate mastery score whenever confidence changes
  useEffect(() => {
    if (currentCards.length > 0) {
      const totalCards = currentCards.length;
      const masteredCards = Object.values(confidence).filter(Boolean).length;
      setMasteryScore((masteredCards / totalCards) * 100);
    }
  }, [confidence, currentCards]);

  const handleNext = () => {
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setShowHint(false);
    } else if (Object.keys(confidence).length > 0) {
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

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);

    if (!showAnswer && reviewHistory.findIndex(h => h.cardId === currentCards[currentIndex].id) === -1) {
      setReviewHistory([
        ...reviewHistory,
        {
          cardId: currentCards[currentIndex].id,
          question: currentCards[currentIndex].question,
          timestamp: new Date().toISOString(),
          timesReviewed: 1
        }
      ]);
    }
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setConfidence({});
    setShowSummary(false);
    setShowHint(false);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const setCardConfidence = (confident) => {
    setConfidence({
      ...confidence,
      [currentCards[currentIndex].id]: confident
    });

    const existingIndex = reviewHistory.findIndex(h => h.cardId === currentCards[currentIndex].id);
    if (existingIndex !== -1) {
      const updatedHistory = [...reviewHistory];
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        lastReviewed: new Date().toISOString(),
        confident: confident,
        timesReviewed: updatedHistory[existingIndex].timesReviewed + 1
      };
      setReviewHistory(updatedHistory);
    }

    setTimeout(handleNext, 300);
  };

  const needsReview = currentCards.filter(card => confidence[card.id] === false);
  const mastered = currentCards.filter(card => confidence[card.id] === true);
  const notReviewed = currentCards.filter(card => confidence[card.id] === undefined);

  const getCardsByCategory = (cards) => {
    const categories = {};
    cards.forEach(card => {
      if (!categories[card.category]) {
        categories[card.category] = [];
      }
      categories[card.category].push(card);
    });
    return categories;
  };

  const masteredByCategory = getCardsByCategory(mastered);
  const needsReviewByCategory = getCardsByCategory(needsReview);

  const getProgressColor = (score) => {
    if (score < 30) return "bg-red-500";
    if (score < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const SummaryView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-3">Audio Leads & Connectors Mastery</h2>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <PieChart className="h-5 w-5 text-blue-600" />
          Overall Progress
        </h3>
        <div className="mb-2">
          <Progress value={masteryScore} className={`h-2 ${getProgressColor(masteryScore)}`} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-medium">Mastered</div>
            <div className="text-green-600 font-bold">{mastered.length}</div>
          </div>
          <div>
            <div className="font-medium">Need Review</div>
            <div className="text-red-600 font-bold">{needsReview.length}</div>
          </div>
          <div>
            <div className="font-medium">Not Seen</div>
            <div className="text-gray-600 font-bold">{notReviewed.length}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flashcardReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fc-scroll-item {
          animation: flashcardReveal 1s ease both;
          animation-timeline: view();
          animation-range: entry 0% entry 100%;
        }
        .fc-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .fc-scroll-container::-webkit-scrollbar { width: 4px; }
        .fc-scroll-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .fc-scroll-item { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
      {Object.keys(needsReviewByCategory).length > 0 ? (
        <div className="mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Study Recommendations
          </h3>
          <div className="space-y-4 fc-scroll-container" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {Object.entries(needsReviewByCategory).map(([category, cards], idx) => (
              <div key={idx} className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-medium capitalize mb-2">{category} ({cards.length})</h4>
                <ul className="space-y-2">
                  {cards.map((card, cardIdx) => (
                    <li key={cardIdx} className="fc-scroll-item bg-white p-2 rounded border-l-4 border-red-400">
                      <p className="font-medium">{card.question}</p>
                      <p className="text-sm text-gray-600 mt-1">{card.practicalExample}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-lg text-center mb-6">
          <p className="font-medium text-green-800">Brilliant! You've mastered all the connectors you've studied.</p>
          {notReviewed.length > 0 && (
            <p className="text-sm mt-2">You have {notReviewed.length} cards left to review.</p>
          )}
        </div>
      )}

      {Object.keys(masteredByCategory).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <BookmarkCheck className="h-5 w-5 text-green-600" />
            Mastered Concepts
          </h3>
          <div className="space-y-4 fc-scroll-container" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {Object.entries(masteredByCategory).map(([category, cards], idx) => (
              <div key={idx} className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium capitalize mb-2">{category} ({cards.length})</h4>
                <ul className="space-y-2">
                  {cards.map((card, cardIdx) => (
                    <li key={cardIdx} className="fc-scroll-item bg-white p-2 rounded border-l-4 border-green-400">
                      <p className="font-medium">{card.question}</p>
                      <p className="text-sm text-gray-600 mt-1">{card.furtherLearning}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={resetDeck}
          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800"
        >
          <RefreshCcw className="h-4 w-4" />
          Study Again
        </Button>

        <Button
          onClick={() => {
            setDifficulty(difficulty === "basic" ? "intermediate" : difficulty === "intermediate" ? "advanced" : "basic");
            setShowSummary(false);
            resetDeck();
          }}
          className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800"
        >
          {difficulty === "advanced" ? (
            <>
              <Star className="h-4 w-4" />
              Try Basic Concepts
            </>
          ) : (
            <>
              <Star className="h-4 w-4" />
              Try {difficulty === "basic" ? "Intermediate" : "Advanced"} Concepts
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (showSummary) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <SummaryView />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-blue-800">Audio Leads & Connectors</h2>

        <div className="flex gap-2">
          <Tabs
            defaultValue="learn"
            value={studyMode}
            onValueChange={setStudyMode}
            className="h-9"
          >
            <TabsList className="h-8">
              <TabsTrigger value="learn" className="text-xs px-2 py-1 h-7">
                <BookCopy className="h-3 w-3 mr-1" />
                Learn
              </TabsTrigger>
              <TabsTrigger value="test" className="text-xs px-2 py-1 h-7">
                <Brain className="h-3 w-3 mr-1" />
                Test
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            defaultValue="basic"
            value={difficulty}
            onValueChange={setDifficulty}
            className="h-9"
          >
            <TabsList className="h-8">
              <TabsTrigger value="basic" className="text-xs px-2 py-1 h-7">Basic</TabsTrigger>
              <TabsTrigger value="intermediate" className="text-xs px-2 py-1 h-7">Intermediate</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs px-2 py-1 h-7">Advanced</TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2 py-1 h-7">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {showInstructions && (
        <Alert className="bg-blue-50 mb-4 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            <h3 className="font-semibold mb-2">Audio Connector Study Guide:</h3>
            <ol className="list-decimal pl-4 space-y-1 text-sm">
              <li>Study different types of audio connectors and their applications</li>
              <li>Learn to distinguish between balanced and unbalanced connections</li>
              <li>Understand when to use each connector type in studio situations</li>
              <li>Use visual hints to see connector diagrams and wiring</li>
              <li>Perfect for A Level Music Technology students!</li>
            </ol>
            <Button
              variant="outline"
              className="mt-2 bg-blue-100"
              onClick={() => setShowInstructions(false)}
            >
              Got it!
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 text-center space-y-2">
        <div className="flex justify-center gap-1 flex-wrap">
          {currentCards.map((card) => (
            <div
              key={card.id}
              className={`h-2 w-5 rounded-full transition-colors duration-300 ${
                confidence[card.id] !== undefined
                  ? confidence[card.id]
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : card.id === currentCards[currentIndex].id
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Card {currentIndex + 1} of {currentCards.length}</span>
          <span className="flex items-center">
            <BookmarkCheck className="h-3 w-3 text-green-500 mr-1" />
            Mastered: {Object.values(confidence).filter(Boolean).length} of {currentCards.length}
          </span>
          <span className="flex items-center">
            <Sparkles className="h-3 w-3 text-blue-500 mr-1" />
            {currentCards[currentIndex].category}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor(masteryScore)}`}
            style={{ width: `${masteryScore}%` }}
          ></div>
        </div>
      </div>

      <Card
        className={`mb-4 transform transition-all duration-300 ${
          showAnswer ? 'scale-105' : ''
        }`}
      >
        <CardContent
          className={`p-6 transition-colors duration-300 ${
            showAnswer ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              {[...Array(currentCards[currentIndex].difficulty)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleHint}
              className="h-8 text-xs flex items-center gap-1 text-blue-600"
            >
              <Lightbulb className="h-3 w-3" />
              {showHint ? "Hide Hint" : "Visual Hint"}
            </Button>
          </div>

          <div
            className={`flex flex-col justify-between transition-all duration-500 ${
              showAnswer ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 min-h-48'
            }`}
          >
            <div
              className="flex items-center justify-center cursor-pointer py-8"
              onClick={toggleAnswer}
            >
              <p className="text-xl text-center leading-relaxed font-medium">
                {currentCards[currentIndex].question}
              </p>
            </div>

            {showHint && (
              <div className="mt-4 p-2 bg-white rounded-lg border border-gray-200">
                {illustrations[currentCards[currentIndex].image]}
              </div>
            )}

            <div className="flex justify-center mt-4">
              <Button
                onClick={toggleAnswer}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {studyMode === "learn" ? "Show Explanation" : "Show Answer"}
              </Button>
            </div>
          </div>

          <div
            className={`transition-all duration-500 ${
              showAnswer ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
            }`}
          >
            <div className="py-4">
              <p className="text-lg text-center leading-relaxed font-medium mb-6">
                {currentCards[currentIndex].answer}
              </p>

              <div className="mb-6">
                {illustrations[currentCards[currentIndex].image]}
              </div>

              {studyMode === "learn" && (
                <div className="mt-4 space-y-3">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      <span className="font-semibold">Practical Example: </span>
                      {currentCards[currentIndex].practicalExample}
                    </p>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Try This: </span>
                      {currentCards[currentIndex].furtherLearning}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                className="bg-red-50 hover:bg-red-100 transition-colors"
                onClick={() => setCardConfidence(false)}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Need Review
              </Button>
              <Button
                variant="outline"
                className="bg-green-50 hover:bg-green-100 transition-colors"
                onClick={() => setCardConfidence(true)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Got It!
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={resetDeck}
            variant="outline"
            className="flex items-center gap-2 hover:bg-yellow-100 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          {Object.keys(confidence).length > 0 && (
            <Button
              onClick={() => setShowSummary(true)}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-100 transition-colors"
            >
              <BarChart className="h-4 w-4" />
              Summary
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === currentCards.length - 1 && studyMode === "test" && !showAnswer}
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AudioLeadsFlashcards;
