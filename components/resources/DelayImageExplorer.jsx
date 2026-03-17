'use client';

import ImageExplorer from './ImageExplorer';
import delayConfig from '@/lib/image-explorer-configs/delay';

export default function DelayImageExplorer() {
    return <ImageExplorer {...delayConfig} />;
}
