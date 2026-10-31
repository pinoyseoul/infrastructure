import stripIndent from 'strip-indent';

import { sendEmail } from './transport';

export const sendServicesInquiryEmail = ({ contactEmail, additionalDetails, selections }) => {
	return sendEmail({
		to: ['admin@openscience.ph'],
		subject: 'Community Services Form Submission',
		text: stripIndent(`
			A Community Services inquiry was submitted:
			
			Contact Email: ${contactEmail},
			
			-----
			${selections}
			-----
			
			Additional Details: ${additionalDetails}
		
			Sincerely,
			OpenScience.ph System
		`),
		replyTo: 'admin@openscience.ph',
	});
};
