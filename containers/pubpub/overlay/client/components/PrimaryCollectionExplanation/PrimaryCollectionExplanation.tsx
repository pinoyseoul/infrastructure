import React from 'react';

import { Classes, Tooltip } from '@blueprintjs/core';

type Props = {
	children?: React.ReactNode;
};

const copy = (
	<>
		An Article can belong to many Issues, but its Primary Issue is the most important one.
		It is associated with the Article in metadata, PDF exports, and more.
	</>
);

const PrimaryCollectionExplanation = (props: Props) => {
	const { children = 'Primary Issue' } = props;
	return (
		<Tooltip content={copy}>
			<span className={Classes.TOOLTIP_INDICATOR}>{children}</span>
		</Tooltip>
	);
};

export default PrimaryCollectionExplanation;
