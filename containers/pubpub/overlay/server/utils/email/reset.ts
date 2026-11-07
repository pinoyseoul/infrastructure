import stripIndent from 'strip-indent';

import { sendEmail, transporter } from './transport';

export { sendEmail, transporter };

export const sendPasswordResetEmail = ({ toEmail, resetUrl }) => {
	// TODO: We should probably indicate the community somewhere.
	// e.g. 'We've received a request to reset your PubPub account on Responsive Science.'
	return sendEmail({
		from: { name: 'OpenScience.ph Accounts', address: 'noreply@openscience.ph' },
		to: [toEmail],
		subject: 'Password Reset — OpenScience.ph',
		text: stripIndent(`
			We've received a password reset request. Follow the link below to reset your password.

			${resetUrl}

			Sincerely,
			OpenScience.ph Support
		`),
	});
};
