import { shouldForceBasePubPub } from 'utils/environment';

export const hostIsValid = (req, access) => {
	// This should be merged with the check in getInitialData
	const baseDomains = ['www.pubpub.org', 'journal.pinoyseoul.com', 'journals.openscience.ph'];
	if (process.env.BASE_PORTAL_DOMAIN) baseDomains.push(process.env.BASE_PORTAL_DOMAIN);
	const isBasePubPub = shouldForceBasePubPub() || baseDomains.includes(req.hostname);
	if (!isBasePubPub && access !== 'community') {
		return false;
	}
	if (isBasePubPub && access !== 'pubpub') {
		return false;
	}
	return true;
};
