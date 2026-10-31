import React from 'react';

import { Classes } from '@blueprintjs/core';

import { GridWrapper } from 'components';

import './pricing.scss';

const Pricing = () => {
	return (
		<div id="pricing-container">
			<GridWrapper>
				<h1>Diamond Open Access: Free for Readers and Authors.</h1>
				<p className="description top">
					OpenScience.ph operates under the Diamond Open Access model. Readers enjoy full-text
					access with zero subscriptions or paywalls. Authors, faculty, and student researchers
					never pay Article Processing Charges (APCs) to submit or publish their scholarship.
					Infrastructure is sustained collectively through institutional partnerships with OBRA Incorporated.
				</p>
				<div className="pricing-tiers">
					<div className={`option ${Classes.CARD} ${Classes.ELEVATION_1}`}>
						<h2>Institutional Partnership</h2>
						<p>
							OpenScience.ph is maintained by OBRA Incorporated, an academic non-profit
							organization registered in the Philippines. We partner directly with Philippine
							State Universities and Colleges, Local Universities and Colleges, and private HEIs
							under Republic Act No. 9184 via Small Value Procurement.
						</p>
						<p>
							Partnership includes dedicated institutional subdomains, permanent digital preservation,
							OAI-PMH indexing feeds for global citation indexes, and turnkey accreditation compliance
							for CHED and AACCUP reviews.
						</p>
						<a
							href="mailto:admin@openscience.ph?subject=Institutional%20Partnership%20Inquiry"
							className={`${Classes.BUTTON} ${Classes.LARGE} ${Classes.INTENT_PRIMARY}`}
						>
							Inquire with OBRA
						</a>
					</div>
					<div className={`option ${Classes.CARD} ${Classes.ELEVATION_1}`}>
						<h2>Community Services</h2>
						<p>
							For groups that want personalized support we offer production, training,
							and strategy services for building high quality, effective publishing
							communities. Services include content production, editorial services,
							site design, back file import, training, interactive production,
							branding, and more.
						</p>
						<p>
							Our clients include{' '}
							<a
								href="https://academicentrepreneurship.pubpub.org/"
								target="_blank"
								rel="noopener noreferrer"
							>
								The Children's Hospital of Philadelphia
							</a>
							,{' '}
							<a
								href="https://hdsr.mitpress.mit.edu"
								target="_blank"
								rel="noopener noreferrer"
							>
								the Harvard Data Science Review
							</a>
							,{' '}
							<a
								href="https://participa.conl.mx/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Consejo Nuevo León
							</a>
							,{' '}
							<a href="https://apaopen.org" target="_blank" rel="noopener noreferrer">
								the American Psychological Association
							</a>
							,{' '}
							<a
								href="https://mit-serc.pubpub.org"
								target="_blank"
								rel="noopener noreferrer"
							>
								MIT's Schwarzman College of Computing
							</a>
							, and others.
						</p>
						<a
							href="/community-services"
							target="_blank"
							rel="noopener noreferrer"
							className={`${Classes.BUTTON} ${Classes.LARGE} ${Classes.INTENT_PRIMARY}`}
						>
							Learn more
						</a>
					</div>
				</div>
				<p className="fine-print">
					Persistent identifiers are assigned to ensure permanent digital preservation and global discoverability across citation networks.
				</p>
			</GridWrapper>
		</div>
	);
};

export default Pricing;
