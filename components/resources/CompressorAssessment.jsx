'use client';

import ImageExplorerAssessment from './ImageExplorerAssessment';
import compressorConfig from '@/lib/image-explorer-configs/compressor';

export default function CompressorAssessment() {
    return (
        <ImageExplorerAssessment
            imageSrc={compressorConfig.imageSrc}
            imageAlt={compressorConfig.imageAlt}
            hotspots={compressorConfig.hotspots}
            title="Compressor Controls Assessment"
        />
    );
}
