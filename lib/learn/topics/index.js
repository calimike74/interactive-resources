import { EQ_TOPIC } from './eq';
import { SYNTHESIS_TOPIC } from './synthesis';
import { COMPRESSION_TOPIC } from './compression';

// Maps interactive-resources topic IDs to learning-platform topic data
const learnTopics = {
    eq: EQ_TOPIC,
    synthesis: SYNTHESIS_TOPIC,
    dynamics: COMPRESSION_TOPIC,
};

/**
 * Get learn content for an interactive-resources topic ID.
 * Returns null if no learn content exists for this topic.
 */
export function getLearnTopic(topicId) {
    return learnTopics[topicId] || null;
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
