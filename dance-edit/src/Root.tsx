import React from 'react';
import {Composition} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {Main, MAIN_FRAMES} from './Main';
import {Intro, Outro, Replay, REPLAY_FRAMES} from './Bookends';
import {tapeGlitch, zoomThrough} from './transitions';

const INTRO = 75;
const OUTRO = 105;
const T1 = 14;
const T2 = 14;
const T3 = 20;
const TOTAL = INTRO + MAIN_FRAMES + REPLAY_FRAMES + OUTRO - T1 - T2 - T3;

const Dance: React.FC = () => (
	<TransitionSeries>
		<TransitionSeries.Sequence durationInFrames={INTRO}>
			<Intro />
		</TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={zoomThrough()} timing={linearTiming({durationInFrames: T1})} />
		<TransitionSeries.Sequence durationInFrames={MAIN_FRAMES}>
			<Main />
		</TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={tapeGlitch()} timing={linearTiming({durationInFrames: T2})} />
		<TransitionSeries.Sequence durationInFrames={REPLAY_FRAMES}>
			<Replay />
		</TransitionSeries.Sequence>
		<TransitionSeries.Transition presentation={clockWipe({width: 1080, height: 1920})} timing={linearTiming({durationInFrames: T3})} />
		<TransitionSeries.Sequence durationInFrames={OUTRO}>
			<Outro />
		</TransitionSeries.Sequence>
	</TransitionSeries>
);

export const RemotionRoot: React.FC = () => <Composition id="Dance" component={Dance} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />;
