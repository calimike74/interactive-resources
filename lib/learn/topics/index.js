import { EQ_TOPIC } from './eq';
import { SYNTHESIS_TOPIC } from './synthesis';
import { COMPRESSION_TOPIC } from './compression';

// Maps interactive-resources topic IDs to arrays of lessons
const learnTopics = {
    eq: [EQ_TOPIC],
    synthesis: [SYNTHESIS_TOPIC],
    dynamics: [COMPRESSION_TOPIC],
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
