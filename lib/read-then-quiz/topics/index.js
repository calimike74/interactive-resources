import dynamicCompression from './dynamic-compression';

const topics = {
    'rtq-dynamic-compression': dynamicCompression,
};

export function getTopicData(resourceId) {
    return topics[resourceId] || null;
}

function getAllTopicIds() {
    return Object.keys(topics);
}
