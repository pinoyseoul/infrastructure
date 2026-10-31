import React from 'react';

import { pubPubIcons } from 'client/utils/icons';
import {
	DevCommunitySwitcherMenu,
	Menu,
	ScopeDropdown,
	UserNotificationsPopover,
} from 'components';
import { canSelectCommunityForDevelopment } from 'utils/environment';
import { usePageContext } from 'utils/hooks';

import CreatePubButton from './CreatePubButton';
import GlobalControlsButton from './GlobalControlsButton';
import LoginButton from './LoginButton';
import UserMenu from './UserMenu';

import './globalControls.scss';

type Props = {
	loggedIn: boolean;
	isBasePubPub?: boolean;
};

const GlobalControls = (props: Props) => {
	const { isBasePubPub = false, loggedIn } = props;
	const {
		locationData,
		loginData,
		communityData: { hideCreatePubButton },
		scopeData: {
			activePermissions: { canManage, canView },
		},
	} = usePageContext();

	const renderJournals = () => {
		return (
			<GlobalControlsButton
				href="https://journal.pinoyseoul.com"
				aria-label="Journals"
				desktop={{ text: 'Journals' }}
				mobile={{ text: 'Journals' }}
			/>
		);
	};

	const renderRepositories = () => {
		const repoUrl =
			'https://openscience.pinoyseoul.com/dataverse/root?q=&fq1=dvCategory%3A%22Organization+or+Institution%22';
		return (
			<GlobalControlsButton
				href={repoUrl}
				aria-label="Repositories"
				desktop={{ text: 'Repositories' }}
				mobile={{ text: 'Repositories' }}
			/>
		);
	};

	const renderSearch = () => {
		return (
			<GlobalControlsButton
				href="/search"
				aria-label="Search"
				desktop={{ text: 'Search' }}
				mobile={{ icon: 'search' }}
			/>
		);
	};

	const renderDashboardMenu = () => {
		return (
			<Menu
				aria-label="Dashboard menu"
				placement="bottom-end"
				menuStyle={{ zIndex: 20 }}
				disclosure={
					<GlobalControlsButton
						mobile={{ icon: 'settings' }}
						desktop={{ text: 'Dashboard', rightIcon: 'caret-down' }}
					/>
				}
			>
				<ScopeDropdown />
			</Menu>
		);
	};

	const renderNotificiations = () => {
		if (loggedIn) {
			return (
				<UserNotificationsPopover>
					{({ hasUnreadNotifications }) => (
						<GlobalControlsButton
							aria-label="Notifications inbox"
							mobileOrDesktop={{
								icon: hasUnreadNotifications ? 'inbox-update' : 'inbox',
							}}
						/>
					)}
				</UserNotificationsPopover>
			);
		}
		return null;
	};

	const renderItemsVisibleFromCommunity = () => {
		if (!isBasePubPub) {
			const canCreatePub = loggedIn && (!hideCreatePubButton || canManage);
			return (
				<>
					{canSelectCommunityForDevelopment() && (
						<DevCommunitySwitcherMenu
							disclosure={
								<GlobalControlsButton
									mobileOrDesktop={{
										icon: pubPubIcons.community,
										rightIcon: 'caret-down',
									}}
								/>
							}
						/>
					)}
					{renderJournals()}
					{loginData.isSuperAdmin && (
						<GlobalControlsButton
							href="/superadmin"
							mobileOrDesktop={{ text: 'Superadmin' }}
						/>
					)}
					{canCreatePub && <CreatePubButton />}
					{renderRepositories()}
					{renderSearch()}
					{canView && renderDashboardMenu()}
					{renderNotificiations()}
				</>
			);
		}
		return null;
	};

	const renderBasePubPubLinks = () => {
		if (isBasePubPub) {
			return (
				<>
					{canSelectCommunityForDevelopment() && (
						<DevCommunitySwitcherMenu
							disclosure={
								<GlobalControlsButton
									mobileOrDesktop={{
										icon: pubPubIcons.community,
										rightIcon: 'caret-down',
									}}
								/>
							}
						/>
					)}
					{loginData.isSuperAdmin && (
						<GlobalControlsButton
							href="/superadmin"
							mobileOrDesktop={{ text: 'Superadmin' }}
						/>
					)}
					{renderJournals()}
					{renderRepositories()}
					{renderSearch()}
				</>
			);
		}
		return null;
	};

	const renderUserMenuOrLogin = () => {
		if (loggedIn) {
			return <UserMenu loginData={loginData} />;
		}
		return <LoginButton locationData={locationData} />;
	};

	return (
		<div className="global-controls-component">
			{renderItemsVisibleFromCommunity()}
			{renderBasePubPubLinks()}
			{renderUserMenuOrLogin()}
		</div>
	);
};

export default GlobalControls;
