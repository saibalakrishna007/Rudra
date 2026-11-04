import React from 'react';
import {AbsoluteFill, Audio, Easing, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Badge, Banner, Confetti, Grain, LightLeak, Meter, PopWords, RecOverlay, Scanlines, Sparkles, Stamp} from './flyers';

export const SRC = 'dance.mp4';
export const MAIN_FRAMES = 522; // 17.4 s of source at 30 fps

// Cut points sit on detected beats (3.0, 5.47, 7.8, 9.87, 11.97, 14.0, 15.57 s).
const CUTS = [90, 164, 234, 296, 359, 420, 467];
const CUT_FX = ['zoomPunch', 'glitch', 'whip', 'spin', 'flashShake', 'zoomOut', 'whipUp'] as const;
// Detected onsets (frames) drive small zoom pulses.
const ONSETS = [9, 32, 41, 55, 64, 72, 79, 84, 90, 95, 109, 117, 133, 142, 156, 164, 169, 173, 204, 218, 234, 241, 282, 296, 328, 343, 359, 390, 397, 406, 420, 429, 453, 467, 514];
const WIN = 7;

type Look = {filter: string; extra?: 'vhs' | 'spot' | 'duo' | 'quad' | 'neon' | 'leak' | 'warm'};
const LOOKS: Look[] = [
	{filter: 'saturate(1.25) contrast(1.08) brightness(1.06) sepia(0.12)', extra: 'warm'},
	{filter: 'contrast(1.25) saturate(1.5)', extra: 'leak'},
	{filter: 'saturate(1.3) contrast(1.12) brightness(1.05)', extra: 'vhs'},
	{filter: 'contrast(1.18) saturate(1.25)', extra: 'spot'},
	{filter: 'grayscale(1) contrast(1.4) brightness(1.08)', extra: 'duo'},
	{filter: 'saturate(1.4) contrast(1.1)', extra: 'quad'},
	{filter: 'saturate(2) contrast(1.2) hue-rotate(-15deg)', extra: 'neon'},
	{filter: 'saturate(1.3) contrast(1.08) brightness(1.06) sepia(0.1)', extra: 'warm'},
];

const Vid: React.FC<{style?: React.CSSProperties; filter?: string}> = ({style, filter}) => (
	<OffthreadVideo muted src={staticFile(SRC)} style={{width: '100%', height: '100%', objectFit: 'cover', filter, ...style}} />
);

// Red channel and green+blue channels as separate layers, recombined with screen,
// so an offset between them reads as RGB split.
const ChromaVid: React.FC<{amount: number; filter: string}> = ({amount, filter}) => (
	<AbsoluteFill style={{background: 'black'}}>
		<svg width={0} height={0} style={{position: 'absolute'}}>
			<filter id="onlyR">
				<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
			</filter>
			<filter id="onlyGB">
				<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
			</filter>
		</svg>
		<AbsoluteFill style={{transform: `translateX(${-amount}px)`, mixBlendMode: 'screen'}}>
			<Vid filter={`${filter} url(#onlyR)`} />
		</AbsoluteFill>
		<AbsoluteFill style={{transform: `translateX(${amount}px)`, mixBlendMode: 'screen'}}>
			<Vid filter={`${filter} url(#onlyGB)`} />
		</AbsoluteFill>
	</AbsoluteFill>
);

const Quad: React.FC<{filter: string}> = ({filter}) => (
	<AbsoluteFill style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, background: '#ff3ea5'}}>
		{[0, 80, 190, 290].map((h) => (
			<div key={h} style={{overflow: 'hidden'}}>
				<Vid filter={`${filter} hue-rotate(${h}deg)`} />
			</div>
		))}
	</AbsoluteFill>
);

export const Main: React.FC = () => {
	const f = useCurrentFrame();
	const seg = CUTS.filter((c) => f >= c).length;
	const look = LOOKS[seg];

	let tx = 0;
	let ty = 0;
	let sc = 1;
	let rot = 0;
	let blur = 0;
	let flash = 0;
	let chroma = look.extra === 'vhs' ? 7 : look.extra === 'neon' ? 5 : 0;
	let mbx = 0;
	let mby = 0;

	for (const o of ONSETS) {
		if (f >= o && f < o + 12) sc += 0.035 * Math.exp(-(f - o) / 3);
	}

	CUTS.forEach((c, i) => {
		if (f < c - WIN || f >= c + WIN) return;
		const p = (f - (c - WIN)) / (WIN * 2);
		const b = Math.sin(Math.PI * p);
		const near = 1 - Math.abs(f - c) / WIN;
		const jitter = (k: string) => (random(`${k}${f}`) - 0.5) * 2;
		switch (CUT_FX[i]) {
			case 'zoomPunch':
				sc += 0.5 * b;
				blur += 8 * b;
				flash = 0.8 * near * near;
				break;
			case 'glitch':
				chroma += 45 * b;
				tx += jitter('gx') * 70 * b;
				flash = 0.25 * near;
				break;
			case 'whip':
				tx += p < 0.5 ? -Easing.in(Easing.cubic)(p * 2) * 650 : (1 - Easing.out(Easing.cubic)((p - 0.5) * 2)) * 650;
				mbx = 45 * b;
				break;
			case 'spin':
				rot += 360 * Easing.inOut(Easing.cubic)(p);
				sc *= 1 - 0.35 * b;
				blur += 5 * b;
				break;
			case 'flashShake':
				flash = near;
				tx += jitter('sx') * 50 * b;
				ty += jitter('sy') * 50 * b;
				sc += 0.15 * b;
				break;
			case 'zoomOut':
				sc *= 1 - 0.4 * b;
				rot += 10 * b;
				blur += 10 * b;
				break;
			case 'whipUp':
				ty += p < 0.5 ? -Easing.in(Easing.cubic)(p * 2) * 1600 : (1 - Easing.out(Easing.cubic)((p - 0.5) * 2)) * 1600;
				mby = 50 * b;
				break;
		}
	});

	// stamp slam shake
	if (f >= 303 && f < 315) {
		const k = 1 - (f - 303) / 12;
		tx += (random(`st${f}`) - 0.5) * 50 * k;
		ty += (random(`sty${f}`) - 0.5) * 50 * k;
	}

	const filters = [look.filter, blur > 0.3 ? `blur(${blur}px)` : '', mbx + mby > 0.5 ? 'url(#motionBlur)' : ''].join(' ');

	return (
		<AbsoluteFill style={{background: 'black', overflow: 'hidden'}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="motionBlur" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation={`${mbx} ${mby}`} />
				</filter>
			</svg>
			<AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${rot}deg)`}}>
				{look.extra === 'quad' ? <Quad filter={filters} /> : chroma > 0.5 ? <ChromaVid amount={chroma} filter={filters} /> : <Vid filter={filters} />}
				{look.extra === 'duo' && <AbsoluteFill style={{background: 'linear-gradient(160deg, #ff3ea5, #6a2cff)', mixBlendMode: 'color'}} />}
			</AbsoluteFill>

			{look.extra === 'warm' && <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,150,60,0.18), rgba(255,60,140,0.12))', mixBlendMode: 'soft-light'}} />}
			{look.extra === 'leak' && <LightLeak hue={25} />}
			{look.extra === 'neon' && <LightLeak hue={290} />}
			{look.extra === 'vhs' && (
				<>
					<Scanlines opacity={0.35} />
					<RecOverlay offsetSec={5} />
				</>
			)}
			{look.extra === 'spot' && (
				<>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 45% at 50% 45%, transparent 40%, rgba(0,0,0,0.75) 100%)'}} />
					<Sparkles />
				</>
			)}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)'}} />
			<Grain opacity={look.extra === 'vhs' ? 0.16 : 0.07} />

			{/* flyers */}
			<Banner from={8} to={86} text="MAIN CHARACTER" sub="ENERGY DETECTED" y={200} />
			<Badge from={100} to={160} top="CERTIFIED" main="DUPATTA DANCE" x={680} y={180} />
			<Meter from={172} to={232} label="CROWD STATUS" value="FULLY ENTERTAINED" pct={100} />
			<PopWords from={240} to={294} text="WAIT FOR IT..." y={220} color="#ffe14d" />
			<Sequence from={296} durationInFrames={63} layout="none">
				<Stamp from={7} to={60} text="LEGENDARY" y={260} />
			</Sequence>
			<Banner from={366} to={418} text="FOOD CAN WAIT" sub="THE SHOW CAN'T" y={840} bg="#00f0ff" side="right" tilt={5} />
			<PopWords from={424} to={466} text="NO RULES. JUST VIBES." y={240} color="#ff3ea5" size={84} />
			<Banner from={474} to={522} text="PLOT TWIST" sub="A CO-STAR ENTERS" y={200} bg="#ff3ea5" fg="white" />
			<Confetti from={470} x={540} y={600} seed="costar" />

			<AbsoluteFill style={{background: 'white', opacity: flash, pointerEvents: 'none'}} />

			{/* sound: original track plus hits on every cut and flyer */}
			<Audio src={staticFile(SRC)} />
			{CUTS.map((c, i) => (
				<Sequence key={c} from={c - WIN - 4} durationInFrames={40}>
					<Audio src={staticFile(i === 0 || i === 4 ? 'boom.wav' : 'whoosh.wav')} volume={i === 0 || i === 4 ? 0.35 : 0.3} />
				</Sequence>
			))}
			{[8, 100, 172, 240, 366, 424, 474].map((s) => (
				<Sequence key={s} from={s} durationInFrames={10}>
					<Audio src={staticFile('pop.wav')} volume={0.35} />
				</Sequence>
			))}
			<Sequence from={303} durationInFrames={60}>
				<Audio src={staticFile('boom.wav')} volume={0.45} />
			</Sequence>
		</AbsoluteFill>
	);
};
