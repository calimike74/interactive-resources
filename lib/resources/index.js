// Interactive Resources Registry
// Central registry for all interactive learning resources

import eqFilterBridge from './eq-filter-bridge';
import octavePeriodTrainer from './octave-period-trainer';
import midiPitchBendController from './midi-pitch-bend-controller';
import filterRolloffVisualization from './filter-rolloff-visualization';
import acousticsFlashcards from './acoustics-flashcards';
import doubleTrackingExplorer from './double-tracking-explorer';
import graphicParametricEq from './graphic-parametric-eq';
import revealExplorer from './reveal-explorer';
import eqAssessmentPrototype from './eq-assessment-prototype';
import essayScaffold from './essay-scaffold';
import subtractiveSynthExplorer from './subtractive-synth-explorer';
import stereoRecordingEssay from './stereo-recording-essay';
import compressorExplorer from './compressor-explorer';
import compressorCurvePractice from './compressor-curve-practice';
import essayScaffoldPractice from './essay-scaffold-practice';
import delayEffects from './delay-effects';
import digitalAnalogue from './digital-analogue';
import audioLeadsFlashcards from './audio-leads-flashcards';
import combinedDistortionLab from './combined-distortion-lab';
import stereoPanning from './stereo-panning';
import adcExplorer from './adc-explorer';
import signalChainBuilder from './signal-chain-builder';
import signalChainEurorack from './signal-chain-eurorack';
import compressorImageExplorer from './compressor-image-explorer';
import compressorAssessment from './compressor-assessment';
import gateImageExplorer from './gate-image-explorer';
import gateAssessment from './gate-assessment';
import autofilterImageExplorer from './autofilter-image-explorer';
import autofilterAssessment from './autofilter-assessment';
import eq8ImageExplorer from './eq8-image-explorer';
import eq8Assessment from './eq8-assessment';
import reverbImageExplorer from './reverb-image-explorer';
import reverbAssessment from './reverb-assessment';
import delayImageExplorer from './delay-image-explorer';
import delayAssessment from './delay-assessment';
import delayFlashcards from './delay-flashcards';
import operatorImageExplorer from './operator-image-explorer';
import operatorAssessment from './operator-assessment';
import patchBaySimulator from './patch-bay-simulator';
import samplingPlayground from './sampling-playground';
import rtqDynamicCompression from './rtq-dynamic-compression';
import waveformExplorer from './waveform-explorer';
import bpmDelayCalculator from './bpm-delay-calculator';

// Register all resources here
const resources = {
    'eq-filter-bridge': eqFilterBridge,
    'octave-period-trainer': octavePeriodTrainer,
    'midi-pitch-bend-controller': midiPitchBendController,
    'filter-rolloff-visualization': filterRolloffVisualization,
    'acoustics-flashcards': acousticsFlashcards,
    'double-tracking-explorer': doubleTrackingExplorer,
    'graphic-parametric-eq': graphicParametricEq,
    'reveal-explorer': revealExplorer,
    'eq-assessment-prototype': eqAssessmentPrototype,
    'essay-scaffold': essayScaffold,
    'subtractive-synth-explorer': subtractiveSynthExplorer,
    'stereo-recording-essay': stereoRecordingEssay,
    'compressor-explorer': compressorExplorer,
    'compressor-curve-practice': compressorCurvePractice,
    'essay-scaffold-practice': essayScaffoldPractice,
    'delay-effects': delayEffects,
    'digital-analogue': digitalAnalogue,
    'audio-leads-flashcards': audioLeadsFlashcards,
    'combined-distortion-lab': combinedDistortionLab,
    'stereo-panning': stereoPanning,
    'adc-explorer': adcExplorer,
    'signal-chain-builder': signalChainBuilder,
    'signal-chain-eurorack': signalChainEurorack,
    'compressor-image-explorer': compressorImageExplorer,
    'compressor-assessment': compressorAssessment,
    'gate-image-explorer': gateImageExplorer,
    'gate-assessment': gateAssessment,
    'autofilter-image-explorer': autofilterImageExplorer,
    'autofilter-assessment': autofilterAssessment,
    'eq8-image-explorer': eq8ImageExplorer,
    'eq8-assessment': eq8Assessment,
    'reverb-image-explorer': reverbImageExplorer,
    'reverb-assessment': reverbAssessment,
    'delay-image-explorer': delayImageExplorer,
    'delay-assessment': delayAssessment,
    'delay-flashcards': delayFlashcards,
    'operator-image-explorer': operatorImageExplorer,
    'operator-assessment': operatorAssessment,
    'patch-bay-simulator': patchBaySimulator,
    'sampling-playground': samplingPlayground,
    'rtq-dynamic-compression': rtqDynamicCompression,
    'waveform-explorer': waveformExplorer,
    'bpm-delay-calculator': bpmDelayCalculator,
    // Add more resources as they're converted:
    // 'adsr-interactive': adsrInteractive,
};

/**
 * Get all registered resources (excludes hidden ones)
 * @returns {Array} Array of resource objects
 */
export function getAllResources() {
    return Object.values(resources).filter(r => !r.hidden);
}

/**
 * Get a single resource by ID
 * @param {string} id - Resource ID
 * @returns {Object|undefined} Resource object or undefined
 */
export function getResource(id) {
    return resources[id];
}

/**
 * Check if a resource exists
 * @param {string} id - Resource ID
 * @returns {boolean}
 */
export function resourceExists(id) {
    return id in resources;
}

/**
 * Get all unique topics that have resources
 * @returns {Array} Array of topic strings
 */
export function getAllTopics() {
    const topics = new Set();
    Object.values(resources).forEach(resource => {
        topics.add(resource.topic);
        if (resource.relatedTopics) {
            resource.relatedTopics.forEach(t => topics.add(t));
        }
    });
    return Array.from(topics).sort();
}

/**
 * Get resources grouped by primary topic
 * @returns {Object} Object with topic keys and resource arrays
 */
export function getResourcesByTopic() {
    const grouped = {};

    Object.values(resources).forEach(resource => {
        if (resource.hidden) return;
        const topic = resource.topic;
        if (!grouped[topic]) {
            grouped[topic] = [];
        }
        grouped[topic].push(resource);
    });

    // Sort topics and resources within each topic
    const sortedGrouped = {};
    Object.keys(grouped)
        .sort((a, b) => {
            // Compare topic numbers as version strings (1.3 < 1.9 < 1.10 < 1.11)
            const partsA = (a.split(' ')[0] || '0').split('.').map(Number);
            const partsB = (b.split(' ')[0] || '0').split('.').map(Number);
            for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
                const diff = (partsA[i] || 0) - (partsB[i] || 0);
                if (diff !== 0) return diff;
            }
            return 0;
        })
        .forEach(topic => {
            sortedGrouped[topic] = grouped[topic].sort((a, b) =>
                a.title.localeCompare(b.title)
            );
        });

    return sortedGrouped;
}

/**
 * Get resources by type
 * @param {string} type - Resource type ('interactive', 'demonstration', 'practice', 'revision')
 * @returns {Array} Array of matching resources
 */
export function getResourcesByType(type) {
    return Object.values(resources).filter(r => r.type === type);
}

/**
 * Search resources by keyword
 * @param {string} query - Search query
 * @returns {Array} Array of matching resources
 */
export function searchResources(query) {
    const lowerQuery = query.toLowerCase();
    return Object.values(resources).filter(resource => {
        if (resource.hidden) return false;
        const searchableText = [
            resource.title,
            resource.description,
            resource.topic,
            ...(resource.keywords || []),
            ...(resource.relatedTopics || [])
        ].join(' ').toLowerCase();

        return searchableText.includes(lowerQuery);
    });
}

/**
 * Get resources that prepare for a specific assessment
 * @param {string} assessmentId - Assessment ID to find prep resources for
 * @returns {Array} Array of resources that prepare for this assessment
 */
export function getResourcesForAssessment(assessmentId) {
    return Object.values(resources).filter(resource =>
        resource.prepFor && resource.prepFor.includes(assessmentId)
    );
}

// Export the raw registry for advanced use cases
export { resources };

// Default export with all functions
export default {
    getAllResources,
    getResource,
    resourceExists,
    getAllTopics,
    getResourcesByTopic,
    getResourcesByType,
    searchResources,
    getResourcesForAssessment,
    resources,
};
