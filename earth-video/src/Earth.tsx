import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {linearTiming, springTiming, TransitionSeries, type TransitionPresentation, type TransitionTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';
import {flip} from '@remotion/transitions/flip';
import {iris} from '@remotion/transitions/iris';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {pushCut} from '@remotion/transitions/push-cut';
import {AgeScene, AuroraScene, GlobeScene, IntroScene, OrbitScene, OutroScene, SpeedScene, WaterScene} from './scenes';
import {Grain, Vignette} from './components/effects';
import {zoomThrough} from './transitions';

const W = 1920;
const H = 1080;

const SCENES: {C: React.FC; frames: number}[] = [
	{C: IntroScene, frames: 210},
	{C: GlobeScene, frames: 240},
	{C: AgeScene, frames: 165},
	{C: WaterScene, frames: 165},
	{C: SpeedScene, frames: 165},
	{C: OrbitScene, frames: 225},
	{C: AuroraScene, frames: 195},
	{C: OutroScene, frames: 240},
];

// One transition between each pair of scenes, every one a different style.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSITIONS: {presentation: TransitionPresentation<any>; timing: TransitionTiming}[] = [
	{presentation: zoomThrough(), timing: linearTiming({durationInFrames: 24})},
	{presentation: iris({width: W, height: H}), timing: springTiming({config: {damping: 200}, durationInFrames: 28})},
	{presentation: wipe({direction: 'from-bottom-left'}), timing: linearTiming({durationInFrames: 22})},
	{presentation: pushCut(), timing: linearTiming({durationInFrames: 22})},
	{presentation: clockWipe({width: W, height: H}), timing: linearTiming({durationInFrames: 28})},
	{presentation: flip({direction: 'from-right'}), timing: springTiming({config: {damping: 200}, durationInFrames: 30})},
	{presentation: fade(), timing: linearTiming({durationInFrames: 40})},
];

const transitionStarts = (() => {
	const starts: number[] = [];
	let t = 0;
	SCENES.forEach((s, i) => {
		t += s.frames;
		if (i < TRANSITIONS.length) {
			t -= TRANSITIONS[i].timing.getDurationInFrames({fps: 30});
			starts.push(t);
		}
	});
	return starts;
})();

export const EARTH_DURATION =
	SCENES.reduce((a, s) => a + s.frames, 0) - TRANSITIONS.reduce((a, t) => a + t.timing.getDurationInFrames({fps: 30}), 0);

export const Earth: React.FC = () => (
	<AbsoluteFill style={{background: 'black'}}>
		<TransitionSeries>
			{SCENES.flatMap(({C, frames}, i) => {
				const items = [
					<TransitionSeries.Sequence key={`s${i}`} durationInFrames={frames}>
						<C />
					</TransitionSeries.Sequence>,
				];
				if (i < TRANSITIONS.length) {
					items.push(<TransitionSeries.Transition key={`t${i}`} presentation={TRANSITIONS[i].presentation} timing={TRANSITIONS[i].timing} />);
				}
				return items;
			})}
		</TransitionSeries>
		<Vignette />
		<Grain />
		{/* sound: ambient pad, a riser into the title flash, a whoosh on every transition */}
		<Audio src={staticFile('pad.mp3')} volume={(f) => Math.min(1, f / 60, (EARTH_DURATION - f) / 50) * 0.7} />
		<Sequence from={0} durationInFrames={70}>
			<Audio src={staticFile('riser.wav')} volume={0.6} />
		</Sequence>
		<Sequence from={52} durationInFrames={90}>
			<Audio src={staticFile('boom.wav')} volume={0.8} />
		</Sequence>
		{transitionStarts.map((f, i) => (
			<Sequence key={i} from={Math.max(0, f - 6)} durationInFrames={45}>
				<Audio src={staticFile('whoosh.wav')} volume={0.5} />
			</Sequence>
		))}
	</AbsoluteFill>
);
