import React from 'react';

import { Icon, type IconName, MenuButton, ScopeDropdown } from 'components';
import { usePageContext } from 'utils/hooks';

import './scopePicker.scss';

type Props = {
	isMobile?: boolean;
};

const ScopePicker = (props: Props) => {
	const { isMobile } = props;
	const { scopeData } = usePageContext();
	const { activeCollection, activePub } = scopeData.elements;

	let currentScopeTitle = 'Journal';
	let icon: IconName = 'office';
	if (activeCollection) {
		currentScopeTitle = 'Issue';
		icon = 'collection';
	}
	if (activePub) {
		currentScopeTitle = 'Article';
		icon = 'pubDoc';
	}

	return (
		<div className="scope-picker-component">
			<MenuButton
				aria-label={!isMobile ? 'Dashboard Menu' : 'Mobile Dash Menu'}
				buttonContent={
					<React.Fragment>
						<div className="top">{currentScopeTitle}</div>
						{!isMobile && <div className="bottom">Dashboard</div>}
					</React.Fragment>
				}
				buttonProps={{
					icon: <Icon icon={icon} />,
					className: 'scope-button',
					fill: true,
					minimal: true,
					rightIcon: 'caret-down',
				}}
				placement={isMobile ? 'top-start' : 'bottom-start'}
				className="scope-picker-menu"
			>
				<ScopeDropdown isDashboard />
			</MenuButton>
		</div>
	);
};

export default ScopePicker;
