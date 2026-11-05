import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

export const FONT = "Inter, 'Inter Display', 'Helvetica Neue', Arial, sans-serif";

// Deep-space backdrop with slowly drifting nebula clouds.
export const SpaceBackground: React.FC<{hue?: number; intensity?: number}> = ({hue = 220, intensity = 1}) => {
	const frame = useCurrentFrame();
	const t = frame / 30;
	return (
		<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 60%, hsl(${hue} 60% 9%) 0%, #02030a 70%)`}}>
			<AbsoluteFill
				style={{
					opacity: 0.55 * intensity,
					filter: 'blur(60px)',
					background: `radial-gradient(circle at ${30 + Math.sin(t * 0.2) * 6}% ${35 + Math.cos(t * 0.15) * 5}%, hsl(${hue + 40} 80% 35% / 0.55), transparent 40%),
					radial-gradient(circle at ${72 + Math.cos(t * 0.18) * 6}% ${68 + Math.sin(t * 0.22) * 5}%, hsl(${hue - 30} 85% 30% / 0.5), transparent 45%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

// Twinkling, parallax stars. `warp` > 0 stretches them into streaks radiating from the centre.
export const Starfield: React.FC<{count?: number; seed?: string; drift?: number; warp?: number; zoom?: number}> = ({
	count = 320,
	seed = 'stars',
	drift = 0.25,
	warp = 0,
	zoom = 0,
}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const stars = useMemo(
		() =>
			Array.from({length: count}, (_, i) => ({
				x: random(`${seed}-x-${i}`),
				y: random(`${seed}-y-${i}`),
				r: 0.5 + random(`${seed}-r-${i}`) ** 3 * 2.6,
				phase: random(`${seed}-p-${i}`) * Math.PI * 2,
				speed: 0.03 + random(`${seed}-s-${i}`) * 0.1,
				depth: 0.25 + random(`${seed}-d-${i}`) * 0.75,
				tint: random(`${seed}-t-${i}`),
			})),
		[count, seed],
	);
	const cx = width / 2;
	const cy = height / 2;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			{stars.map((s, i) => {
				let x = s.x * width - frame * drift * s.depth * 4;
				x = ((x % width) + width) % width;
				const y = s.y * height;
				const z = 1 + zoom * s.depth;
				const px = cx + (x - cx) * z;
				const py = cy + (y - cy) * z;
				const tw = 0.55 + 0.45 * Math.sin(frame * s.speed + s.phase);
				const color = s.tint > 0.85 ? '#ffd9a8' : s.tint > 0.7 ? '#a8d0ff' : '#ffffff';
				if (warp > 0.01) {
					const zt = z * (1 + warp * s.depth * 0.6);
					const tx = cx + (x - cx) * zt;
					const ty = cy + (y - cy) * zt;
					return (
						<line key={i} x1={px} y1={py} x2={tx} y2={ty} stroke={color} strokeWidth={s.r * 1.2} strokeLinecap="round" opacity={Math.min(1, tw * s.depth + warp * 0.2)} />
					);
				}
				return <circle key={i} cx={px} cy={py} r={s.r} fill={color} opacity={tw * s.depth} />;
			})}
		</svg>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
	<AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${strength}) 100%)`}} />
);

// Animated film grain: the turbulence seed changes every frame.
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<filter id="grain">
				<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} stitchTiles="stitch" />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain)" />
		</svg>
	);
};

// Diagonal light leak that sweeps across the frame between `from` and `to`.
export const LightSweep: React.FC<{from: number; to: number; color?: string}> = ({from, to, color = '255,220,170'}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const o = interpolate(p, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				mixBlendMode: 'screen',
				opacity: o * 0.8,
				background: `linear-gradient(115deg, transparent ${p * 140 - 40}%, rgba(${color},0.55) ${p * 140 - 20}%, transparent ${p * 140}%)`,
			}}
		/>
	);
};

// Each letter springs in from a blurred, oversized state.
export const LetterDrop: React.FC<{text: string; delay?: number; stagger?: number; style?: React.CSSProperties}> = ({
	text,
	delay = 0,
	stagger = 4,
	style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div style={{display: 'flex', justifyContent: 'center', ...style}}>
			{text.split('').map((ch, i) => {
				const s = spring({frame: frame - delay - i * stagger, fps, config: {damping: 14, mass: 0.8}});
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							whiteSpace: 'pre',
							opacity: s,
							transform: `translateY(${(1 - s) * -60}px) scale(${1 + (1 - s) * 1.8})`,
							filter: `blur(${(1 - s) * 18}px)`,
						}}
					>
						{ch}
					</span>
				);
			})}
		</div>
	);
};

// Line slides up from behind a mask.
export const MaskReveal: React.FC<{children: React.ReactNode; delay?: number; style?: React.CSSProperties}> = ({children, delay = 0, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 22});
	return (
		<div style={{overflow: 'hidden', ...style}}>
			<div style={{transform: `translateY(${(1 - s) * 110}%)`, opacity: Math.min(1, s * 1.5)}}>{children}</div>
		</div>
	);
};

// Characters appear one by one with a blinking caret.
export const Typewriter: React.FC<{text: string; delay?: number; cps?: number; style?: React.CSSProperties}> = ({text, delay = 0, cps = 26, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const n = Math.max(0, Math.floor(((frame - delay) / fps) * cps));
	const shown = text.slice(0, n);
	const caret = n < text.length || Math.floor(frame / 15) % 2 === 0;
	return (
		<div style={style}>
			{shown}
			<span style={{opacity: frame >= delay && caret ? 1 : 0}}>▍</span>
		</div>
	);
};

// Number that counts up with an ease-out.
export const Counter: React.FC<{to: number; decimals?: number; from?: number; start?: number; duration?: number; style?: React.CSSProperties; suffix?: string}> = ({
	to,
	decimals = 0,
	from = 0,
	start = 0,
	duration = 45,
	style,
	suffix = '',
}) => {
	const frame = useCurrentFrame();
	const v = interpolate(frame, [start, start + duration], [from, to], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.exp),
	});
	return (
		<span style={{fontVariantNumeric: 'tabular-nums', ...style}}>
			{v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}
			{suffix}
		</span>
	);
};

export const Kicker: React.FC<{children: React.ReactNode; delay?: number; color?: string}> = ({children, delay = 0, color = '#7cc4ff'}) => {
	const frame = useCurrentFrame();
	const w = interpolate(frame, [delay, delay + 20], [0, 60], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const o = interpolate(frame, [delay + 5, delay + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT, fontSize: 26, letterSpacing: 8, fontWeight: 600, color}}>
			<div style={{width: w, height: 3, background: color, borderRadius: 2}} />
			<span style={{opacity: o}}>{children}</span>
		</div>
	);
};
