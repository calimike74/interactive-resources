// Interactive Resources Registry
// Central registry for all interactive learning resources

import eqFilterBridge from './eq-filter-bridge';
import octavePeriodTrainer from './octave-period-trainer';
import midiPitchBendController from './midi-pitch-bend-controller';
import filterRolloffVisualization from './filter-rolloff-visualization';
import acousticsFlashcards from './acoustics-flashcards';
import doubleTrackingExplorer from './double-tracking-explorer';

// Register all resources here
const resources = {
    'eq-filter-bridge': eqFilterBridge,
    'octave-period-trainer': octavePeriodTrainer,
    'midi-pitch-bend-controller': midiPitchBendController,
    'filter-rolloff-visualization': filterRolloffVisualization,
    'acoustics-flashcards': acousticsFlashcards,
    'double-tracking-explorer': doubleTrackingExplorer,
    // Add more resources as they're converted:
    // 'adsr-interactive': adsrInteractive,
    // 'compressor-simulator': compressorSimulator,
};

/**
 * Get all registered resources
 * @returns {Array} Array of resource objects
 */
export function getAllResources() {
    return Object.values(resources);
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
            // Extract numeric prefix for sorting (e.g., "1.11" from "1.11 EQ")
            const numA = parseFloat(a.split(' ')[0]) || 0;
            const numB = parseFloat(b.split(' ')[0]) || 0;
            return numA - numB;
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
