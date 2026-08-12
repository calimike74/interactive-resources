'use client';

import ImageExplorerAssessment from './ImageExplorerAssessment';
import autofilterConfig from '@/lib/image-explorer-configs/autofilter';

export default function AutoFilterAssessment() {
    return (
        <ImageExplorerAssessment
            imageSrc={autofilterConfig.imageSrc}
            imageAlt={autofilterConfig.imageAlt}
            hotspots={autofilterConfig.hotspots}
            title="Auto Filter Controls Assessment"
            daw={autofilterConfig.daw}
            dawNote={autofilterConfig.dawNote}
        />
    );
}
