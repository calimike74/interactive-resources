'use client';

import ImageExplorer from './ImageExplorer';
import reverbConfig from '@/lib/image-explorer-configs/reverb';

export default function ReverbImageExplorer() {
    return <ImageExplorer {...reverbConfig} />;
}
