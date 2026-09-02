// Interactive Resources Registry
// Central registry for all interactive learning resources

import eqFilterBridge from './eq-filter-bridge.js';
import octavePeriodTrainer from './octave-period-trainer.js';
import filterRolloffVisualization from './filter-rolloff-visualization.js';
import acousticsFlashcards from './acoustics-flashcards.js';
import doubleTrackingExplorer from './double-tracking-explorer.js';
import eqBench from './eq-bench.js';
import dynamicsBench from './dynamics-bench.js';
import editBench from './edit-bench.js';
import balanceDesk from './balance-desk.js';
import automationLane from './automation-lane.js';
import pianoRoll from './piano-roll.js';
import oscilloscope from './oscilloscope.js';
import revealExplorer from './reveal-explorer.js';
import essayScaffold from './essay-scaffold.js';
import synthBench from './synth-bench.js';
import reverbBench from './reverb-bench.js';
import stereoRecordingEssay from './stereo-recording-essay.js';
import compressorCurvePractice from './compressor-curve-practice.js';
import essayScaffoldPractice from './essay-scaffold-practice.js';
import delayEffects from './delay-effects.js';
import digitalAnalogue from './digital-analogue.js';
import audioLeadsFlashcards from './audio-leads-flashcards.js';
import combinedDistortionLab from './combined-distortion-lab.js';
import stereoPanning from './stereo-panning.js';
import adcExplorer from './adc-explorer.js';
import signalChainBuilder from './signal-chain-builder.js';
import signalChainEurorack from './signal-chain-eurorack.js';
import compressorImageExplorer from './compressor-image-explorer.js';
import compressorAssessment from './compressor-assessment.js';
import gateImageExplorer from './gate-image-explorer.js';
import gateAssessment from './gate-assessment.js';
import autofilterImageExplorer from './autofilter-image-explorer.js';
import autofilterAssessment from './autofilter-assessment.js';
import eq8ImageExplorer from './eq8-image-explorer.js';
import eq8Assessment from './eq8-assessment.js';
import reverbImageExplorer from './reverb-image-explorer.js';
import reverbAssessment from './reverb-assessment.js';
import delayImageExplorer from './delay-image-explorer.js';
import delayAssessment from './delay-assessment.js';
import delayFlashcards from './delay-flashcards.js';
import operatorImageExplorer from './operator-image-explorer.js';
import operatorAssessment from './operator-assessment.js';
import samplingPlayground from './sampling-playground.js';
import rtqDynamicCompression from './rtq-dynamic-compression.js';
import waveformExplorer from './waveform-explorer.js';
import waveformDrawingAssessment from './waveform-drawing-assessment.js';
import bpmDelayCalculator from './bpm-delay-calculator.js';
import midiBinaryAssessment from './midi-binary-assessment.js';
import digitalAudioAssessment from './digital-audio-assessment.js';
import pitchSynthMonitorsAssessment from './pitch-synth-monitors-assessment.js';
import levelsMeteringAssessment from './levels-metering-assessment.js';
import acousticsPsychoacoustics from './acoustics-psychoacoustics.js';
import mixingProduction from './mixing-production.js';
import productionAnalysis from './production-analysis.js';
import additiveSynthExplorer from './additive-synth-explorer.js';

// Register all resources here
const resources = {
    'eq-filter-bridge': eqFilterBridge,
    'octave-period-trainer': octavePeriodTrainer,
    'filter-rolloff-visualization': filterRolloffVisualization,
    'acoustics-flashcards': acousticsFlashcards,
    'double-tracking-explorer': doubleTrackingExplorer,
    'eq-bench': eqBench,
    'dynamics-bench': dynamicsBench,
    'edit-bench': editBench,
    'balance-desk': balanceDesk,
    'automation-lane': automationLane,
    'piano-roll': pianoRoll,
    oscilloscope,
    'reveal-explorer': revealExplorer,
    'essay-scaffold': essayScaffold,
    'synth-bench': synthBench,
    'reverb-bench': reverbBench,
    'stereo-recording-essay': stereoRecordingEssay,
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
    'sampling-playground': samplingPlayground,
    'rtq-dynamic-compression': rtqDynamicCompression,
    'waveform-explorer': waveformExplorer,
    'waveform-drawing-assessment': waveformDrawingAssessment,
    'bpm-delay-calculator': bpmDelayCalculator,
    'midi-binary-assessment': midiBinaryAssessment,
    'digital-audio-assessment': digitalAudioAssessment,
    'pitch-synth-monitors-assessment': pitchSynthMonitorsAssessment,
    'levels-metering-assessment': levelsMeteringAssessment,
    'acoustics-psychoacoustics': acousticsPsychoacoustics,
    'mixing-production': mixingProduction,
    'production-analysis': productionAnalysis,
    'additive-synth-explorer': additiveSynthExplorer,
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
function getAllTopics() {
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
function getResourcesByTopic() {
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
function getResourcesByType(type) {
    return Object.values(resources).filter(r => r.type === type);
}

/**
 * Search resources by keyword
 * @param {string} query - Search query
 * @returns {Array} Array of matching resources
 */
function searchResources(query) {
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
function getResourcesForAssessment(assessmentId) {
    return Object.values(resources).filter(resource =>
        resource.prepFor && resource.prepFor.includes(assessmentId)
    );
}

// Export the raw registry for advanced use cases
export { resources };
