import React from 'react';
import {AbsoluteFill, Audio, Easing, Freeze, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Confetti, FONT, Grain, RecOverlay, Scanlines, Sparkles} from './flyers';
import {SRC} from './Main';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Still: React.FC<{at: number; style?: React.CSSProperties}> = ({at, style}) => (
	<Freeze frame={at}>
		<OffthreadVideo muted src={staticFile(SRC)} style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />
	</Freeze>
);

const glitchShadow = (frame: number, k = 1) => {
	const a = (random(`gs${frame}`) - 0.5) * 16 * k;
	const b = (random(`gt${frame}`) - 0.5) * 16 * k;
	return `${a}px 0 #00f0ff, ${b}px 0 #ff3ea5, 0 10px 0 #000`;
};

// Opening flyer: event-poster layout over a blurred freeze frame.
export const Intro: React.FC = () => {
	// Frame 0 is the cover thumbnail on Reels and Shorts, so it shows the finished poster.
	const raw = useCurrentFrame();
	const frame = raw === 0 ? 40 : raw;
	const {fps} = useVideoConfig();
	const word = (delay: number) => spring({frame: frame - delay, fps, config: {damping: 10, mass: 0.7}});
	const card = spring({frame: frame - 14, fps, config: {damping: 12}});
	const stripes = frame * 6;
	return (
		<AbsoluteFill style={{background: '#14001f', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: 'scale(1.25)', filter: 'blur(22px) brightness(0.55) saturate(1.4)'}}>
				<Still at={45} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'linear-gradient(170deg, rgba(255,62,165,0.55), rgba(90,20,255,0.55))', mixBlendMode: 'multiply'}} />
			<AbsoluteFill style={{opacity: 0.12, background: `repeating-linear-gradient(-45deg, #fff 0 18px, transparent 18px 60px)`, backgroundPosition: `${stripes}px 0`}} />
			<div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center'}}>
				<div style={{display: 'inline-block', transform: `scale(${word(0)})`, background: '#ffe14d', color: '#000', fontFamily: FONT, fontWeight: 900, fontSize: 40, letterSpacing: 10, padding: '10px 28px', border: '4px solid #000'}}>
					TONIGHT ONLY
				</div>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 230, lineHeight: 0.9, color: 'white', marginTop: 24, transform: `translateX(${(1 - word(3)) * -900}px) skewX(-8deg)`, textShadow: glitchShadow(frame)}}>
					PARTY
				</div>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 230, lineHeight: 0.9, color: 'transparent', WebkitTextStroke: '6px #ffe14d', transform: `translateX(${(1 - word(7)) * 900}px) skewX(-8deg)`}}>
					NIGHT
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 250,
					top: 760,
					width: 580,
					height: 760,
					background: 'white',
					padding: 18,
					paddingBottom: 90,
					boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
					transform: `translateY(${(1 - card) * 1400}px) rotate(${-6 + (1 - card) * 30}deg)`,
				}}
			>
				<div style={{width: '100%', height: '100%', overflow: 'hidden'}}>
					<Still at={45} style={{filter: 'saturate(1.3) contrast(1.1)'}} />
				</div>
				<div style={{position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#111'}}>THE DANCE KING</div>
			</div>
			<div style={{position: 'absolute', bottom: 150, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, color: 'white', opacity: interpolate(frame, [26, 36], [0, 1], clamp)}}>
				<div style={{fontSize: 38, fontWeight: 700, letterSpacing: 12}}>LIVE PERFORMANCE</div>
				<div style={{fontSize: 34, fontWeight: 500, letterSpacing: 8, marginTop: 10, color: '#ffe14d'}}>04 · 11 · 2026</div>
			</div>
			<Confetti from={18} x={540} y={1100} count={110} seed="intro" />
			<Grain opacity={0.1} />
			<Audio src={staticFile('riser.wav')} volume={0.5} />
			<Sequence from={14}>
				<Audio src={staticFile('pop.wav')} volume={0.4} />
			</Sequence>
		</AbsoluteFill>
	);
};

export const REPLAY_START = 279; // 9.3 s: the big spin
export const REPLAY_FRAMES = 120; // 2 s of source at half speed

export const Replay: React.FC = () => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, REPLAY_FRAMES], [1.05, 1.3], {...clamp, easing: Easing.inOut(Easing.quad)});
	const blink = Math.floor(frame / 10) % 2 === 0;
	return (
		<AbsoluteFill style={{background: 'black', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 40%'}}>
				<OffthreadVideo muted src={staticFile(SRC)} startFrom={REPLAY_START} playbackRate={0.5} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.25) saturate(1.35)'}} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,240,255,0.15), transparent 30%, transparent 70%, rgba(255,62,165,0.2))'}} />
			<Scanlines opacity={0.3} />
			<RecOverlay label="REPLAY" offsetSec={9} />
			<div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center'}}>
				<div style={{display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 104, color: blink ? '#ffe14d' : 'white', textShadow: glitchShadow(frame, 0.6), transform: 'skewX(-8deg)'}}>INSTANT REPLAY</div>
			</div>
			<div style={{position: 'absolute', bottom: 180, right: 80, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: 'white', background: '#ff3ea5', padding: '8px 26px', border: '4px solid #000', boxShadow: '8px 8px 0 #000'}}>◀◀ 0.5×</div>
			<Grain opacity={0.12} />
			<Audio src={staticFile(SRC)} startFrom={REPLAY_START} playbackRate={0.5} volume={0.8} />
			<Audio src={staticFile('rewind.wav')} volume={0.5} />
		</AbsoluteFill>
	);
};

// Closing flyer: a polaroid of the best moment drops in over the last frame.
export const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const drop = spring({frame: frame - 6, fps, config: {damping: 11, mass: 1}});
	const title = spring({frame, fps, config: {damping: 10}});
	const pills = ['LIKE', 'SHARE', 'TAG THE DANCER'];
	const fade = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: '#0b0014', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: 'scale(1.2)', filter: 'blur(24px) brightness(0.45)'}}>
				<Still at={505} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(255,62,165,0.35), transparent 60%)'}} />
			<Sparkles count={30} seed="out" />
			<div style={{position: 'absolute', top: 140, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 150, lineHeight: 0.9, color: 'white', transform: `scale(${title})`, textShadow: glitchShadow(frame, 0.5)}}>
				THAT'S
				<br />
				<span style={{color: '#ffe14d'}}>A WRAP</span>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 240,
					top: 560,
					width: 600,
					height: 820,
					background: 'white',
					padding: 20,
					paddingBottom: 110,
					boxShadow: '0 40px 90px rgba(0,0,0,0.7)',
					transform: `translateY(${(1 - drop) * -1500}px) rotate(${4 + (1 - drop) * -25}deg)`,
				}}
			>
				<div style={{width: '100%', height: '100%', overflow: 'hidden'}}>
					<Still at={300} style={{filter: 'saturate(1.3) contrast(1.1)'}} />
				</div>
				<div style={{position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#ff3ea5', transform: 'rotate(-2deg)'}}>LEGEND.</div>
			</div>
			<div style={{position: 'absolute', bottom: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
				{pills.map((p, i) => {
					const s = spring({frame: frame - 30 - i * 6, fps, config: {damping: 10}});
					return (
						<div key={p} style={{transform: `scale(${s})`, fontFamily: FONT, fontWeight: 800, fontSize: 36, color: '#000', background: ['#ffe14d', '#00f0ff', '#ff3ea5'][i], padding: '14px 30px', borderRadius: 40, border: '4px solid #000'}}>
							{p}
						</div>
					);
				})}
			</div>
			<Confetti from={22} x={540} y={900} count={120} seed="outro" />
			<Grain opacity={0.1} />
			<AbsoluteFill style={{background: 'black', opacity: fade}} />
			<Audio src={staticFile('sting.wav')} volume={0.5} />
		</AbsoluteFill>
	);
};
