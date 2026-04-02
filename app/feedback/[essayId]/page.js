import { getFeedback, getAllFeedbackIds } from '@/lib/feedback';
import EssayFeedbackViewer from '@/components/resources/EssayFeedbackViewer';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
    return getAllFeedbackIds().map(id => ({ essayId: id }));
}

export async function generateMetadata({ params }) {
    const { essayId } = await params;
    const data = getFeedback(essayId);
    if (!data) return { title: 'Not Found' };

    return {
        title: `${data.essayTitle} — Feedback`,
        description: `Interactive feedback for ${data.essayTitle} (${data.topic})`,
    };
}

export default async function FeedbackPage({ params }) {
    const { essayId } = await params;
    const data = getFeedback(essayId);

    if (!data) {
        notFound();
    }

    return <EssayFeedbackViewer feedbackData={data} />;
}
