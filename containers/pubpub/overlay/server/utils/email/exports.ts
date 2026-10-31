import stripIndent from 'strip-indent';

import { sendEmail } from './transport';

export const sendAccountExportReadyEmail = ({
	toEmail,
	downloadUrl,
}: {
	toEmail: string;
	downloadUrl: string;
}) => {
	return sendEmail({
		to: [toEmail],
		subject: 'Your OpenScience.ph Data Export is Ready',
		text: stripIndent(`
			Your OpenScience.ph account data export is ready to download.

			${downloadUrl}

			This link will expire in 7 days. Please download your data before then.

			Sincerely,
			OpenScience.ph Support
		`),
		replyTo: 'admin@openscience.ph',
	});
};

export const sendCommunityExportReadyEmail = ({
	toEmail,
	communityTitle,
	downloadUrl,
}: {
	toEmail: string;
	communityTitle: string;
	downloadUrl: string;
}) => {
	return sendEmail({
		to: [toEmail],
		subject: `Your OpenScience.ph Journal Export is Ready · ${communityTitle}`,
		text: stripIndent(`
			The data export for your community "${communityTitle}" is ready to download.

			${downloadUrl}

			This link will expire in 7 days. Please download your data before then.

			Sincerely,
			OpenScience.ph Support
		`),
		replyTo: 'admin@openscience.ph',
	});
};
