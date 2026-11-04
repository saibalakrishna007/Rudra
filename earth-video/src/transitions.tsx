import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

// Custom "fly-through": the outgoing scene rushes past the camera while the next one
// zooms up from the distance, both with motion blur.
const ZoomThrough: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({children, presentationDirection, presentationProgress: p}) => {
	const style: React.CSSProperties =
		presentationDirection === 'exiting'
			? {transform: `scale(${1 + p * 3})`, opacity: 1 - p, filter: `blur(${p * 16}px) brightness(${1 + p * 1.5})`}
			: {transform: `scale(${0.35 + 0.65 * p})`, opacity: Math.min(1, p * 1.6), filter: `blur(${(1 - p) * 16}px)`};
	return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const zoomThrough = (): TransitionPresentation<Record<string, never>> => ({component: ZoomThrough, props: {}});
