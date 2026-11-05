import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

type P = Record<string, never>;

const ZoomThrough: React.FC<TransitionPresentationComponentProps<P>> = ({children, presentationDirection, presentationProgress: p}) => (
	<AbsoluteFill
		style={
			presentationDirection === 'exiting'
				? {transform: `scale(${1 + p * 3})`, opacity: 1 - p, filter: `blur(${p * 16}px) brightness(${1 + p * 1.5})`}
				: {transform: `scale(${0.35 + 0.65 * p})`, opacity: Math.min(1, p * 1.6), filter: `blur(${(1 - p) * 16}px)`}
		}
	>
		{children}
	</AbsoluteFill>
);
export const zoomThrough = (): TransitionPresentation<P> => ({component: ZoomThrough, props: {}});

// VHS-style tracking glitch: the outgoing frame tears and flickers, the incoming one jitters in.
const TapeGlitch: React.FC<TransitionPresentationComponentProps<P>> = ({children, presentationDirection, presentationProgress: p}) => {
	const k = Math.round(p * 20);
	const j = (random(`tg${presentationDirection}${k}`) - 0.5) * 2;
	const style: React.CSSProperties =
		presentationDirection === 'exiting'
			? {transform: `translate(${j * 80 * p}px, ${p * 300}px) skewX(${j * 12 * p}deg)`, opacity: 1 - p, filter: `hue-rotate(${p * 180}deg) contrast(${1 + p})`}
			: {transform: `translate(${j * 60 * (1 - p)}px, ${(1 - p) * -200}px)`, opacity: p > 0.15 ? 1 : 0, filter: `brightness(${1 + (1 - p) * 1.5}) saturate(${1 + (1 - p) * 2})`};
	return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
export const tapeGlitch = (): TransitionPresentation<P> => ({component: TapeGlitch, props: {}});
