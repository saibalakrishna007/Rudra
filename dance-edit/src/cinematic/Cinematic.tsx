import React from 'react';
import {AbsoluteFill, Audio, Easing, Freeze, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../flyers';
import plan from './plan.json';

const SRC = 'dance.mp4';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SERIF = "'DejaVu Serif', Georgia, 'Times New Roman', serif";
const SANS = "Inter, 'Inter Display', 'Helvetica Neue', Arial, sans-serif";
const GOLD = 'linear-gradient(180deg, #fff1c9 0%, #e8b960 55%, #a8742a 100%)';
const BAR = 230;

export const CINEMATIC_FRAMES = plan.total;
const FOOT_START = plan.intro;
const FOOT_LEN = plan.times.length;
const FOOT_END = FOOT_START + FOOT_LEN;
const CUT_FX = ['flare', 'dipBlack', 'flare', 'burn', 'lensBlur'] as const;

const bump = (f: number, at: number, before: number, after: number) => {
	if (f < at - before || f > at + after) return 0;
	return f < at ? (f - (at - before)) / before : 1 - (f - at) / after;
};

// Teal shadows, warm highlights, slightly crushed blacks: a LUT-style tone curve per channel.
const GradeDefs: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<filter id="tealOrange" colorInterpolationFilters="sRGB">
			<feComponentTransfer>
				<feFuncR type="table" tableValues="0 0.07 0.3 0.62 0.86 1" />
				<feFuncG type="table" tableValues="0.02 0.13 0.34 0.6 0.8 0.94" />
				<feFuncB type="table" tableValues="0.07 0.2 0.36 0.52 0.66 0.78" />
			</feComponentTransfer>
		</filter>
	</svg>
);

// One output frame of the speed-ramped footage. Slow-motion frames are blended from
// the two nearest source frames so they glide instead of stutter.
const RampedFrame: React.FC<{t: number; filter: string}> = ({t, filter}) => {
	const sf = t * 30;
	const a = Math.floor(sf);
	const frac = sf - a;
	const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', filter};
	return (
		<AbsoluteFill>
			<Freeze frame={a}>
				<OffthreadVideo muted src={staticFile(SRC)} style={style} />
			</Freeze>
			{frac > 0.08 && (
				<AbsoluteFill style={{opacity: frac}}>
					<Freeze frame={a + 1}>
						<OffthreadVideo muted src={staticFile(SRC)} style={style} />
					</Freeze>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

const Footage: React.FC<{f: number}> = ({f}) => {
	const i = Math.min(FOOT_LEN - 1, Math.max(0, f - FOOT_START));
	const t = plan.times[i];
	const slow = plan.segOf[i] % 2 === 1; // odd segments are the slow-motion ones

	// slow push-in, harder during the hero spin; tiny gate weave like film in a projector
	let scale = interpolate(f, [FOOT_START, FOOT_END], [1.06, 1.2]);
	scale += interpolate(f, [plan.hero, plan.hero + 170], [0, 0.18], {...clamp, easing: Easing.inOut(Easing.sin)});
	const weaveX = Math.sin(f * 0.71) * 1.6 + (random(`wx${f}`) - 0.5) * 1.2;
	const weaveY = Math.cos(f * 0.53) * 1.6 + (random(`wy${f}`) - 0.5) * 1.2;

	let blur = interpolate(f, [FOOT_START - 10, FOOT_START + 25], [24, 0], clamp); // rack focus in
	let exposure = 1;
	plan.cutFx.forEach((c, k) => {
		const type = CUT_FX[k % CUT_FX.length];
		if (type === 'lensBlur') blur += 16 * bump(f, c, 6, 8);
		if (type === 'flare') exposure += 0.45 * bump(f, c, 3, 10);
		if (type === 'burn') exposure += 0.3 * bump(f, c, 6, 14);
	});
	exposure += 0.6 * bump(f, plan.hero, 3, 16);
	// a soft exposure breath on every other beat
	plan.beats.forEach((b, k) => {
		if (k % 2 === 0) exposure += 0.035 * bump(f, b * 30, 1, 6);
	});
	// at the end the image drains to black and white and darkens
	const drain = interpolate(f, [FOOT_END, FOOT_END + 45], [0, 1], clamp);
	const shake = bump(f, plan.hero, 1, 10) * 14;

	const filter = `url(#tealOrange) contrast(${1.08 + 0.04 * Number(slow)}) brightness(${exposure * (1 - 0.55 * drain)}) saturate(${(slow ? 1.12 : 1.04) * (1 - drain)})${blur > 0.3 ? ` blur(${blur}px)` : ''}`;
	return (
		<AbsoluteFill style={{transform: `translate(${weaveX + (random(`hx${f}`) - 0.5) * shake}px, ${weaveY + (random(`hy${f}`) - 0.5) * shake}px) scale(${scale})`}}>
			<RampedFrame t={t} filter={filter} />
			{/* halation: a blurred, brightened copy screened on top makes highlights bloom */}
			<AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.28 * (1 - drain)}}>
				<Freeze frame={Math.floor(t * 30)}>
					<OffthreadVideo muted src={staticFile(SRC)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.9) sepia(0.6) saturate(2.5) hue-rotate(-20deg)'}} />
				</Freeze>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Horizontal anamorphic streak that flares across the frame.
const Flare: React.FC<{amount: number; y?: number}> = ({amount, y = 820}) =>
	amount <= 0 ? null : (
		<AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', opacity: amount}}>
			<div style={{position: 'absolute', left: -200, right: -200, top: y - 3, height: 6, background: 'linear-gradient(90deg, transparent, #7fd8ff 30%, #ffffff 50%, #7fd8ff 70%, transparent)', filter: 'blur(2px)'}} />
			<div style={{position: 'absolute', left: -200, right: -200, top: y - 40, height: 80, background: 'linear-gradient(90deg, transparent, rgba(80,170,255,0.45) 50%, transparent)', filter: 'blur(18px)'}} />
			<div style={{position: 'absolute', left: 540 - 260, top: y - 260, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(120,190,255,0.25) 30%, transparent 65%)'}} />
		</AbsoluteFill>
	);

const Burn: React.FC<{amount: number}> = ({amount}) =>
	amount <= 0 ? null : (
		<AbsoluteFill
			style={{
				mixBlendMode: 'screen',
				opacity: amount,
				background: 'radial-gradient(ellipse 70% 50% at 85% 30%, rgba(255,140,40,0.95), rgba(255,60,20,0.5) 40%, transparent 75%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(255,200,120,0.6), transparent 70%)',
			}}
		/>
	);

const ChapterCard: React.FC<{f: number; at: number; num: string; title: string}> = ({f, at, num, title}) => {
	const o = interpolate(f, [at, at + 15, at + 70, at + 90], [0, 1, 1, 0], clamp);
	if (o <= 0) return null;
	const track = interpolate(f, [at, at + 90], [10, 18]);
	return (
		<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: BAR, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: o}}>
			<div style={{fontFamily: SERIF, fontSize: 30, color: '#e8b960', letterSpacing: 8}}>{num}</div>
			<div style={{fontFamily: SANS, fontWeight: 300, fontSize: 40, color: 'white', letterSpacing: track, marginTop: 8}}>{title}</div>
		</div>
	);
};

const Titles: React.FC<{f: number}> = ({f}) => {
	const presents = interpolate(f, [6, 22, 34, 42], [0, 1, 1, 0], clamp);
	const titleIn = interpolate(f, [38, 60], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const titleOut = interpolate(f, [FOOT_START - 8, FOOT_START + 20], [1, 0], clamp);
	const track = interpolate(f, [38, FOOT_START + 20], [10, 46]);
	const sweep = interpolate(f, [45, 80], [-30, 130], clamp);
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
			<div style={{position: 'absolute', fontFamily: SANS, fontWeight: 300, fontSize: 34, letterSpacing: 16, color: '#d9d2c5', opacity: presents}}>THE CREW PRESENTS</div>
			<div
				style={{
					position: 'absolute',
					fontFamily: SERIF,
					fontWeight: 700,
					fontSize: 150,
					letterSpacing: track,
					marginRight: -track,
					opacity: titleIn * titleOut,
					filter: `blur(${(1 - titleIn) * 12}px)`,
					backgroundImage: `linear-gradient(100deg, transparent ${sweep - 10}%, rgba(255,255,255,0.9) ${sweep}%, transparent ${sweep + 10}%), ${GOLD}`,
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
				}}
			>
				BINDAAS
			</div>
		</AbsoluteFill>
	);
};

const HeroWord: React.FC<{f: number}> = ({f}) => {
	const at = plan.hero + 12;
	const o = interpolate(f, [at, at + 20, at + 100, at + 125], [0, 0.9, 0.9, 0], clamp);
	if (o <= 0) return null;
	const track = interpolate(f, [at, at + 125], [4, 16]);
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
			<div style={{fontFamily: SANS, fontWeight: 200, fontSize: 70, color: 'white', letterSpacing: track, marginRight: -track, opacity: o, textShadow: '0 0 40px rgba(255,190,110,0.6)'}}>UNSTOPPABLE</div>
		</AbsoluteFill>
	);
};

const Credits: React.FC<{f: number}> = ({f}) => {
	const start = FOOT_END + 20;
	if (f < start) return null;
	const y = interpolate(f, [start, CINEMATIC_FRAMES], [1700, 380]);
	const o = interpolate(f, [start, start + 15, CINEMATIC_FRAMES - 15, CINEMATIC_FRAMES], [0, 1, 1, 0], clamp);
	const rows: [string, string][] = [
		['STARRING', 'THE DANCE KING'],
		['FEATURING', 'THE CREW'],
		['SPECIAL APPEARANCE', 'THE CO-STAR'],
		...(plan.music.credit ? [['MUSIC', plan.music.credit] as [string, string]] : []),
	];
	return (
		<AbsoluteFill style={{opacity: o, pointerEvents: 'none'}}>
			<div style={{position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center'}}>
				<div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 110, letterSpacing: 24, marginRight: -24, backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>BINDAAS</div>
				{rows.map(([role, name]) => (
					<div key={role} style={{marginTop: 70}}>
						<div style={{fontFamily: SANS, fontWeight: 400, fontSize: 26, letterSpacing: 10, color: '#a9a39a'}}>{role}</div>
						<div style={{fontFamily: SANS, fontWeight: 600, fontSize: 46, letterSpacing: 6, color: 'white', marginTop: 10}}>{name}</div>
					</div>
				))}
				<div style={{marginTop: 90, fontFamily: SERIF, fontSize: 30, letterSpacing: 6, color: '#e8b960'}}>04 · 11 · 2026</div>
			</div>
		</AbsoluteFill>
	);
};

export const Cinematic: React.FC = () => {
	// Frame 0 is the Reels/Shorts cover, so it shows the finished title card instead of black.
	const raw = useCurrentFrame();
	const f = raw === 0 ? 60 : raw;
	const fade = interpolate(f, [FOOT_START - 15, FOOT_START + 10], [0, 1], clamp);
	const bars = interpolate(f, [10, FOOT_START], [0, BAR], {...clamp, easing: Easing.inOut(Easing.cubic)});

	let flare = 0;
	let burn = 0;
	let black = 0;
	plan.cutFx.forEach((c, k) => {
		const type = CUT_FX[k % CUT_FX.length];
		if (type === 'flare') flare = Math.max(flare, bump(f, c, 3, 18));
		if (type === 'burn') burn = Math.max(burn, bump(f, c, 6, 18));
		if (type === 'dipBlack') black = Math.max(black, f >= c - 2 && f <= c + 1 ? 1 : bump(f, c + 1, 0, 6));
	});
	flare = Math.max(flare, bump(f, plan.hero, 3, 26));
	const musicStartFrame = Math.round(plan.music.startFrom * 30);
	const total = CINEMATIC_FRAMES;

	return (
		<AbsoluteFill style={{background: 'black', overflow: 'hidden'}}>
			<GradeDefs />
			<AbsoluteFill style={{opacity: fade}}>
				<Footage f={f} />
			</AbsoluteFill>
			<Flare amount={flare} />
			<Burn amount={burn} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 48%, transparent 45%, rgba(0,0,0,0.7) 100%)'}} />
			<Grain opacity={0.12} />
			<AbsoluteFill style={{background: 'black', opacity: black}} />

			{/* letterbox */}
			<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: bars, background: 'black'}} />
			<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: bars, background: 'black'}} />

			<Titles f={f} />
			<ChapterCard f={f} at={FOOT_START + 15} num="I" title="THE ENTRY" />
			<ChapterCard f={f} at={plan.cuts[0]} num="II" title="THE SWIRL" />
			<ChapterCard f={f} at={plan.cutFx[2]} num="III" title="THE SPIN" />
			<ChapterCard f={f} at={plan.cuts[4]} num="IV" title="PLOT TWIST" />
			<HeroWord f={f} />
			<Credits f={f} />

			{/* soundtrack plus cinematic hits */}
			<Audio
				src={staticFile(plan.music.file)}
				startFrom={musicStartFrame}
				volume={(fr) => interpolate(fr, [0, 20, total - 70, total], [0, 1, 1, 0], clamp)}
			/>
			<Sequence from={36} durationInFrames={150}>
				<Audio src={staticFile('braam.wav')} volume={0.55} />
			</Sequence>
			<Sequence from={plan.hero - 65} durationInFrames={70}>
				<Audio src={staticFile('riser.wav')} volume={0.3} />
			</Sequence>
			<Sequence from={plan.hero} durationInFrames={150}>
				<Audio src={staticFile('braam.wav')} volume={0.5} />
			</Sequence>
			{plan.cutFx.map((c) => (
				<Sequence key={c} from={c - 10} durationInFrames={40}>
					<Audio src={staticFile('whoosh.wav')} volume={0.22} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
