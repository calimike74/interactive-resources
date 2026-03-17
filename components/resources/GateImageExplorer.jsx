'use client';

import ImageExplorer from './ImageExplorer';
import gateConfig from '@/lib/image-explorer-configs/gate';

export default function GateImageExplorer() {
    return <ImageExplorer {...gateConfig} />;
}
