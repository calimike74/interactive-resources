// Essay Scaffold Exercise Registry

import eqFrequencyAnalysis from './eq-frequency-analysis';

const exercises = {
    'eq-frequency-analysis': eqFrequencyAnalysis,
};

function getExercise(id) {
    return exercises[id];
}

function getAllExercises() {
    return Object.values(exercises);
}

export function getDefaultExercise() {
    return eqFrequencyAnalysis;
}
