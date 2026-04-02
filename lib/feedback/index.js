import stereoRecordingDemo from './stereo-recording-demo';

const feedbackData = {
    'stereo-recording-demo': stereoRecordingDemo,
};

export function getFeedback(essayId) {
    return feedbackData[essayId] || null;
}

export function getAllFeedbackIds() {
    return Object.keys(feedbackData);
}
