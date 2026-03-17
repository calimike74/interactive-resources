'use client';

import ImageExplorerAssessment from './ImageExplorerAssessment';
import reverbConfig from '@/lib/image-explorer-configs/reverb';

export default function ReverbAssessment() {
    return (
        <ImageExplorerAssessment
            imageSrc={reverbConfig.imageSrc}
            imageAlt={reverbConfig.imageAlt}
            hotspots={reverbConfig.hotspots}
            title="Reverb Controls Assessment"
        />
    );
}
