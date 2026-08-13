'use client';

import ImageExplorerAssessment from './ImageExplorerAssessment';
import gateConfig from '@/lib/image-explorer-configs/gate';

export default function GateAssessment() {
    return (
        <ImageExplorerAssessment
            imageSrc={gateConfig.imageSrc}
            imageAlt={gateConfig.imageAlt}
            hotspots={gateConfig.hotspots}
            title="Gate Controls Assessment"
            daw={gateConfig.daw}
            dawNote={gateConfig.dawNote}
            logic={gateConfig.logic}
        />
    );
}
