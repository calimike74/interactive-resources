'use client';

import ImageExplorerAssessment from './ImageExplorerAssessment';
import delayConfig from '@/lib/image-explorer-configs/delay';

export default function DelayAssessment() {
    return (
        <ImageExplorerAssessment
            imageSrc={delayConfig.imageSrc}
            imageAlt={delayConfig.imageAlt}
            hotspots={delayConfig.hotspots}
            title="Delay Controls Assessment"
        />
    );
}
