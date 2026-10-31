import type { DepositRecord } from 'types';

import React from 'react';

import { Button } from '@blueprintjs/core';

import InputField from '../InputField/InputField';
import { SubmitDepositStatus } from './SubmitDepositStatus';

type Props = {
	depositRecord?: DepositRecord;
	disabled?: boolean;
	error?: string;
	onClick?: () => void;
	status: SubmitDepositStatus;
};

const buttonTextByStatus = {
	[SubmitDepositStatus.Initial]: 'Assign Persistent Identifier',
	[SubmitDepositStatus.Previewing]: 'Generating Preview',
	[SubmitDepositStatus.Previewed]: 'Submit Deposit',
	[SubmitDepositStatus.Depositing]: 'Assigning Identifier...',
	[SubmitDepositStatus.Deposited]: 'Identifier Assigned',
};

const getButtonText = (status: SubmitDepositStatus, depositRecord?: DepositRecord) => {
	if (status === SubmitDepositStatus.Initial && depositRecord) {
		return 'Update Persistent Identifier';
	}
	if (status === SubmitDepositStatus.Previewed && depositRecord) {
		return 'Re-Submit Deposit';
	}

	return buttonTextByStatus[status];
};

export default function SubmitDepositButton(props: Props) {
	return (
		<InputField error={props.error}>
			<Button
				disabled={props.disabled || !props.onClick}
				text={getButtonText(props.status, props.depositRecord)}
				loading={
					props.status === SubmitDepositStatus.Previewing ||
					props.status === SubmitDepositStatus.Depositing
				}
				onClick={props.onClick}
				icon={props.status === SubmitDepositStatus.Deposited && 'tick'}
			/>
		</InputField>
	);
}
