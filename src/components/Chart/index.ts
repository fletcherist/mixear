import dynamic from 'next/dynamic';

export const Chart = dynamic(() => import('./Chart'), { ssr: false });