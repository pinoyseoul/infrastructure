import crypto from 'crypto';
import { NextFunction, Request, Response, Router } from 'express';
import passport from 'passport';
import { Op } from 'sequelize';

import { User } from 'server/models';
import { wrap } from 'server/wrap';
import { isDevelopment } from 'utils/environment';

export const router = Router();

router.get(
	'/auth/zotero',
	wrap(async (req, res, next) => {
		if (req.user) {
			const authRedirectHost = req.get('host');
			await User.update({ authRedirectHost }, { where: { id: req.user.id } });
		} else {
			res.redirect('/');
		}
		next();
	}),
	passport.authenticate('zotero', { state: 'test' }),
);

// callback route for zotero to redirect to
// hand control to passport to use code to grab profile info
router.get('/auth/zotero/redirect', (req, res, next) => {
	const host = req.user?.authRedirectHost;
	const urlBase = isDevelopment() ? 'http://lvh.me:9876' : `https://${host}`;

	passport.authenticate('zotero', {
		failureRedirect: `${urlBase}/legal/settings?integration=fail`,
		successRedirect: `${urlBase}/legal/settings?integration=success`,
	})(req, res, next);
});

// ORCID OAuth Initiation Route
router.get('/auth/orcid', (req: Request, res: Response) => {
	const clientId = process.env.ORCID_CLIENT_ID;
	if (!clientId) {
		console.error('ORCID_CLIENT_ID is not configured');
		return res.redirect('/login?error=orcid_not_configured');
	}
	const canonicalHost = process.env.BASE_PORTAL_DOMAIN || req.get('host') || 'journal.pinoyseoul.com';
	const redirectUri = encodeURIComponent(`https://${canonicalHost}/auth/orcid/callback`);
	
	// Preserve full community origin or explicit return destination
	let returnUrl = (req.query.returnTo || req.query.redirect) as string;
	if (!returnUrl) {
		const requestHost = req.get('host');
		returnUrl = requestHost ? `https://${requestHost}/` : '/';
	}
	const state = Buffer.from(returnUrl).toString('base64url');
	const orcidUrl = `https://orcid.org/oauth/authorize?client_id=${clientId}&response_type=code&scope=/authenticate&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}`;
	return res.redirect(orcidUrl);
});

// ORCID OAuth Token Exchange & Auto-Registration Callback
router.get('/auth/orcid/callback', async (req: Request, res: Response, next: NextFunction) => {
	const { code, state } = req.query;
	if (!code) {
		return res.redirect('/?orcid=error_no_code');
	}
	try {
		const clientId = process.env.ORCID_CLIENT_ID;
		const clientSecret = process.env.ORCID_CLIENT_SECRET;
		if (!clientId || !clientSecret) {
			console.error('ORCID credentials are not configured in environment');
			return res.redirect('/login?error=orcid_not_configured');
		}
		const canonicalHost = process.env.BASE_PORTAL_DOMAIN || req.get('host') || 'journal.pinoyseoul.com';
		const redirectUri = `https://${canonicalHost}/auth/orcid/callback`;

		const tokenRes = await fetch('https://orcid.org/oauth/token', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				code: String(code),
				redirect_uri: redirectUri,
			}),
		});

		const tokenData = await tokenRes.json();
		if (tokenData.error || !tokenData.orcid) {
			console.error('ORCID token exchange error:', tokenData);
			return res.redirect('/?orcid=error_token');
		}

		const orcidId = tokenData.orcid;
		const orcidName = (tokenData.name || '').trim();

		// Resolve return destination safely from encoded state
		let destination = '/';
		if (state && typeof state === 'string') {
			try {
				const decoded = Buffer.from(state, 'base64url').toString('utf-8');
				if (decoded.startsWith('/') || decoded.startsWith('http://') || decoded.startsWith('https://')) {
					destination = decoded;
				}
			} catch {
				destination = state.startsWith('/') ? state : '/';
			}
		}

		// Safe Case 1: Active user session -> link ORCID
		if (req.user) {
			await User.update({ orcid: orcidId }, { where: { id: (req.user as any).id } });
			return res.redirect(destination !== '/' ? destination : `/user/${(req.user as any).slug}`);
		}

		// Safe Case 2: Existing user matched by ORCID ID
		let user = await User.findOne({ where: { orcid: orcidId } });

		// Safe Case 3: Public Email cross-match from ORCID API
		let orcidEmail: string | null = null;
		if (!user) {
			try {
				const emailRes = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/email`, {
					headers: {
						'Accept': 'application/json',
						'Authorization': `Bearer ${tokenData.access_token}`,
					},
				});
				if (emailRes.ok) {
					const emailData = await emailRes.json();
					if (emailData?.email?.length > 0) {
						const primary = emailData.email.find((e: any) => e.primary) || emailData.email[0];
						if (primary?.email) {
							orcidEmail = primary.email.toLowerCase().trim();
						}
					}
				}
			} catch (e) {
				console.error('Could not query ORCID email API:', e);
			}

			if (orcidEmail) {
				user = await User.findOne({ where: { email: orcidEmail } });
				if (user) {
					await user.update({ orcid: orcidId });
				}
			}
		}

		// Safe Case 4: Clean new researcher auto-provisioning
		if (!user) {
			const userId = crypto.randomUUID();
			const rawName = orcidName || 'Researcher';
			const nameParts = rawName.split(' ');
			const firstName = nameParts[0] || 'Researcher';
			const lastName = nameParts.slice(1).join(' ') || '';
			const fullName = rawName;
			const initials = `${firstName[0] || 'R'}${lastName[0] || ''}`.toUpperCase().slice(0, 5);
			const baseSlug = (fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'researcher';

			const count = await User.count({ where: { slug: { [Op.like]: `${baseSlug}%` } } });
			const slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;
			const userEmail = orcidEmail || `${orcidId}@orcid.org`;

			user = await User.create({
				id: userId,
				slug,
				firstName,
				lastName,
				fullName,
				initials,
				email: userEmail,
				orcid: orcidId,
				isSuperAdmin: false,
				hash: '',
				salt: '',
			});
		}

		// Establish session
		return (req as any).login(user, (err: any) => {
			if (err) return next(err);
			return res.redirect(destination);
		});
	} catch (err) {
		console.error('ORCID callback error:', err);
		return res.redirect('/?orcid=error_exception');
	}
});

