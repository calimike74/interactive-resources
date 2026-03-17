'use client';

import ImageExplorer from './ImageExplorer';
import autofilterConfig from '@/lib/image-explorer-configs/autofilter';

export default function AutoFilterImageExplorer() {
    return <ImageExplorer {...autofilterConfig} />;
}
