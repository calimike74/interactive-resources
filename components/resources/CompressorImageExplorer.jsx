'use client';

import ImageExplorer from './ImageExplorer';
import compressorConfig from '@/lib/image-explorer-configs/compressor';

export default function CompressorImageExplorer() {
    return <ImageExplorer {...compressorConfig} />;
}
