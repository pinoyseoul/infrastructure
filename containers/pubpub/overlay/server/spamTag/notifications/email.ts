import type { BanReason, UserSpamTagFields } from 'types';

import stripIndent from 'strip-indent';

import { sendEmail } from 'server/utils/email/reset';
import { getSuperAdminTabUrl } from 'utils/superAdmin';

import { buildReasonText, getSpamDashUrl } from './shared';

export const DEV_TEAM_EMAIL = 'admin@openscience.ph';

export type BanEmailOptions = {
	toEmail: string;
	userName: string;
	/** Human-readable description of why the account was restricted. */
	reason?: string;
	/** Whether the decision was made (in whole or part) using automated means. */
	isAutomated?: boolean;
};

export const sendSpamBanEmail = ({ toEmail, userName, reason, isAutomated }: BanEmailOptions) => {
	const reasonBlock = reason
		? `Specifically, the following was identified:\n${reason}`
		: 'Our systems identified activity on your account that is inconsistent with legitimate use of the platform.';

	const automatedBlock = isAutomated
		? 'This decision was made with the assistance of automated detection systems and may be reviewed by a human moderator.'
		: 'This decision was made by a human moderator.';

	return sendEmail({
		to: [toEmail],
		subject: 'OpenScience.ph account restriction',
		text: stripIndent(`
			Hello${userName ? ` ${userName}` : ''},

			Your OpenScience.ph account has been restricted because your activity was found to be in violation of our Acceptable Use Policy (https://openscience.ph/legal/aup), specifically the prohibition on spam, unsolicited messages, and commercial communications.

			${reasonBlock}

			${automatedBlock}

			As a result, your account has been suspended. You are no longer able to log in or use the platform. Your existing content may be hidden from public view.

			If you believe this is an error, you may:
			- Contact us at admin@openscience.ph to request an internal review of this decision.
			- Seek resolution through an out-of-court dispute settlement body certified under the Digital Services Act.
			- Pursue judicial redress in a court of competent jurisdiction.

			Sincerely,
			OpenScience.ph Team
		`),
	});
};

export const sendSpamLiftedEmail = ({
	toEmail,
	userName,
}: {
	toEmail: string;
	userName: string;
}) => {
	return sendEmail({
		to: [toEmail],
		subject: 'OpenScience.ph account restriction lifted',
		text: stripIndent(`
			Hello${userName ? ` ${userName}` : ''},

			The restriction on your OpenScience.ph account has been lifted. You can log in and use the platform as usual.

			Sincerely,
			OpenScience.ph Team
		`),
	});
};

export const sendNewSpamTagDevEmail = ({
	userEmail,
	userName,
	reason,
}: {
	userEmail: string;
	userName: string;
	reason?: UserSpamTagFields;
}) => {
	const reviewUrl = `https://pinoyseoul.com${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userEmail)}`;
	const reasonText = buildReasonText(reason);
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `New spam tag: ${userName} (${userEmail})`,
		text: stripIndent(`
			A new spam tag has been created for ${userName} (${userEmail}).

			${reasonText ? `Reason(s): ${reasonText}` : ''}

			Review: ${reviewUrl}

			-- OpenScience.ph Administration
		`),
	});
};

export const sendBanDevEmail = ({
	userEmail,
	userName,
	actorName,
	reason,
}: {
	userEmail: string;
	userName: string;
	actorName?: string;
	reason?: UserSpamTagFields;
}) => {
	const reviewUrl = getSpamDashUrl(userName);
	const reasonText = buildReasonText(reason);
	const byText = actorName ? ` by ${actorName}` : '';
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `User banned: ${userName} (${userEmail})`,
		text: stripIndent(`
			${userName} (${userEmail}) has been banned${byText}.

			${reasonText ? `Reason(s): ${reasonText}` : ''}

			Review: ${reviewUrl}

			-- OpenScience.ph Administration
		`),
	});
};

export const sendLiftDevEmail = ({
	userEmail,
	userName,
}: {
	userEmail: string;
	userName: string;
}) => {
	const reviewUrl = `https://pinoyseoul.com${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userEmail)}`;
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `Restriction lifted: ${userName} (${userEmail})`,
		text: stripIndent(`
			The restriction on ${userName} (${userEmail}) has been lifted.

			Review: ${reviewUrl}

			-- OpenScience.ph Administration
		`),
	});
};

export const sendCommunityBanUserEmail = ({
	toEmail,
	userName,
	communityName,
	reason,
}: {
	toEmail: string;
	userName: string;
	communityName: string;
	reason?: string;
}) => {
	const reasonLine = reason ? `Reason given: ${reason}.` : '';
	return sendEmail({
		to: [toEmail],
		subject: `You have been removed from a journal on OpenScience.ph`,
		text: stripIndent(`
			Hello${userName ? ` ${userName}` : ''},

			An administrator of the journal "${communityName}" on OpenScience.ph has removed you from their community. You are no longer able to post or interact within that community. ${reasonLine}

			This action was taken by a journal administrator based on their journal guidelines and PubPub's Acceptable Use Policy (https://openscience.ph/legal/aup). You may still use PubPub and participate in other communities.

			If you believe this is an error, you may:
			- Contact us at admin@openscience.ph to request a review of this decision.
			- Seek resolution through an out-of-court dispute settlement body certified under the Digital Services Act.
			- Pursue judicial redress in a court of competent jurisdiction.

			Sincerely,
			OpenScience.ph Team
		`),
	});
};

export const sendCommunityFlagDevEmail = ({
	userName,
	userSlug,
	actorFullName,
	actorSlug,
	communitySubdomain,
	flagReason,
	flagReasonText,
}: {
	userName: string;
	userSlug: string;
	actorFullName: string;
	actorSlug: string;
	communitySubdomain: string;
	flagReason: BanReason;
	flagReasonText?: string | null;
}) => {
	const reviewUrl = `https://pinoyseoul.com${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userName)}`;
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `Community flag: ${userName || 'Unknown'} flagged for ${flagReason}`,
		text: stripIndent(`
			A community admin (${actorFullName} (https://pinoyseoul.com/user/${actorSlug})) has flagged ${userName} (https://pinoyseoul.com/user/${userSlug}) for "${flagReason}" in community https://${communitySubdomain}.openscience.ph.

			${flagReasonText ? `Reason: ${flagReasonText}` : ''}

			Review: ${reviewUrl}

			-- OpenScience.ph Administration
		`),
	});
};

export const sendCommunityFlagResolvedEmail = ({
	toEmail,
	actorName,
	userName,
	resolution,
}: {
	toEmail: string;
	actorName: string;
	userName: string;
	resolution: string;
}) => {
	return sendEmail({
		to: [toEmail],
		subject: `Update on moderation review of ${userName} on OpenScience.ph`,
		text: stripIndent(`
			Hello${actorName ? ` ${actorName}` : ''},

			Thank you for flagging ${userName} in your community. We have reviewed the ban and the outcome is: ${resolution}.

			If you have further concerns, please contact us at admin@openscience.ph.

			Sincerely,
			OpenScience.ph Team
		`),
	});
};
