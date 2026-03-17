'use client';

import ImageExplorer from './ImageExplorer';
import operatorConfig from '@/lib/image-explorer-configs/operator';

export default function OperatorImageExplorer() {
    return <ImageExplorer {...operatorConfig} />;
}
