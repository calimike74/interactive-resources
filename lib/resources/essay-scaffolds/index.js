// Essay Scaffold Exercise Registry

import eqFrequencyAnalysis from './eq-frequency-analysis';

const exercises = {
    'eq-frequency-analysis': eqFrequencyAnalysis,
};

export function getExercise(id) {
    return exercises[id];
}

export function getAllExercises() {
    return Object.values(exercises);
}

export function getDefaultExercise() {
    return eqFrequencyAnalysis;
}

export default exercises;
