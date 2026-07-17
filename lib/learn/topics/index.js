import { EQ_CHAPTERS } from './eq.js';
import { SYNTHESIS_CHAPTERS } from './synthesis.js';
import { DYNAMICS_CHAPTERS } from './dynamics.js';
import { DELAY_CHAPTERS } from './delay.js';
import { REVERB_CHAPTERS } from './reverb.js';
import { SAMPLING_CHAPTERS } from './sampling.js';

// Maps interactive-resources topic IDs to arrays of lessons
const learnTopics = {
    eq: EQ_CHAPTERS,
    synthesis: SYNTHESIS_CHAPTERS,
    dynamics: DYNAMICS_CHAPTERS,
    delay: DELAY_CHAPTERS,
    reverb: REVERB_CHAPTERS,
    sampling: SAMPLING_CHAPTERS,
};

// Rationale sentences for single-chapter (minor-topic) learn courses — shown
// in the picker header intro instead of the generic "Choose a lesson…" line.
// Wave-3 topic tasks populate this map as each single-chapter topic ships.
const learnRationales = {};

// Linked resources that appear on the Learn picker alongside lessons
// These are standalone interactive resources that support the learning flow
const learnResources = {
    dynamics: [
        {
            id: 'compressor-image-explorer',
            title: 'Compressor Interface',
            subtitle: 'Ableton Live',
            description: 'Explore a real compressor interface — click on each control to learn what threshold, ratio, attack, release, knee and makeup gain do.',
            href: '/compressor-image-explorer',
            estimatedTime: '10-15 minutes',
        },
        {
            id: 'gate-image-explorer',
            title: 'Gate Interface',
            subtitle: 'Ableton Live',
            description: 'Explore a real gate interface — click on each control to learn what threshold, return, attack, hold, release and floor do.',
            href: '/gate-image-explorer',
            estimatedTime: '10-15 minutes',
        },
    ],
    eq: [
        {
            id: 'eq-video-overview',
            title: 'EQ Video Overview',
            subtitle: 'Video Overview',
            description: 'Watch a cinematic overview of equalisation — filter types, graphic vs parametric EQ, and Q factor explained visually. Take notes as you watch.',
            href: '/learn/eq/video-overview',
            estimatedTime: '4 minutes',
        },
        {
            id: 'autofilter-image-explorer',
            title: 'Auto Filter Interface',
            subtitle: 'Ableton Live',
            description: 'Explore the Auto Filter interface — learn what filter type, slope, frequency, resonance and sidechain do.',
            href: '/autofilter-image-explorer',
            estimatedTime: '10-15 minutes',
        },
        {
            id: 'eq8-image-explorer',
            title: 'EQ Eight Interface',
            subtitle: 'Ableton Live',
            description: 'Explore the EQ Eight interface — learn what band selectors, frequency, gain and Q do.',
            href: '/eq8-image-explorer',
            estimatedTime: '10-15 minutes',
        },
        {
            id: 'eq-study-flow',
            title: 'EQ Study Layout',
            subtitle: 'Study Mode',
            description: 'Build your own revision layout — drag EQ diagrams around the text to create a personalised study sheet.',
            href: '/learn/eq/study',
            estimatedTime: '10-20 minutes',
        },
    ],
    synthesis: [
        {
            id: 'operator-image-explorer',
            title: 'Operator Interface',
            subtitle: 'Ableton Live',
            description: 'Explore the Operator synthesiser interface — learn what oscillators, coarse/fine, level, algorithm, envelope, filter and LFO do.',
            href: '/operator-image-explorer',
            estimatedTime: '10-15 minutes',
        },
    ],
    reverb: [
        {
            id: 'reverb-image-explorer',
            title: 'Reverb Interface',
            subtitle: 'Ableton Live',
            description: 'Explore the Reverb interface — learn what pre-delay, decay, diffusion, damping, early reflections and dry/wet do.',
            href: '/reverb-image-explorer',
            estimatedTime: '10-15 minutes',
        },
    ],
    delay: [
        {
            id: 'delay-types-carousel',
            title: 'Six Delay Types',
            subtitle: 'Orientation',
            description: 'A visual map of the six delay forms in 1.12 — clean, multi-tap, slapback, tape echo, ping-pong and modulated. Browse the territory before drilling into each.',
            href: '/learn/delay/types-carousel',
            estimatedTime: '5 minutes',
        },
        {
            id: 'delay-image-explorer',
            title: 'Delay Interface',
            subtitle: 'Ableton Live',
            description: 'Explore the Delay interface — learn what delay time, sync, feedback, filter, ping pong and dry/wet do.',
            href: '/delay-image-explorer',
            estimatedTime: '10-15 minutes',
        },
        {
            id: 'delay-flashcards',
            title: 'Delay Flashcards',
            subtitle: 'Revision',
            description: 'Spaced-repetition flashcards covering delay parameters, creative applications, and corrective techniques. Foundation, Standard and Advanced tiers.',
            href: '/delay-flashcards',
            estimatedTime: '20-40 minutes',
        },
    ],
};

/**
 * Get all lessons for an interactive-resources topic ID.
 * Returns empty array if no learn content exists.
 */
export function getLearnLessons(topicId) {
    return learnTopics[topicId] || [];
}

/**
 * Get a specific lesson by topic and lesson ID.
 * Returns null if not found.
 */
export function getLearnLesson(topicId, lessonId) {
    const lessons = learnTopics[topicId] || [];
    return lessons.find(l => l.id === lessonId) || null;
}

/**
 * Check if a topic has learn content available.
 */
export function hasLearnContent(topicId) {
    return topicId in learnTopics;
}

/**
 * Get all topic IDs that have learn content.
 */
export function getLearnTopicIds() {
    return Object.keys(learnTopics);
}

/**
 * Get linked resources for the learn picker.
 * Returns empty array if none exist.
 */
export function getLearnResources(topicId) {
    return learnResources[topicId] || [];
}

/**
 * Get the rationale sentence for a single-chapter learn topic.
 * Returns the string, or null if no rationale is set.
 */
export function getLearnRationale(topicId) {
    return learnRationales[topicId] ?? null;
}

/**
 * Get all [topicId, lessonId] pairs for static generation.
 */
export function getAllLearnPaths() {
    const paths = [];
    for (const [topicId, lessons] of Object.entries(learnTopics)) {
        for (const lesson of lessons) {
            paths.push({ topicId, lessonId: lesson.id });
        }
    }
    return paths;
}
