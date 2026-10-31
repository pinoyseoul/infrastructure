import React from 'react';

import { GridWrapper } from 'components';

import './about.scss';

const About = function () {
	return (
		<div id="about-container">
			<GridWrapper containerClassName="narrow">
				<h1>Our Mission</h1>
				<h2>OpenScience.ph provides sovereign Diamond Open Access publishing infrastructure.</h2>
				<p>
					OpenScience.ph supports institutional repositories and scholarly journals, from peer-reviewed scholarly
					journals and books to novel community publishing experiments, and everything in
					between. These communities are created and maintained by university presses,
					society publishers, library publishers, independent scholar-led publishers,
					academic departments, research labs, ad-hoc communities, individuals, and many
					others. OpenScience.ph provides infrastructure for each part of the publishing process,
					from drafting documents, conducting peer review, and hosting entire journal and
					book websites to collecting and displaying reader feedback and analytics.
				</p>
				<h2>Features, Benefits, and Tradeoffs</h2>
				<p>
					OpenScience.ph is an open-source, sovereign, free-to-use publishing platform designed
					to help knowledge communities of all types collaboratively create and share
					knowledge online. OpenScience.ph’s flexible, extensible system allows communities to
					create the dynamic content that best represents their work, whether it’s a
					traditional academic journal, a book, a repository of interactive documents, a
					blog, all of the above, or something in between. If needed, OpenScience.ph then helps
					communities integrate their work into academic infrastructure like Crossref and
					Google Scholar without the need to remake it to conform to legacy expectations
					of how academic outputs are structured.
				</p>
				<p>
					OpenScience.ph is built for academic communities of all types, but may be ideal for you if your
					community:
				</p>
				<ul>
					<li>Wants to create web-native, dynamic content.</li>
					<li>Wants to collaborate on content creation.</li>
					<li>
						Wants to integrate your content into academic systems and formats like
						Crossref, Google Scholar, and JATS XML with as little effort as possible.
					</li>
					<li>Doesn’t have high levels of technical expertise on-staff.</li>
					<li>
						Doesn’t want to manage your own servers and worry about updates, plugin
						compatibility, or users breaking layouts.
					</li>
				</ul>
				<p>The platform may not be ideal if your community:</p>
				<ul>
					<li>
						Publishes primarily PDF content, or has an audience that primarily consumes
						content as PDF.
					</li>
					<li>
						Needs precise control over the look and feel of its website or its PDFs.
					</li>
					<li>
						Needs precise control over academic metadata or output formats like JATS
						XML.
					</li>
					<li>Needs or wants to self-host their technology.</li>
				</ul>
				<p>
					To learn more about the features, benefits and tradeoffs of using OpenScience.ph, explore our documentation or contact administration.
				</p>
				<h2>Technical Support</h2>
				<p>
					We offer forum-based, community support for all OpenScience.ph users. Feel free to reach out
					to our administration team at <a href="mailto:admin@openscience.ph">admin@openscience.ph</a>
					at any time for institutional support, partnerships, or training.
				</p>
				<p>
					For groups that want personalized support, we offer production, training, and
					strategy services for building high quality, effective publishing communities.
					Services include content production, editorial services, site design, back file
					import, training, interactive production, branding, and more.{' '}
					<a href="/community-services">
						Learn more about our Community Services offerings
					</a>
					.
				</p>
				<h2>Roadmap &amp; Contribution</h2>
				<p>
					OpenScience.ph coordinates development and platform enhancements through OBRA Incorporated.
					To suggest a feature, report an issue, or inquire about institutional onboarding,
					contact <a href="mailto:admin@openscience.ph">admin@openscience.ph</a>.
				</p>
				<h2>Mission, Values, and Sustainability</h2>
				<p>
					OpenScience.ph provides open-source infrastructure to publish knowledge credibly and
					tools to facilitate community participation. For-profit academic publishing
					models that mount paywalls to monopolize publicly funded research hinder the
					reach of public knowledge and thereby contradict the ultimate goal of its
					creators. At OpenScience.ph we value the creation of knowledge and advocate for the
					people that are contributing to our collective understanding.
				</p>
				<p>
					In the last several years, many once-independent publishing tools have been
					consolidated into closed platforms. We believe researchers need open-source,
					academically supported, end-to-end alternatives to these proprietary platforms
					and publishing models. In our vision of the future, knowledge communities play a
					lead role in building and maintaining our knowledge systems, reclaiming
					territory that was ceded to proprietary solutions.
				</p>
				<p>
					OpenScience.ph is maintained by OBRA Incorporated, an independent Philippine
					non-profit organization committed to academic preservation and public knowledge.
					OpenScience.ph operates under a Diamond Open Access model where readers pay no
					subscriptions and authors pay zero Article Processing Charges.
				</p>
				<p>
					OpenScience.ph is sustained through institutional consortia partnerships with State
					Universities and Colleges, Local Universities and Colleges, and private academic
					institutions across the Philippines under domestic procurement frameworks.
				</p>
				<h2>Other Useful Resources</h2>
				<ul>
					<li>
						<a href="/explore">Check out our Explore Page</a> for a curated list of Philippine
						academic journals and institutional communities.{' '}
					</li>
					<li>
						<a href="/about">Visit our Documentation</a> for guides and
						reference materials for setting up and maintaining journals.
					</li>
					<li>
						For platform documentation and onboarding assistance, visit our institutional portal.
					</li>
					<li>
						For general inquiries and academic partnership requests, contact our administration team.
					</li>
					<li>
						If you have questions or are interested in collaborating, get in touch
						directly at{' '}
						<a href="mailto:admin@openscience.ph?subject=About+Page+Question">
							admin@openscience.ph
						</a>
						.
					</li>
				</ul>
				<p>—The OpenScience.ph Team</p>
			</GridWrapper>
		</div>
	);
};

export default About;
