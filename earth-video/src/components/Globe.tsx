import React, {useId, useMemo} from 'react';
import {random} from 'remotion';

// A procedural orthographic Earth: continents are rough lon/lat outlines projected
// onto a sphere every frame, so rotation reads as real 3D rather than a sliding texture.

type LL = [number, number];

const LAND = '#4f9d57';
const DRY = '#b89b62';

const CONTINENTS: {pts: LL[]; color: string}[] = [
	// North America
	{color: LAND, pts: [[-165, 65], [-140, 70], [-110, 72], [-85, 70], [-75, 62], [-60, 55], [-65, 45], [-75, 40], [-80, 30], [-82, 25], [-90, 29], [-97, 26], [-97, 20], [-90, 15], [-83, 9], [-78, 8], [-86, 13], [-105, 20], [-112, 30], [-118, 34], [-124, 40], [-124, 48], [-135, 57], [-150, 60], [-165, 60]]},
	// Greenland
	{color: '#dfe9f2', pts: [[-55, 60], [-45, 60], [-20, 70], [-20, 80], [-40, 83], [-65, 80], [-70, 77], [-55, 70]]},
	// South America
	{color: LAND, pts: [[-78, 8], [-60, 10], [-50, 0], [-35, -5], [-38, -13], [-40, -22], [-48, -28], [-58, -38], [-65, -42], [-68, -52], [-72, -50], [-74, -40], [-71, -30], [-70, -18], [-76, -13], [-81, -5], [-80, 0]]},
	// Europe
	{color: LAND, pts: [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [0, 50], [5, 53], [8, 57], [5, 60], [10, 63], [15, 68], [25, 71], [40, 68], [45, 60], [40, 45], [28, 41], [26, 38], [20, 40], [15, 38], [12, 44], [8, 44], [3, 43], [-5, 36]]},
	// Africa
	{color: DRY, pts: [[-17, 15], [-17, 21], [-10, 30], [-5, 35], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 11], [42, -2], [40, -15], [35, -24], [27, -34], [18, -34], [12, -18], [13, -5], [9, 4], [-8, 4], [-13, 8]]},
	// Asia
	{color: LAND, pts: [[26, 38], [36, 36], [35, 30], [43, 12], [55, 22], [57, 25], [62, 25], [68, 23], [72, 20], [77, 8], [80, 14], [88, 22], [92, 21], [98, 16], [100, 6], [104, 1], [104, 10], [109, 12], [108, 21], [118, 24], [122, 30], [120, 37], [126, 38], [130, 42], [140, 50], [142, 58], [160, 60], [170, 65], [180, 68], [150, 72], [110, 77], [80, 73], [60, 70], [45, 68], [40, 68], [45, 60], [40, 45], [28, 41]]},
	// Arabia (drier tint over Asia)
	{color: DRY, pts: [[35, 30], [43, 12], [51, 13], [57, 22], [50, 27], [44, 30]]},
	// Australia
	{color: DRY, pts: [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -35], [129, -32], [115, -34]]},
	// Islands
	{color: LAND, pts: [[-5, 50], [1, 51], [0, 53], [-3, 56], [-5, 58], [-6, 55], [-3, 54], [-5, 52]]},
	{color: LAND, pts: [[130, 31], [135, 34], [140, 36], [142, 40], [141, 45], [139, 42], [136, 36], [131, 34]]},
	{color: LAND, pts: [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]]},
	{color: LAND, pts: [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]]},
	{color: LAND, pts: [[95, 5], [98, 4], [106, -6], [104, -5]]},
	{color: LAND, pts: [[172, -34], [178, -38], [174, -41], [168, -46], [166, -45], [172, -40]]},
	// Antarctica
	{
		color: '#eef4fa',
		pts: [
			...Array.from({length: 25}, (_, i): LL => {
				const lon = -180 + i * 15;
				return [lon, -67 - 4 * Math.sin((lon * Math.PI) / 60)];
			}),
			[180, -90],
			[-180, -90],
		],
	},
];

const CITIES: LL[] = [
	[-74, 40.7], [-118, 34], [-87.6, 41.9], [-79.4, 43.7], [-99, 19.4], [-46.6, -23.5], [-58.4, -34.6], [-43, -22.9],
	[-0.1, 51.5], [2.3, 48.9], [13.4, 52.5], [12.5, 41.9], [37.6, 55.8], [28.9, 41], [31.2, 30], [3.4, 6.5],
	[28, -26.2], [36.8, -1.3], [55.3, 25.2], [72.9, 19.1], [77.2, 28.6], [88.4, 22.6], [80.3, 13.1], [100.5, 13.8],
	[106.8, -6.2], [103.8, 1.35], [114.2, 22.3], [121.5, 31.2], [116.4, 39.9], [126.9, 37.6], [139.7, 35.7],
	[151.2, -33.9], [144.9, -37.8], [-122.4, 37.8], [-95.4, 29.8], [-80.2, 25.8], [-123.1, 49.3], [18.4, -33.9],
];

const RAD = Math.PI / 180;

const densify = (pts: LL[], step = 2.5): LL[] => {
	const out: LL[] = [];
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / step));
		for (let k = 0; k < n; k++) {
			out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
		}
	}
	return out;
};

const DENSE = CONTINENTS.map((c) => ({color: c.color, pts: densify(c.pts)}));

const CLOUDS: LL[][] = Array.from({length: 130}, (_, i) => {
	const lon = -180 + random(`cl-lon-${i}`) * 360;
	const lat = -62 + random(`cl-lat-${i}`) * 124;
	const r = 1.2 + random(`cl-r-${i}`) * 3.2;
	const stretch = 2 + random(`cl-s-${i}`) * 3;
	return Array.from({length: 14}, (__, k): LL => {
		const a = (k / 14) * Math.PI * 2;
		const jitter = 0.7 + random(`cl-j-${i}-${k}`) * 0.5;
		return [
			lon + (Math.cos(a) * r * stretch * jitter) / Math.max(0.3, Math.cos(lat * RAD)),
			lat + Math.sin(a) * r * jitter,
		];
	});
});

const project = (lon: number, lat: number, rot: number, view: number) => {
	const th = (lon + rot) * RAD;
	const ph = lat * RAD;
	const a = view * RAD;
	const x = Math.cos(ph) * Math.sin(th);
	const y0 = Math.sin(ph);
	const z0 = Math.cos(ph) * Math.cos(th);
	return {x, y: y0 * Math.cos(a) - z0 * Math.sin(a), z: y0 * Math.sin(a) + z0 * Math.cos(a)};
};

// Light comes from the upper left, slightly toward the viewer.
const L = (() => {
	const v = [-0.78, 0.32, 0.54];
	const n = Math.hypot(v[0], v[1], v[2]);
	return v.map((c) => c / n);
})();

const toPath = (pts: LL[], rot: number, view: number, R: number, c: number): string | null => {
	let anyFront = false;
	const coords = pts.map(([lon, lat]) => {
		const p = project(lon, lat, rot, view);
		let {x, y} = p;
		if (p.z < 0) {
			const n = Math.hypot(x, y) || 1;
			x /= n;
			y /= n;
		} else {
			anyFront = true;
		}
		return `${(c + x * R).toFixed(1)},${(c - y * R).toFixed(1)}`;
	});
	return anyFront ? `M${coords.join('L')}Z` : null;
};

export const Globe: React.FC<{
	size: number;
	rotation: number; // degrees of longitude
	view?: number; // viewer latitude in degrees
	tilt?: number; // on-screen axial tilt
	clouds?: boolean;
	cityLights?: boolean;
	glow?: number;
	cloudDrift?: number;
}> = ({size, rotation, view = 16, tilt = -18, clouds = true, cityLights = true, glow = 1, cloudDrift = 0}) => {
	const id = useId().replace(/[^a-zA-Z0-9]/g, '');
	const R = size / 2;
	const c = size / 2;

	const land = useMemo(
		() => DENSE.map((d) => ({color: d.color, d: toPath(d.pts, rotation, view, R, c)})),
		[rotation, view, R, c],
	);
	const cloudPaths = useMemo(
		() => (clouds ? CLOUDS.map((pts) => toPath(pts, rotation * 1.08 + cloudDrift, view, R * 1.012, c)) : []),
		[clouds, rotation, cloudDrift, view, R, c],
	);
	const lights = useMemo(() => {
		if (!cityLights) return [];
		return CITIES.map(([lon, lat], i) => {
			const p = project(lon, lat, rotation, view);
			if (p.z <= 0.05) return null;
			const dot = p.x * L[0] + p.y * L[1] + p.z * L[2];
			const night = Math.min(1, Math.max(0, -dot * 4));
			if (night <= 0) return null;
			return {i, x: c + p.x * R, y: c - p.y * R, o: night * Math.min(1, p.z * 3)};
		}).filter(Boolean) as {i: number; x: number; y: number; o: number}[];
	}, [cityLights, rotation, view, R, c]);

	const lit = {x: c + L[0] * R, y: c - L[1] * R};
	const dark = {x: c - L[0] * R, y: c + L[1] * R};

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow: 'visible'}}>
			<defs>
				<radialGradient id={`atmo${id}`} cx={c} cy={c} r={R * 1.3} gradientUnits="userSpaceOnUse">
					<stop offset={0.74} stopColor="#5fb4ff" stopOpacity={0.55 * glow} />
					<stop offset={0.8} stopColor="#4aa0ff" stopOpacity={0.28 * glow} />
					<stop offset={0.9} stopColor="#2f6fff" stopOpacity={0.08 * glow} />
					<stop offset={1} stopColor="#1a3fff" stopOpacity={0} />
				</radialGradient>
				<radialGradient id={`ocean${id}`} cx={lit.x} cy={lit.y} r={R * 2} gradientUnits="userSpaceOnUse">
					<stop offset={0} stopColor="#4ea8ff" />
					<stop offset={0.45} stopColor="#1b62c9" />
					<stop offset={1} stopColor="#071d4d" />
				</radialGradient>
				<radialGradient id={`spec${id}`} cx={c + L[0] * R * 0.55} cy={c - L[1] * R * 0.55} r={R * 0.5} gradientUnits="userSpaceOnUse">
					<stop offset={0} stopColor="#ffffff" stopOpacity={0.35} />
					<stop offset={1} stopColor="#ffffff" stopOpacity={0} />
				</radialGradient>
				<linearGradient id={`night${id}`} x1={lit.x} y1={lit.y} x2={dark.x} y2={dark.y} gradientUnits="userSpaceOnUse">
					<stop offset={0} stopColor="#000814" stopOpacity={0} />
					<stop offset={0.48} stopColor="#000814" stopOpacity={0} />
					<stop offset={0.62} stopColor="#000814" stopOpacity={0.6} />
					<stop offset={0.8} stopColor="#00040c" stopOpacity={0.93} />
					<stop offset={1} stopColor="#00040c" stopOpacity={0.97} />
				</linearGradient>
				<radialGradient id={`limb${id}`} cx={c} cy={c} r={R} gradientUnits="userSpaceOnUse">
					<stop offset={0.82} stopColor="#9fd3ff" stopOpacity={0} />
					<stop offset={1} stopColor="#9fd3ff" stopOpacity={0.45} />
				</radialGradient>
				<clipPath id={`clip${id}`}>
					<circle cx={c} cy={c} r={R} />
				</clipPath>
				<filter id={`soft${id}`} x="-10%" y="-10%" width="120%" height="120%">
					<feGaussianBlur stdDeviation={Math.max(1, R * 0.012)} />
				</filter>
				<filter id={`city${id}`}>
					<feGaussianBlur stdDeviation={Math.max(1, R * 0.008)} />
				</filter>
			</defs>
			<circle cx={c} cy={c} r={R * 1.3} fill={`url(#atmo${id})`} />
			<g transform={`rotate(${tilt} ${c} ${c})`}>
				<g clipPath={`url(#clip${id})`}>
					<circle cx={c} cy={c} r={R} fill={`url(#ocean${id})`} />
					{land.map((l, i) => (l.d ? <path key={i} d={l.d} fill={l.color} stroke="#8fd08a" strokeOpacity={0.35} strokeWidth={R * 0.004} /> : null))}
					{clouds && (
						<g filter={`url(#soft${id})`} opacity={0.6}>
							{cloudPaths.map((d, i) => (d ? <path key={i} d={d} fill="#ffffff" /> : null))}
						</g>
					)}
					<circle cx={c} cy={c} r={R} fill={`url(#spec${id})`} />
					<circle cx={c} cy={c} r={R} fill={`url(#night${id})`} />
					<g filter={`url(#city${id})`}>
						{lights.map((p) => (
							<circle key={p.i} cx={p.x} cy={p.y} r={R * 0.012} fill="#ffd27a" opacity={p.o} />
						))}
					</g>
					<circle cx={c} cy={c} r={R} fill={`url(#limb${id})`} />
				</g>
			</g>
		</svg>
	);
};
