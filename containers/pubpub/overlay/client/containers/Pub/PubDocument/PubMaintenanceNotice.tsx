import React from 'react';

import { AnchorButton, Callout } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';

import './pubMaintenanceNotice.scss';

type Props = {
	pubData: {
		isInMaintenanceMode?: boolean;
	};
};

const PubMaintenanceNotice = (props: Props) => {
	const { pubData } = props;
	const { isInMaintenanceMode } = pubData;

	const {
		scopeData: {
			activePermissions: { canManage },
		},
	} = usePageContext();

	if (!isInMaintenanceMode || !canManage) {
		return null;
	}

	const renderWarning = () => {
		return (
			<p>
				The OpenScience.ph team has identified an issue with this Pub and has placed it into
				read-only maintenance mode while we resolve it. We apologize for the
				inconvenience and appreciate your patience!
			</p>
		);
	};

	const renderAction = () => {
		return <AnchorButton href="mailto:admin@openscience.ph">Contact us</AnchorButton>;
	};

	return (
		<Callout
			icon="diagnosis"
			intent="warning"
			className="pub-maintenance-notice-component"
			title="This Pub is under maintenance."
		>
			{renderWarning()}
			{renderAction()}
		</Callout>
	);
};
export default PubMaintenanceNotice;
