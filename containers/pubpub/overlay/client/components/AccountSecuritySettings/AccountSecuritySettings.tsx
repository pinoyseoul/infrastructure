import React from 'react';

import { AnchorButton, Card } from '@blueprintjs/core';

type Props = {
	userEmail: string;
	accountUrl: string;
};

const AccountSecuritySettings = ({ userEmail, accountUrl }: Props) => {
	return (
		<Card>
			<h5 id="account-security">Email &amp; password</h5>
			<p>
				Your email address is <strong>{userEmail}</strong>. Your credentials and login
				details are managed directly within your sovereign OpenScience.ph account.
			</p>
			<AnchorButton
				href="/reset"
				intent="primary"
				rightIcon="key"
				text="Update your password"
			/>
		</Card>
	);
};

export default AccountSecuritySettings;
