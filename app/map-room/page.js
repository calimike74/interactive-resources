import graph from '@/lib/map-room/graph.json';
import wholeCourse from '@/lib/map-room/tours/whole-course.json';
import examRoutes from '@/lib/map-room/routes/exam-routes.json';
import { getLearnRationale } from '@/lib/learn/topics';
import MapRoomClient from './MapRoomClient';

export const metadata = {
    title: 'The Map Room',
    description: 'The whole of Component 4 drawn as one map — every concept in its place.',
    robots: { index: false, follow: false },
};

/* Six topics carry a deliberately short Learn course, and each already has a
 * sentence saying why — "past papers touch recording lightly…". The Map Room
 * says the same thing rather than inventing a second opinion about how heavily
 * a topic is examined. Resolved here, on the server: importing the learn index
 * into the client bundle would drag every chapter file in with it. */
function rationales() {
    const out = {};
    for (const n of graph.nodes) {
        const href = n.kind === 'topic' && n.destination?.kind === 'topic' && n.destination.href;
        if (!href) continue;
        const note = getLearnRationale(href.replace('/topic/', ''));
        if (note) out[n.id] = note;
    }
    return out;
}

export default function MapRoomPage() {
    return (
        <MapRoomClient
            graph={graph}
            tour={wholeCourse}
            examRoutes={examRoutes.routes}
            lightlyExamined={rationales()}
        />
    );
}
