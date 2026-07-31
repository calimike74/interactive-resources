import graph from '@/lib/map-room/graph.json';
import wholeCourse from '@/lib/map-room/tours/whole-course.json';
import examRoutes from '@/lib/map-room/routes/exam-routes.json';
import MapRoomClient from './MapRoomClient';

export const metadata = {
    title: 'The Map Room',
    description: 'The whole of Component 4 drawn as one map — every concept in its place.',
    robots: { index: false, follow: false },
};

export default function MapRoomPage() {
    return <MapRoomClient graph={graph} tour={wholeCourse} examRoutes={examRoutes.routes} />;
}
