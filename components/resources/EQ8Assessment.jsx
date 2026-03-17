'use client';

import ImageExplorerAssessment from './ImageExplorerAssessment';
import eq8Config from '@/lib/image-explorer-configs/eq8';

export default function EQ8Assessment() {
    return (
        <ImageExplorerAssessment
            imageSrc={eq8Config.imageSrc}
            imageAlt={eq8Config.imageAlt}
            hotspots={eq8Config.hotspots}
            title="EQ Eight Controls Assessment"
        />
    );
}
