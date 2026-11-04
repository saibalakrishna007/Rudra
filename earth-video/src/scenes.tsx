import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Globe} from './components/Globe';
import {
	Counter,
	FONT,
	Kicker,
	LetterDrop,
	LightSweep,
	MaskReveal,
	SpaceBackground,
	Starfield,
	Typewriter,
} from './components/effects';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const headline: React.CSSProperties = {fontFamily: FONT, fontWeight: 800, color: 'white', lineHeight: 1.02, letterSpacing: -2};
const body: React.CSSProperties = {fontFamily: FONT, fontWeight: 400, color: 'rgba(225,238,255,0.85)', fontSize: 38, lineHeight: 1.35};

// 1. Warp-speed arrival, flash, and the title.
export const IntroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const warp = interpolate(frame, [0, 55], [3.5, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const zoom = interpolate(frame, [0, 55], [1.6, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const flash = interpolate(frame, [48, 56, 80], [0, 1, 0], clamp);
	const shine = interpolate(frame, [95, 150], [-30, 130], {...clamp, easing: Easing.inOut(Easing.quad)});
	const titleScale = interpolate(frame, [56, 210], [1, 1.08], clamp);
	const flareX = interpolate(frame, [56, 200], [-200, 2100], {...clamp, easing: Easing.inOut(Easing.sin)});
	return (
		<AbsoluteFill>
			<SpaceBackground hue={230} />
			<Starfield warp={warp} zoom={zoom} drift={0.15} />
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${titleScale})`}}>
				<div style={{position: 'relative'}}>
					<LetterDrop
						text="EARTH"
						delay={56}
						stagger={5}
						style={{
							...headline,
							fontSize: 260,
							letterSpacing: 40,
							marginRight: -40,
							backgroundImage: `linear-gradient(100deg, #9fd0ff 0%, #ffffff ${shine - 12}%, #fff6d8 ${shine}%, #ffffff ${shine + 12}%, #6fb6ff 100%)`,
							WebkitBackgroundClip: 'text',
							backgroundClip: 'text',
							color: 'transparent',
							textShadow: '0 0 60px rgba(90,170,255,0.35)',
						}}
					/>
				</div>
				<Typewriter
					text="The only home we've ever known."
					delay={100}
					style={{fontFamily: FONT, fontSize: 44, color: 'rgba(210,230,255,0.9)', letterSpacing: 3, marginTop: 30, fontWeight: 300}}
				/>
			</AbsoluteFill>
			{/* lens flare drifting across */}
			<AbsoluteFill style={{mixBlendMode: 'screen', opacity: interpolate(frame, [56, 80, 180, 210], [0, 0.9, 0.9, 0], clamp)}}>
				<div style={{position: 'absolute', left: flareX - 300, top: 260, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,200,255,0.35), transparent 60%)'}} />
				<div style={{position: 'absolute', left: flareX - 1200, top: 538, width: 2400, height: 4, background: 'linear-gradient(90deg, transparent, rgba(160,210,255,0.8), transparent)', filter: 'blur(1px)'}} />
				{[0.3, 0.55, 0.8].map((k, i) => (
					<div key={i} style={{position: 'absolute', left: 960 + (960 - flareX) * k - 40 * (i + 1), top: 540 - 40 * (i + 1) + 200 * k, width: 80 * (i + 1), height: 80 * (i + 1), borderRadius: '50%', border: '2px solid rgba(160,210,255,0.25)', background: 'rgba(120,180,255,0.06)'}} />
				))}
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'white', opacity: flash}} />
		</AbsoluteFill>
	);
};

// 2. The globe rises into view and spins; copy on the left.
export const GlobeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const rise = spring({frame, fps, config: {damping: 18, mass: 1.2}});
	const rotation = -20 + frame * 0.55;
	const sunPulse = 0.85 + 0.15 * Math.sin(frame / 12);
	return (
		<AbsoluteFill>
			<SpaceBackground hue={215} />
			<Starfield seed="g" drift={0.3} />
			<div style={{position: 'absolute', left: -380, top: -380, width: 900, height: 900, borderRadius: '50%', opacity: sunPulse, background: 'radial-gradient(circle, rgba(255,236,190,0.55), rgba(255,180,90,0.12) 35%, transparent 65%)'}} />
			<div style={{position: 'absolute', left: 980, top: 90, transform: `translateY(${(1 - rise) * 700}px) scale(${0.6 + rise * 0.4}) rotate(${(1 - rise) * 25}deg)`}}>
				<Globe size={860} rotation={rotation} cloudDrift={frame * 0.05} />
			</div>
			<div style={{position: 'absolute', left: 150, top: 330, width: 780}}>
				<Kicker delay={10}>PLANET 03 · SOL SYSTEM</Kicker>
				<MaskReveal delay={18} style={{marginTop: 26}}>
					<div style={{...headline, fontSize: 104}}>A pale</div>
				</MaskReveal>
				<MaskReveal delay={26}>
					<div style={{...headline, fontSize: 104, color: '#6fb8ff'}}>blue dot.</div>
				</MaskReveal>
				<MaskReveal delay={48} style={{marginTop: 34}}>
					<div style={body}>Third planet from the Sun,</div>
				</MaskReveal>
				<MaskReveal delay={56}>
					<div style={body}>and the only world known to hold life.</div>
				</MaskReveal>
			</div>
			<LightSweep from={150} to={220} />
		</AbsoluteFill>
	);
};

// 3. Age: molten orange cools to blue while the counter runs; a timeline draws itself.
export const AgeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const cool = interpolate(frame, [0, 120], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const hue = interpolate(cool, [0, 1], [18, 215]);
	const line = interpolate(frame, [30, 120], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const marks = [
		{at: 0, label: 'Formation'},
		{at: 0.15, label: 'Oceans'},
		{at: 0.3, label: 'First life'},
		{at: 0.88, label: 'Animals'},
		{at: 1, label: 'Today'},
	];
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, hsl(${hue} 75% ${22 - cool * 8}%), #04050c 75%)`}}>
			{/* expanding shock rings */}
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{[0, 1, 2, 3, 4].map((i) => {
					const t = ((frame + i * 24) % 120) / 120;
					return <circle key={i} cx={960} cy={430} r={80 + t * 900} fill="none" stroke={`hsl(${hue} 90% 70%)`} strokeWidth={3} opacity={(1 - t) * 0.35} />;
				})}
			</svg>
			<AbsoluteFill style={{alignItems: 'center', top: 170}}>
				<Kicker delay={4} color={`hsl(${hue} 90% 75%)`}>
					HOW OLD IS IT?
				</Kicker>
				<div style={{...headline, fontSize: 300, marginTop: 10, letterSpacing: -10, textShadow: `0 0 80px hsl(${hue} 90% 55% / 0.6)`}}>
					<Counter to={4.54} decimals={2} start={8} duration={80} />
				</div>
				<MaskReveal delay={40}>
					<div style={{fontFamily: FONT, fontSize: 48, letterSpacing: 14, color: 'white', fontWeight: 600}}>BILLION YEARS OLD</div>
				</MaskReveal>
			</AbsoluteFill>
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<line x1={260} y1={900} x2={260 + 1400 * line} y2={900} stroke="white" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
				{marks.map((m, i) => {
					const show = interpolate(line, [m.at - 0.02, m.at + 0.04], [0, 1], clamp);
					return (
						<g key={i} opacity={show} transform={`translate(${260 + 1400 * m.at} 900)`}>
							<circle r={10 + 6 * (1 - show)} fill={`hsl(${hue} 90% 70%)`} />
							<text y={-30} textAnchor="middle" fill="white" fontFamily={FONT} fontSize={26} fontWeight={600}>
								{m.label}
							</text>
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

// 4. Water: the frame floods to 71% with layered waves and rising bubbles.
export const WaterScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const level = spring({frame: frame - 5, fps, config: {damping: 20, mass: 2}}) * 0.71;
	const surfaceY = 1080 - 1080 * level;
	const wave = (amp: number, len: number, speed: number, offset: number) => {
		const pts: string[] = [];
		for (let x = 0; x <= 1920; x += 20) {
			const y = surfaceY + offset + Math.sin(x / len + frame * speed) * amp + Math.sin(x / (len * 0.43) - frame * speed * 1.7) * amp * 0.35;
			pts.push(`${x},${y.toFixed(1)}`);
		}
		return `M0,1080 L${pts.join(' L')} L1920,1080 Z`;
	};
	const bubbles = useMemo(
		() => Array.from({length: 40}, (_, i) => ({x: random(`bx${i}`) * 1920, r: 3 + random(`br${i}`) * 12, speed: 2 + random(`bs${i}`) * 4, phase: random(`bp${i}`) * 600})),
		[],
	);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(#030b1c, #071a3a)'}}>
			<Starfield seed="w" count={160} drift={0.1} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<defs>
					<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
						<stop offset={0} stopColor="#2b8fff" />
						<stop offset={1} stopColor="#03204f" />
					</linearGradient>
				</defs>
				<path d={wave(26, 160, 0.05, -10)} fill="#1b6fd8" opacity={0.45} />
				<path d={wave(20, 110, -0.07, 6)} fill="#1559b8" opacity={0.6} />
				<path d={wave(14, 220, 0.09, 18)} fill="url(#sea)" />
				{bubbles.map((b, i) => {
					const y = 1080 - ((frame * b.speed + b.phase) % 1080);
					if (y < surfaceY + 30) return null;
					return <circle key={i} cx={b.x + Math.sin((frame + b.phase) / 15) * 10} cy={y} r={b.r} fill="none" stroke="rgba(190,230,255,0.5)" strokeWidth={2} />;
				})}
			</svg>
			<AbsoluteFill style={{alignItems: 'center', top: 150}}>
				<Kicker delay={4}>OCEAN PLANET</Kicker>
				<div style={{...headline, fontSize: 280, letterSpacing: -10, textShadow: '0 10px 60px rgba(30,120,255,0.6)'}}>
					<Counter to={71} start={5} duration={60} suffix="%" />
				</div>
				<MaskReveal delay={35}>
					<div style={{...body, fontSize: 46, color: 'white'}}>of the surface is covered by water</div>
				</MaskReveal>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 5. Spin speed: a gauge sweeps up with overshoot, speed lines streak, the camera shakes.
export const SpeedScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: frame - 8, fps, config: {damping: 9, mass: 1.1, stiffness: 80}});
	const angle = -120 + s * 240 * 0.92;
	const shake = interpolate(frame, [20, 60], [8, 0], clamp);
	const sx = Math.sin(frame * 2.1) * shake;
	const sy = Math.cos(frame * 2.7) * shake;
	const lines = useMemo(
		() => Array.from({length: 46}, (_, i) => ({y: random(`ly${i}`) * 1080, len: 200 + random(`ll${i}`) * 600, speed: 40 + random(`ls${i}`) * 60, phase: random(`lp${i}`) * 3000, w: 1 + random(`lw${i}`) * 3})),
		[],
	);
	const arc = (r: number, from: number, to: number) => {
		const p = (a: number) => [960 + r * Math.sin((a * Math.PI) / 180), 600 - r * Math.cos((a * Math.PI) / 180)];
		const [x1, y1] = p(from);
		const [x2, y2] = p(to);
		return `M${x1},${y1} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2},${y2}`;
	};
	return (
		<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 55%, #0f1c3f, #03040b 70%)'}}>
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{lines.map((l, i) => {
					const x = 1920 - ((frame * l.speed + l.phase) % 3000) + 500;
					return <line key={i} x1={x} y1={l.y} x2={x + l.len} y2={l.y} stroke="rgba(140,200,255,0.35)" strokeWidth={l.w} strokeLinecap="round" />;
				})}
			</svg>
			<AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
				<svg width={1920} height={1080} style={{position: 'absolute'}}>
					<defs>
						<linearGradient id="gauge" x1="0" x2="1">
							<stop offset={0} stopColor="#3fa0ff" />
							<stop offset={0.6} stopColor="#7cf0ff" />
							<stop offset={1} stopColor="#ffb347" />
						</linearGradient>
						<filter id="glow">
							<feGaussianBlur stdDeviation="8" result="b" />
							<feMerge>
								<feMergeNode in="b" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
					<path d={arc(380, -120, 120)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={34} strokeLinecap="round" />
					<path d={arc(380, -120, Math.max(-119, angle))} fill="none" stroke="url(#gauge)" strokeWidth={34} strokeLinecap="round" filter="url(#glow)" />
					{Array.from({length: 25}, (_, i) => {
						const a = -120 + i * 10;
						const r1 = 330;
						const r2 = i % 4 === 0 ? 290 : 310;
						const rad = (a * Math.PI) / 180;
						return <line key={i} x1={960 + r1 * Math.sin(rad)} y1={600 - r1 * Math.cos(rad)} x2={960 + r2 * Math.sin(rad)} y2={600 - r2 * Math.cos(rad)} stroke="rgba(255,255,255,0.5)" strokeWidth={i % 4 === 0 ? 4 : 2} />;
					})}
					<g transform={`rotate(${angle} 960 600)`} filter="url(#glow)">
						<path d="M954,600 L960,250 L966,600 Z" fill="#ffb347" />
					</g>
					<circle cx={960} cy={600} r={22} fill="#0b1630" stroke="#ffb347" strokeWidth={5} />
				</svg>
				<AbsoluteFill style={{alignItems: 'center', top: 800}}>
					<div style={{...headline, fontSize: 120, letterSpacing: -4}}>
						<Counter to={1670} start={8} duration={50} />
						<span style={{fontSize: 64, color: '#7cc4ff', marginLeft: 16, letterSpacing: 0}}>km/h</span>
					</div>
					<MaskReveal delay={40}>
						<div style={{...body, fontSize: 36}}>Spin speed at the equator. You never feel a thing.</div>
					</MaskReveal>
				</AbsoluteFill>
				<div style={{position: 'absolute', top: 90, width: '100%', display: 'flex', justifyContent: 'center'}}>
					<Kicker delay={4}>FASTER THAN A JET</Kicker>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 6. Orbit: the path draws itself, Earth circles the Sun with a comet trail, the Moon circles Earth.
export const OrbitScene: React.FC = () => {
	const frame = useCurrentFrame();
	const cx = 960;
	const cy = 520;
	const rx = 640;
	const ry = 250;
	const draw = interpolate(frame, [0, 60], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const pos = (f: number) => {
		const a = -Math.PI / 2 + f * 0.022;
		return {x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), depth: Math.sin(a)};
	};
	const e = pos(frame);
	const ma = frame * 0.12;
	const moon = {x: e.x + 70 * Math.cos(ma), y: e.y + 26 * Math.sin(ma)};
	const moonBehind = Math.sin(ma) < 0;
	const earthScale = 1 + e.depth * 0.25;
	const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
	const appear = interpolate(frame, [30, 55], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<SpaceBackground hue={250} intensity={0.7} />
			<Starfield seed="o" drift={0.12} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<defs>
					<radialGradient id="sun">
						<stop offset={0} stopColor="#fffbe6" />
						<stop offset={0.35} stopColor="#ffd75e" />
						<stop offset={0.7} stopColor="#ff8a1f" />
						<stop offset={1} stopColor="#ff5a00" stopOpacity={0} />
					</radialGradient>
					<radialGradient id="corona">
						<stop offset={0.3} stopColor="#ffb347" stopOpacity={0.45} />
						<stop offset={1} stopColor="#ff7a00" stopOpacity={0} />
					</radialGradient>
					<radialGradient id="earthMini" cx="35%" cy="35%">
						<stop offset={0} stopColor="#9fd8ff" />
						<stop offset={0.5} stopColor="#2a7de8" />
						<stop offset={1} stopColor="#06204f" />
					</radialGradient>
				</defs>
				<g transform={`rotate(${frame * 0.3} ${cx} ${cy})`} opacity={0.6}>
					{Array.from({length: 18}, (_, i) => (
						<path key={i} d={`M${cx - 10},${cy} L${cx},${cy - 230 - 40 * Math.sin(frame / 10 + i)} L${cx + 10},${cy} Z`} fill="#ffb347" opacity={0.5} transform={`rotate(${i * 20} ${cx} ${cy})`} />
					))}
				</g>
				<circle cx={cx} cy={cy} r={300 + 12 * Math.sin(frame / 9)} fill="url(#corona)" />
				{/* dashed sun-earth distance line */}
				<line x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeDasharray="8 10" strokeDashoffset={-frame * 2} opacity={appear} />
				{/* orbit path drawn by a dash offset */}
				<ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="rgba(160,200,255,0.55)" strokeWidth={3} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - draw)} />
				{/* Earth goes behind the Sun on the far half of the orbit */}
				{e.depth < 0 && <EarthMarker e={e} scale={earthScale} frame={frame} pos={pos} moon={moon} moonBehind={moonBehind} opacity={appear} />}
				<circle cx={cx} cy={cy} r={110 + 4 * Math.sin(frame / 7)} fill="url(#sun)" />
				{e.depth >= 0 && <EarthMarker e={e} scale={earthScale} frame={frame} pos={pos} moon={moon} moonBehind={moonBehind} opacity={appear} />}
			</svg>
			<div style={{position: 'absolute', left: 120, top: 80}}>
				<Kicker delay={10} color="#ffcf7a">
					ONE TRIP AROUND THE SUN
				</Kicker>
			</div>
			<AbsoluteFill style={{alignItems: 'center', top: 840}}>
				<MaskReveal delay={50}>
					<div style={{...headline, fontSize: 84}}>
						<Counter to={365.25} decimals={2} start={50} duration={60} /> <span style={{color: '#ffcf7a'}}>days</span>
					</div>
				</MaskReveal>
				<MaskReveal delay={70}>
					<div style={{...body, fontSize: 36}}>covering 940 million km at 107,000 km/h</div>
				</MaskReveal>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const EarthMarker: React.FC<{
	e: {x: number; y: number};
	scale: number;
	frame: number;
	pos: (f: number) => {x: number; y: number};
	moon: {x: number; y: number};
	moonBehind: boolean;
	opacity: number;
}> = ({e, scale, frame, pos, moon, moonBehind, opacity}) => (
	<g opacity={opacity}>
		{Array.from({length: 22}, (_, i) => {
			const p = pos(frame - (i + 1) * 2);
			return <circle key={i} cx={p.x} cy={p.y} r={(18 - i * 0.7) * scale} fill="#4aa8ff" opacity={0.35 * (1 - i / 22)} />;
		})}
		{moonBehind && <circle cx={moon.x} cy={moon.y} r={8 * scale} fill="#c9ced8" />}
		<circle cx={e.x} cy={e.y} r={34 * scale} fill="#4aa8ff" opacity={0.25} />
		<circle cx={e.x} cy={e.y} r={22 * scale} fill="url(#earthMini)" />
		{!moonBehind && <circle cx={moon.x} cy={moon.y} r={8 * scale} fill="#dfe3ea" />}
	</g>
);

// 7. Aurora curtains dancing over the planet's limb.
export const AuroraScene: React.FC = () => {
	const frame = useCurrentFrame();
	const bands = [
		{hue: 140, y: 600, amp: 60, len: 260, speed: 0.03, h: 380, o: 0.7},
		{hue: 165, y: 560, amp: 80, len: 340, speed: -0.025, h: 300, o: 0.55},
		{hue: 285, y: 520, amp: 50, len: 200, speed: 0.04, h: 260, o: 0.4},
		{hue: 120, y: 640, amp: 40, len: 180, speed: -0.035, h: 220, o: 0.6},
	];
	const rise = interpolate(frame, [0, 60], [80, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<AbsoluteFill style={{background: 'linear-gradient(#01030a, #04122a 70%, #0b2c5a)'}}>
			<Starfield seed="a" drift={0.08} />
			<svg width={1920} height={1080} style={{position: 'absolute', transform: `translateY(${rise}px)`}}>
				<defs>
					{bands.map((b, i) => (
						<linearGradient key={i} id={`au${i}`} x1="0" y1="1" x2="0" y2="0">
							<stop offset={0} stopColor={`hsl(${b.hue} 100% 60%)`} stopOpacity={0.95} />
							<stop offset={0.35} stopColor={`hsl(${b.hue + 20} 100% 55%)`} stopOpacity={0.45} />
							<stop offset={1} stopColor={`hsl(${b.hue + 60} 100% 50%)`} stopOpacity={0} />
						</linearGradient>
					))}
					<filter id="auBlur">
						<feGaussianBlur stdDeviation="10" />
					</filter>
					<radialGradient id="planet" cx="50%" cy="0%" r="100%">
						<stop offset={0} stopColor="#1d5fb8" />
						<stop offset={0.2} stopColor="#0b2a5c" />
						<stop offset={1} stopColor="#020814" />
					</radialGradient>
				</defs>
				<g filter="url(#auBlur)" style={{mixBlendMode: 'screen'}}>
					{bands.map((b, i) => {
						const top: string[] = [];
						const base: string[] = [];
						for (let x = -40; x <= 1960; x += 24) {
							const y = b.y + Math.sin(x / b.len + frame * b.speed + i) * b.amp + Math.sin(x / (b.len * 0.37) - frame * b.speed * 2) * b.amp * 0.3;
							const flick = 0.75 + 0.25 * Math.sin(x / 40 + frame * 0.2 + i * 3);
							base.push(`${x},${y.toFixed(1)}`);
							top.unshift(`${x},${(y - b.h * flick).toFixed(1)}`);
						}
						return <path key={i} d={`M${base.join(' L')} L${top.join(' L')} Z`} fill={`url(#au${i})`} opacity={b.o * (0.8 + 0.2 * Math.sin(frame / 20 + i))} />;
					})}
				</g>
				{/* planet limb */}
				<ellipse cx={960} cy={2700} rx={2600} ry={1900} fill="none" stroke="#7cc4ff" strokeWidth={30} opacity={0.25} filter="url(#auBlur)" />
				<ellipse cx={960} cy={2700} rx={2600} ry={1900} fill="url(#planet)" />
				<ellipse cx={960} cy={2700} rx={2600} ry={1900} fill="none" stroke="#bfe4ff" strokeWidth={3} opacity={0.6} />
			</svg>
			<div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<Kicker delay={8} color="#7dffb5">
					THE INVISIBLE SHIELD
				</Kicker>
				<MaskReveal delay={16} style={{marginTop: 22}}>
					<div style={{...headline, fontSize: 96, textAlign: 'center'}}>
						A magnetic field <span style={{color: '#7dffb5'}}>guards us</span>
					</div>
				</MaskReveal>
				<MaskReveal delay={34}>
					<div style={{...body, textAlign: 'center'}}>Solar wind meets it at the poles and lights up the sky.</div>
				</MaskReveal>
			</div>
		</AbsoluteFill>
	);
};

// 8. Pull back until Earth is a single blue pixel.
export const OutroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const pull = interpolate(frame, [40, 170], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const scale = interpolate(pull, [0, 1], [1, 0.012]);
	const starZoom = interpolate(pull, [0, 1], [1.2, 0]);
	const dotPulse = 1 + 0.3 * Math.sin(frame / 6);
	const dotOpacity = interpolate(frame, [150, 175], [0, 1], clamp);
	const fadeOut = interpolate(frame, [215, 240], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<SpaceBackground hue={225} intensity={0.6} />
			<Starfield seed="out" count={420} zoom={starZoom} drift={0.05} />
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<div style={{transform: `scale(${scale})`}}>
					<Globe size={900} rotation={60 + frame * 0.5} cloudDrift={frame * 0.05} />
				</div>
				<div style={{position: 'absolute', width: 14 * dotPulse, height: 14 * dotPulse, borderRadius: '50%', background: '#8fd0ff', boxShadow: '0 0 30px 10px rgba(80,170,255,0.6)', opacity: dotOpacity}} />
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', top: 160}}>
				<MaskReveal delay={120}>
					<div style={{...headline, fontSize: 84, fontWeight: 300, letterSpacing: 2}}>Look again at that dot.</div>
				</MaskReveal>
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', top: 820}}>
				<MaskReveal delay={170}>
					<div style={{...headline, fontSize: 72}}>
						That's here. That's <span style={{color: '#6fb8ff'}}>home.</span>
					</div>
					<div style={{...body, fontSize: 28, textAlign: 'center', marginTop: 14, letterSpacing: 4}}>— CARL SAGAN</div>
				</MaskReveal>
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'black', opacity: fadeOut}} />
		</AbsoluteFill>
	);
};
