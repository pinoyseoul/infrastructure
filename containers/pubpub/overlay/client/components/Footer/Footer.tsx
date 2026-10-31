import React, { useState } from 'react';

import {
	Button,
	Checkbox,
	Classes,
	InputGroup,
	Popover,
	PopoverInteractionKind,
	Position,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import {
	createSocialNavItems,
	defaultFooterLinks,
	getNavItemsForCommunityNavigation,
	type SocialItem,
} from 'client/utils/navigation';
import { GridWrapper } from 'components';
import Icon from 'components/Icon/Icon';
import { usePageContext } from 'utils/hooks';

import './footer.scss';

type OwnProps = {
	previewContext?: any;
};

const defaultProps = {
	previewContext: undefined,
};

type Props = OwnProps & typeof defaultProps;

const basePubPubFooterLinks = [
	{ id: '2', title: 'Login', href: '/login' },
	{ id: '3', title: 'Signup', href: '/signup' },
	{ id: '4', title: 'Legal', href: '/legal' },
];

const baseSocialItems = [
	{
		id: 'si-2',
		icon: 'github',
		title: 'Github',
		value: 'pubpub',
		url: 'https://github.com/pubpub',
	},
	{
		id: 'si-3',
		icon: 'envelope',
		title: 'Contact by email',
		value: 'hello@pubpub.org',
		url: 'mailto:hello@pubpub.org?subject=Contact',
	},
] satisfies SocialItem[];

const Footer = (props: Props) => {
	const [email, setEmail] = useState('');
	const [isLoadingSubscribe, setIsLoadingSubscribe] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const { locationData, communityData } = usePageContext(props.previewContext);
	const { pages = [], collections = [] } = communityData;
	const { isBasePubPub } = locationData;
	const footerLinks = isBasePubPub
		? basePubPubFooterLinks
		: communityData.footerLinks || defaultFooterLinks;
	const navItems = getNavItemsForCommunityNavigation({
		navigation: footerLinks,
		pages,
		collections,
	});
	const handleEmailSubmit = (evt) => {
		evt.preventDefault();
		setIsLoadingSubscribe(true);

		if (!isConfirmed) {
			setIsLoadingSubscribe(false);
			return false;
		}
		return apiFetch('/api/subscribe', {
			method: 'POST',
			body: JSON.stringify({
				email,
			}),
		})
			.then(() => {
				setIsLoadingSubscribe(false);
				setEmail('');
				setIsSubscribed(true);
			})
			.catch((err) => {
				console.error(err);
				setIsLoadingSubscribe(false);
			});
	};
	const pubpubLogo =
		communityData.headerColorType === 'light'
			? '/static/logoBlack.svg'
			: '/static/logoWhite.svg';
	const wrapperClasses = isBasePubPub ? 'base-pubpub' : 'accent-background accent-color';
	const socialItems = isBasePubPub
		? baseSocialItems
		: createSocialNavItems(communityData, 'footer');
	if (isBasePubPub) {
		return (
			<footer className="footer-component os-portal-footer" style={{ background: '#0a192f', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '48px 0 16px', color: '#f8fafc' }}>
				<div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
					<div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', marginBottom: '36px' }}>
						<div style={{ flex: '1 1 360px' }}>
							<h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>OpenScience.ph</h4>
							<p style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '10px' }}>
								An open scholarship repository and digital preservation commons stewarded by OBRA Incorporated in collaboration with Philippine higher education institutions.
							</p>
							<p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
								Advancing institutional research discoverability, sovereign preservation, and permanent diamond open access.
							</p>
						</div>
						<div style={{ flex: '1 1 240px' }}>
							<h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>Repository Standards</h4>
							<ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', lineHeight: '26px', color: '#94a3b8' }}>
								<li style={{ display: 'block' }}>Persistent Resolvable Identifiers</li>
								<li style={{ display: 'block' }}>Standardized Bibliographic Metadata</li>
								<li style={{ display: 'block' }}>FAIR Research Data Principles</li>
								<li style={{ display: 'block' }}>Diamond Open Access</li>
							</ul>
						</div>
						<div style={{ flex: '1 1 240px' }}>
							<h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>Institutional Inquiries</h4>
							<p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, marginBottom: '14px' }}>
								For university partnerships, library onboarding, or collection inquiries:
							</p>
							<a href="https://openscience.pinoyseoul.com/contact.xhtml" style={{ display: 'inline-block', background: '#d97706', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Contact Us &rarr;</a>
						</div>
					</div>
					<div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '12px', color: '#64748b' }}>
						<div>&copy; 2026 OpenScience.ph. Works cataloged are stewarded under individual author licenses.</div>
						<div style={{ textAlign: 'right', marginLeft: 'auto' }}>Powered by MIT PubPub</div>
					</div>
				</div>
			</footer>
		);
	}

	return (
		<div className={`footer-component ${wrapperClasses}`} style={{ marginTop: '40px', paddingBottom: '0px' }}>
			<GridWrapper>
				<div className="left">
					{isBasePubPub && (
						<React.Fragment>
							<div className="title">
								<a href="https://pubpub.org" aria-label="Website">
									<img className="logo" src={pubpubLogo} alt="PubPub logo" />
								</a>
								<ul className="social-list">
									<li>
										<a
											href="mailto:admin@openscience.ph?subject=Contact"
											aria-label="Contact via email"
										>
											<Icon icon="envelope" />
										</a>
									</li>
									<li>
										<a href="https://github.com/pubpub" aria-label="GitHub">
											<Icon icon="github" />
										</a>
									</li>
								</ul>
							</div>
							<ul className="separated">
								<li>
									<a href="https://help.pubpub.org">Help</a>
								</li>
								<li>
									<a href="https://github.com/pubpub/pubpub/discussions">Forum</a>
								</li>
								{/* <li>
									<a href="https://www.knowledgefutures.org/pubpub/">
										Learn about the new PubPub Platform
									</a>
								</li> */}
							</ul>

							<form onSubmit={handleEmailSubmit}>
								<strong>Feature & Community Newsletter</strong>
								<InputGroup
									type="email"
									placeholder="Your Email"
									value={email}
									onChange={(evt) => {
										setEmail(evt.target.value);
									}}
									// @ts-expect-error ts-migrate(2322) FIXME: Type '{ type: string; placeholder: string; value: ... Remove this comment to see the full error message
									label="Feature & community newsletter"
									rightElement={
										<Button
											type="submit"
											icon={!isSubscribed ? 'arrow-right' : 'tick'}
											minimal={true}
											loading={isLoadingSubscribe}
										/>
									}
									disabled={isSubscribed}
								/>
								<div className="confirm">
									<Checkbox
										checked={isConfirmed}
										disabled={isSubscribed}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'boolean |... Remove this comment to see the full error message
										required="required"
										onChange={(evt) => {
											// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
											setIsConfirmed(evt.target.checked);
										}}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'string'.
										label={
											<span>
												<Popover
													interactionKind={PopoverInteractionKind.HOVER}
													popoverClassName={
														Classes.POPOVER_CONTENT_SIZING
													}
													position={Position.RIGHT}
												>
													<p>
														<em>I agree to receive this newsletter.</em>
													</p>
													<div>
														<p>
															We use a third party provider,
															Mailchimp, to deliver our newsletters.
															We never share your data with anyone,
															and you can unsubscribe using the link
															at the bottom of every email. Learn more
															by visiting your&nbsp;
															<a href="/legal/privacy">
																privacy settings
															</a>
															.
														</p>
													</div>
												</Popover>
											</span>
										}
									/>
								</div>
							</form>
						</React.Fragment>
					)}
					{!isBasePubPub && communityData.footerImage && (
						<a href={communityData.footerLogoLink || '/'}>
							<img
								src={communityData.footerImage}
								className="footer-image"
								alt={communityData.footerTitle || communityData.title}
							/>
						</a>
					)}
				</div>
				<div className="right">
					<div className="footer-title">
						<a href="/">{communityData.footerTitle || communityData.title}</a>
					</div>
					<ul className="separated">
						{navItems.map((navItem) => {
							if ('href' in navItem) {
								return (
									<li key={`footer-item-${navItem.id}`}>
										<a className="link" href={navItem.href}>
											{navItem.title}
										</a>
									</li>
								);
							}
							return null;
						})}
					</ul>
					{!!socialItems.length && (
						<ul className="social-list">
							{socialItems.map((item) => {
								return (
									<li key={`social-item-${item.id}`}>
										<a
											href={item.url}
											aria-label={item.title}
											{...item.additionalAttributes}
										>
											<Icon icon={item.icon} />
										</a>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</GridWrapper>
			<div className="os-small-footer-bar" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px 24px', margin: '16px auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1240px', fontSize: '12px', color: '#64748b' }}>
				<div>&copy; 2026 OpenScience.ph. Works cataloged are stewarded under individual author licenses.</div>
				<div style={{ textAlign: 'right', marginLeft: 'auto' }}>Powered by MIT PubPub</div>
			</div>
		</div>
	);
};
Footer.defaultProps = defaultProps;
export default Footer;
