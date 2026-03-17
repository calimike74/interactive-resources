'use client';

import ImageExplorerAssessment from './ImageExplorerAssessment';
import operatorConfig from '@/lib/image-explorer-configs/operator';

export default function OperatorAssessment() {
    return (
        <ImageExplorerAssessment
            imageSrc={operatorConfig.imageSrc}
            imageAlt={operatorConfig.imageAlt}
            hotspots={operatorConfig.hotspots}
            title={operatorConfig.title}
        />
    );
}
