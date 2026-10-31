import stripIndent from 'strip-indent';

import { sendEmail } from './transport';

export const sendSignupEmail = ({ toEmail, signupUrl }) => {
	return sendEmail({
		to: [toEmail],
		subject: 'Welcome to OpenScience.ph!',
		text: stripIndent(`
			Welcome to OpenScience.ph!

			Click the following link to create your account:

			${signupUrl}

			Sincerely,
			OpenScience.ph Support
		`),
		replyTo: 'admin@openscience.ph',
	});
};
