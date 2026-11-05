import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

export const FONT = "'Inter Display', Inter, 'Helvetica Neue', Arial, sans-serif";
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Shared in/out envelope: spring in at `from`, quick exit before `to`.
const useEnvelope = (from: number, to: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = spring({frame: frame - from, fps, config: {damping: 11, mass: 0.7}});
	const exit = interpolate(frame, [to - 8, to], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const visible = frame >= from && frame < to;
	return {enter, exit, visible, local: frame - from};
};

// Tilted ribbon that slams in from the side.
export const Banner: React.FC<{from: number; to: number; text: string; sub?: string; y: number; bg?: string; fg?: string; tilt?: number; side?: 'left' | 'right'}> = ({
	from,
	to,
	text,
	sub,
	y,
	bg = '#ffe14d',
	fg = '#111',
	tilt = -6,
	side = 'left',
}) => {
	const {enter, exit, visible, local} = useEnvelope(from, to);
	if (!visible) return null;
	const dir = side === 'left' ? -1 : 1;
	const x = (1 - enter) * 1200 * dir + exit * 1300 * -dir;
	const wobble = Math.sin(local / 5) * 1.2;
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: `translateX(${x}px) rotate(${tilt + wobble}deg)`}}>
			<div style={{background: bg, color: fg, padding: '18px 44px 22px', boxShadow: '10px 10px 0 #000', border: '5px solid #000', transform: 'skewX(-8deg)', textAlign: 'center'}}>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 78, letterSpacing: -1, lineHeight: 1}}>{text}</div>
				{sub && <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 34, marginTop: 8, letterSpacing: 4}}>{sub}</div>}
			</div>
		</div>
	);
};

// Round sticker with a rotating dashed rim and starburst.
export const Badge: React.FC<{from: number; to: number; top: string; main: string; x: number; y: number; color?: string; size?: number}> = ({
	from,
	to,
	top,
	main,
	x,
	y,
	color = '#ff3ea5',
	size = 330,
}) => {
	const {enter, exit, visible, local} = useEnvelope(from, to);
	if (!visible) return null;
	const s = enter * (1 - exit);
	const spikes = 16;
	const pts = Array.from({length: spikes * 2}, (_, i) => {
		const r = i % 2 === 0 ? size / 2 : size / 2.5;
		const a = (i / (spikes * 2)) * Math.PI * 2;
		return `${size / 2 + r * Math.cos(a)},${size / 2 + r * Math.sin(a)}`;
	}).join(' ');
	return (
		<div style={{position: 'absolute', left: x, top: y, width: size, height: size, transform: `scale(${s}) rotate(${-14 + (1 - enter) * -90 + Math.sin(local / 7) * 3}deg)`}}>
			<svg width={size} height={size} style={{position: 'absolute', transform: `rotate(${local * 1.5}deg)`}}>
				<polygon points={pts} fill="#ffe14d" stroke="#000" strokeWidth={5} />
			</svg>
			<div
				style={{
					position: 'absolute',
					inset: size * 0.13,
					borderRadius: '50%',
					background: color,
					border: '5px solid #000',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'white',
					textAlign: 'center',
					boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.35)',
				}}
			>
				<div style={{fontFamily: FONT, fontWeight: 800, fontSize: size * 0.085, letterSpacing: 3}}>{top}</div>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: size * 0.15, lineHeight: 0.95, textShadow: '4px 4px 0 #000'}}>{main}</div>
			</div>
		</div>
	);
};

// Lower-third status card with a filling meter.
export const Meter: React.FC<{from: number; to: number; label: string; value: string; pct: number}> = ({from, to, label, value, pct}) => {
	const {enter, exit, visible, local} = useEnvelope(from, to);
	if (!visible) return null;
	const fill = interpolate(local, [6, 36], [0, pct], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<div style={{position: 'absolute', left: 60, right: 60, bottom: 230, transform: `translateY(${(1 - enter) * 400 + exit * 400}px)`, opacity: 1 - exit}}>
			<div style={{background: 'rgba(10,10,20,0.85)', border: '4px solid #00f0ff', borderRadius: 22, padding: '26px 34px', boxShadow: '0 0 40px rgba(0,240,255,0.5)'}}>
				<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT, color: '#00f0ff', fontWeight: 800, fontSize: 34, letterSpacing: 5}}>
					<span>{label}</span>
					<span>{Math.round(fill)}%</span>
				</div>
				<div style={{fontFamily: FONT, color: 'white', fontWeight: 900, fontSize: 60, margin: '6px 0 16px'}}>{value}</div>
				<div style={{height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.15)', overflow: 'hidden'}}>
					<div style={{width: `${fill}%`, height: '100%', background: 'linear-gradient(90deg,#00f0ff,#ff3ea5,#ffe14d)', borderRadius: 13}} />
				</div>
			</div>
		</div>
	);
};

// Words punch in one at a time.
export const PopWords: React.FC<{from: number; to: number; text: string; y: number; color?: string; size?: number}> = ({from, to, text, y, color = 'white', size = 110}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame < from || frame >= to) return null;
	const exit = interpolate(frame, [to - 6, to], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', top: y, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, opacity: exit}}>
			{text.split(' ').map((w, i) => {
				const s = spring({frame: frame - from - i * 6, fps, config: {damping: 9, mass: 0.6}});
				return (
					<span
						key={i}
						style={{
							fontFamily: FONT,
							fontWeight: 900,
							fontSize: size,
							color,
							transform: `scale(${s}) rotate(${(1 - s) * 30}deg)`,
							display: 'inline-block',
							WebkitTextStroke: '4px #000',
							textShadow: '8px 8px 0 #000',
						}}
					>
						{w}
					</span>
				);
			})}
		</div>
	);
};

// Rubber-stamp slam with screen shake handled by the caller.
export const Stamp: React.FC<{from: number; to: number; text: string; y: number; color?: string}> = ({from, to, text, y, color = '#ff2d55'}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame >= to) return null;
	const s = interpolate(frame - from, [0, 5, 8], [3, 0.92, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const o = interpolate(frame - from, [0, 3], [0, 1], clamp) * interpolate(frame, [to - 6, to], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div style={{transform: `scale(${s}) rotate(-9deg)`, border: `10px solid ${color}`, borderRadius: 18, padding: '14px 40px', color, fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: 4, background: 'rgba(255,255,255,0.12)', textShadow: '0 0 30px rgba(0,0,0,0.4)'}}>
				{text}
			</div>
		</div>
	);
};

// Confetti burst from a point, falling with gravity.
export const Confetti: React.FC<{from: number; count?: number; x?: number; y?: number; seed?: string}> = ({from, count = 90, x = 540, y = 700, seed = 'c'}) => {
	const frame = useCurrentFrame();
	const t = frame - from;
	const bits = useMemo(
		() =>
			Array.from({length: count}, (_, i) => {
				const a = random(`${seed}a${i}`) * Math.PI * 2;
				const v = 12 + random(`${seed}v${i}`) * 26;
				return {vx: Math.cos(a) * v, vy: Math.sin(a) * v - 14, rot: random(`${seed}r${i}`) * 360, spin: (random(`${seed}s${i}`) - 0.5) * 30, color: ['#ff3ea5', '#ffe14d', '#00f0ff', '#7dff6a', '#ffffff', '#ff8a00'][i % 6], w: 12 + random(`${seed}w${i}`) * 14};
			}),
		[count, seed],
	);
	if (t < 0 || t > 90) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{bits.map((b, i) => {
				const px = x + b.vx * t * 0.96 ** t * 1.6;
				const py = y + b.vy * t + 0.9 * t * t * 0.5;
				return <div key={i} style={{position: 'absolute', left: px, top: py, width: b.w, height: b.w * 0.5, background: b.color, transform: `rotate(${b.rot + b.spin * t}deg)`, opacity: interpolate(t, [60, 90], [1, 0], clamp)}} />;
			})}
		</AbsoluteFill>
	);
};

// Twinkling four-point sparkles.
export const Sparkles: React.FC<{count?: number; seed?: string}> = ({count = 26, seed = 'sp'}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
			{Array.from({length: count}, (_, i) => {
				const life = 40;
				const off = Math.floor(random(`${seed}o${i}`) * life);
				const cycle = Math.floor((frame + off) / life);
				const p = ((frame + off) % life) / life;
				const x = random(`${seed}x${i}-${cycle}`) * 1080;
				const y = random(`${seed}y${i}-${cycle}`) * 1920;
				const s = Math.sin(p * Math.PI) * (20 + random(`${seed}s${i}`) * 40);
				return (
					<svg key={i} width={s * 2} height={s * 2} style={{position: 'absolute', left: x - s, top: y - s, transform: `rotate(${p * 90}deg)`}}>
						<path d={`M${s},0 Q${s},${s} ${s * 2},${s} Q${s},${s} ${s},${s * 2} Q${s},${s} 0,${s} Q${s},${s} ${s},0Z`} fill="#fff6c8" />
					</svg>
				);
			})}
		</AbsoluteFill>
	);
};

// Camcorder UI: REC dot, timecode, corner brackets.
export const RecOverlay: React.FC<{offsetSec?: number; label?: string}> = ({offsetSec = 0, label = 'REC'}) => {
	const frame = useCurrentFrame();
	const secs = Math.floor(frame / 30 + offsetSec);
	const ff = String(frame % 30).padStart(2, '0');
	const tc = `00:00:${String(secs).padStart(2, '0')}:${ff}`;
	const corner = (style: React.CSSProperties) => <div style={{position: 'absolute', width: 80, height: 80, borderColor: 'rgba(255,255,255,0.85)', borderStyle: 'solid', borderWidth: 0, ...style}} />;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', fontFamily: "'DejaVu Sans Mono', monospace", color: 'white', textShadow: '0 0 8px rgba(0,0,0,0.8)'}}>
			{corner({left: 40, top: 40, borderLeftWidth: 6, borderTopWidth: 6})}
			{corner({right: 40, top: 40, borderRightWidth: 6, borderTopWidth: 6})}
			{corner({left: 40, bottom: 40, borderLeftWidth: 6, borderBottomWidth: 6})}
			{corner({right: 40, bottom: 40, borderRightWidth: 6, borderBottomWidth: 6})}
			<div style={{position: 'absolute', left: 80, top: 70, display: 'flex', alignItems: 'center', gap: 14, fontSize: 38, fontWeight: 700}}>
				<div style={{width: 26, height: 26, borderRadius: 13, background: '#ff2d2d', opacity: Math.floor(frame / 15) % 2 ? 1 : 0.2}} />
				{label}
			</div>
			<div style={{position: 'absolute', right: 80, top: 74, fontSize: 32}}>{tc}</div>
		</AbsoluteFill>
	);
};

export const Scanlines: React.FC<{opacity?: number}> = ({opacity = 0.25}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 2px, transparent 2px, transparent 6px)'}}>
			<div style={{position: 'absolute', left: 0, right: 0, height: 120, top: ((frame * 23) % 2200) - 140, background: 'linear-gradient(transparent, rgba(255,255,255,0.25), transparent)'}} />
		</AbsoluteFill>
	);
};

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
	const frame = useCurrentFrame();
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<filter id="grainf">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 10} />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grainf)" />
		</svg>
	);
};

export const LightLeak: React.FC<{hue?: number}> = ({hue = 25}) => {
	const frame = useCurrentFrame();
	const x = 30 + Math.sin(frame / 25) * 40;
	const y = 20 + Math.cos(frame / 31) * 30;
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				mixBlendMode: 'screen',
				opacity: 0.45 + 0.2 * Math.sin(frame / 13),
				background: `radial-gradient(circle at ${x}% ${y}%, hsl(${hue} 100% 60% / 0.8), transparent 45%), radial-gradient(circle at ${100 - x}% ${100 - y}%, hsl(${hue + 300} 100% 60% / 0.5), transparent 40%)`,
			}}
		/>
	);
};
