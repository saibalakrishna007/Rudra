import React from 'react';
import {Composition} from 'remotion';
import {Earth, EARTH_DURATION} from './Earth';

export const RemotionRoot: React.FC = () => (
	<Composition id="Earth" component={Earth} durationInFrames={EARTH_DURATION} fps={30} width={1920} height={1080} />
);
