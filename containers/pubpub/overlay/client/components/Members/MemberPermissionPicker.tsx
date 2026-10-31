import React from 'react';

import { Classes } from '@blueprintjs/core';
import classNames from 'classnames';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';

import { permissionValues } from './permissionValues';

import './memberPermissionPicker.scss';

type OwnProps = {
	activeTargetType: string;
	canAdmin: boolean;
	activePermission: string;
	onSelect?: (...args: any[]) => any;
};

const defaultProps = {
	onSelect: (permissions) => {
		/* biome-ignore lint/suspicious/noConsole: shhhhhh */
		console.log(permissions);
	},
};

const privileges = {
	pub: [
		{ title: 'View Article drafts', activeAt: 'view' },
		{ title: 'View member-only Discussions and Reviews', activeAt: 'view' },
		{ title: 'Edit Article draft', activeAt: 'edit' },
		{ title: 'Create Reviews', activeAt: 'edit' },
		{ title: 'Manage Article settings', activeAt: 'manage' },
		{ title: 'Create Releases', activeAt: 'admin' },
		{ title: 'See all Discussions and Reviews', activeAt: 'admin' },
		{ title: 'Delete Article', activeAt: 'admin' },
	],
	collection: [
		{ title: 'View all Article drafts', activeAt: 'view' },
		{ title: 'View member-only Discussions and Reviews', activeAt: 'view' },
		{ title: 'Edit Article drafts', activeAt: 'edit' },
		{ title: 'Create Reviews', activeAt: 'edit' },
		{ title: 'Manage Article settings', activeAt: 'manage' },
		{ title: 'Manage Issue settings', activeAt: 'manage' },
		{ title: 'Create new Articles in this Issue', activeAt: 'manage' },
		{ title: 'Publish Articles', activeAt: 'admin' },
		{ title: 'See all Discussions and Reviews', activeAt: 'admin' },
		{ title: 'Delete Articles', activeAt: 'admin' },
		{ title: 'Delete Issue', activeAt: 'admin' },
	],
	community: [
		{ title: 'View all Article drafts', activeAt: 'view' },
		{ title: 'View member-only Discussions and Reviews', activeAt: 'view' },
		{ title: 'Edit Article drafts', activeAt: 'edit' },
		{ title: 'Create Reviews', activeAt: 'edit' },
		{ title: 'Manage Article settings', activeAt: 'manage' },
		{ title: 'Manage Issue settings', activeAt: 'manage' },
		{ title: 'Manage Journal settings', activeAt: 'manage' },
		{ title: 'Create new Articles', activeAt: 'manage' },
		{ title: 'Create new Issues', activeAt: 'manage' },
		{ title: 'Publish Articles', activeAt: 'admin' },
		{ title: 'See all Discussions and Reviews', activeAt: 'admin' },
		{ title: 'Assign DOIs', activeAt: 'admin' },
		{ title: 'Delete Articles', activeAt: 'admin' },
		{ title: 'Delete Issues', activeAt: 'admin' },
		{ title: 'Delete Journal', activeAt: 'admin' },
	],
};

type Props = OwnProps & typeof defaultProps;

const MemberPermissionPicker = (props: Props) => {
	const { activeTargetType, activePermission, onSelect, canAdmin } = props;
	const { communityData } = usePageContext();
	const activePrivileges = privileges[activeTargetType];
	return (
		<div className="member-permission-picker-component">
			<style>{`.active .header-row .${Classes.ICON} { background: ${communityData.accentColorDark}}`}</style>
			<div className="picker-column">
				<div className="header-row" />
				{activePrivileges.map((item) => {
					return (
						<div className="row title-row" key={item.title}>
							{item.title}
						</div>
					);
				})}
			</div>
			{permissionValues.map((value, index) => {
				const isActive = value === activePermission;
				const isDisabled = value === 'admin' && !canAdmin;
				return (
					<button
						className={classNames(
							'picker-column',
							isActive && 'active',
							isDisabled && 'disabled',
						)}
						key={value}
						disabled={isDisabled}
						type="button"
						onClick={() => onSelect(value)}
					>
						<div className="header-row">
							<div>{value}</div>
							{isActive && <Icon icon="small-tick" color="#fff" />}
						</div>
						{activePrivileges.map((item) => {
							const isEnabled = permissionValues.indexOf(item.activeAt) < index + 1;
							return <div className="row">{isEnabled ? '•' : ''}</div>;
						})}
					</button>
				);
			})}
		</div>
	);
};
MemberPermissionPicker.defaultProps = defaultProps;
export default MemberPermissionPicker;
