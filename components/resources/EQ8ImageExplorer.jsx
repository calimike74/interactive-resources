'use client';

import ImageExplorer from './ImageExplorer';
import eq8Config from '@/lib/image-explorer-configs/eq8';

export default function EQ8ImageExplorer() {
    return <ImageExplorer {...eq8Config} />;
}
