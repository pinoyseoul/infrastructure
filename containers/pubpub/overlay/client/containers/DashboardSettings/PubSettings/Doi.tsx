import type { DepositTarget } from 'types';
import type { RelationTypeName } from 'utils/pubEdge/relations';

import React, { Component } from 'react';

import { Button, Callout, Collapse, FormGroup, InputGroup } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { AssignDoi } from 'components';
import { getPrimaryCollection } from 'utils/collections/primary';
import { getSchemaForKind } from 'utils/collections/schemas';
import { PUBPUB_DOI_PREFIX } from 'utils/crossref/communities';
import { isDoi } from 'utils/crossref/parseDoi';
import {
	findParentEdgeByRelationTypes,
	RelationType,
	relationTypeDefinitions,
} from 'utils/pubEdge/relations';

import './doi.scss';

import { WhyAmISeeingThis } from './WhyAmISeeingThis';

type RelationshipIssue = {
	type:
		| 'internal_not_deposited'
		| 'external_doi_not_in_crossref'
		| 'external_doi_not_crossref_registrar'
		| 'external_url_no_doi_found';
	message: string;
	edgeId: string;
	targetTitle: string;
	targetDoi?: string;
	targetUrl?: string;
	relationType: RelationTypeName;
	targetPubId?: string;
	targetPubSlug?: string;
	targetCommunitySubdomain?: string;
};

type Props = {
	canIssueDoi: boolean;
	communityData: any;
	pubData: any;
	updatePubData: (...args: any[]) => any;
	depositTarget?: DepositTarget;
	depositDisabled?: boolean;
};

const extractDoiSuffix = (doi: string, depositTarget?: DepositTarget) => {
	const prefix = depositTarget?.doiPrefix ?? PUBPUB_DOI_PREFIX;
	return doi.replace(`${prefix}/`, '');
};

type State = any;

class Doi extends Component<Props, State> {
	constructor(props: Props) {
		super(props);

		const [, doiSuffix] = (props.pubData.doi || '').split('/');

		this.state = {
			isLinkingExternal: false,
			customIdentifier: props.pubData.doi || '',
			doiSuffix,
			error: false,
			justSetDoi: false,
			deleting: false,
			generating: false,
			success: false,
			updating: false,
			validationIssues: [] as RelationshipIssue[],
			validationLoading: false,
		};

		this.handleDeposit = this.handleDeposit.bind(this);
		this.handleUpdateDoiClick = this.handleUpdateDoiClick.bind(this);
		this.handleGenerateDoiClick = this.handleGenerateDoiClick.bind(this);
		this.handleDeleteDoiClick = this.handleDeleteDoiClick.bind(this);
	}

	componentDidMount() {
		this.fetchValidationIssues();
	}

	async fetchValidationIssues() {
		const { communityData, pubData } = this.props;

		this.setState({ validationLoading: true });

		try {
			const params = new URLSearchParams({
				communityId: communityData.id,
				pubId: pubData.id,
			});
			const response = await apiFetch(`/api/doi/validate?${params.toString()}`);
			this.setState({
				validationIssues: response.issues,
				validationLoading: false,
			});
		} catch (_err) {
			this.setState({ validationLoading: false });
		}
	}

	getDoiPrefix() {
		return this.props.depositTarget?.doiPrefix ?? PUBPUB_DOI_PREFIX;
	}

	getFullDoi() {
		return `${this.getDoiPrefix()}/${this.state.doiSuffix}`;
	}

	getHelperText(invalidDoi) {
		const { success, error } = this.state;
		let helperText = '';

		if (invalidDoi) {
			helperText = 'Invalid identifier suffix';
		} else if (error) {
			helperText = 'There was a problem updating the identifier suffix';
		} else if (success) {
			helperText = this.getFullDoi().startsWith('ark:')
				? 'Identifier suffix updated successfully on PubPub. Resolves globally via N2T.net.'
				: 'DOI suffix updated succesfully on PubPub. To take effect, the DOI must be submitted to Crossref.';
		}

		return helperText;
	}

	getIntent(invalidDoi) {
		const { success, error } = this.state;
		let intent = 'none';

		if (invalidDoi || error) {
			intent = 'danger';
		} else if (success) {
			intent = 'success';
		}

		return intent;
	}

	findSupplementTo() {
		const { pubData } = this.props;
		return findParentEdgeByRelationTypes(pubData, [RelationType.Supplement]);
	}

	findParentPubEdge() {
		const { pubData } = this.props;
		const parentEdge = findParentEdgeByRelationTypes(pubData, [
			RelationType.Supplement,
			RelationType.Review,
			RelationType.Rejoinder,
			RelationType.Preprint,
		]);

		if (!parentEdge || parentEdge.externalPublication) {
			return null;
		}

		return parentEdge;
	}

	disabledDueToParentWithoutDoi() {
		const parentEdge = this.findParentPubEdge();

		if (!parentEdge) {
			return false;
		}

		const parentPub = parentEdge.pubIsParent ? parentEdge.pub : parentEdge.targetPub;

		return parentPub && !parentPub.doi;
	}

	disabledDueToNoReleases() {
		const { pubData } = this.props;
		return pubData.releases.length === 0;
	}

	disabledDueToUnmanagedPrefix() {
		const hasCrossref = !!(this.props.communityData?.crossrefUsername && this.props.communityData?.crossrefPassword);
		if (!hasCrossref) {
			return false;
		}
		return this.props.depositTarget && !this.props.depositTarget.isPubPubManaged;
	}

	handleDeposit(doi) {
		const { updatePubData } = this.props;

		this.setState({ justSetDoi: true });
		updatePubData({ doi });
	}

	async updateDoi(doi, pendingStateKey, fallback) {
		const { updating, deleting } = this.state;
		const { communityData, pubData, updatePubData } = this.props;

		if (updating || deleting) {
			return;
		}

		this.setState({
			[pendingStateKey]: true,
			error: false,
			success: false,
		});

		try {
			const response = await apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					doi,
					pubId: pubData.id,
					communityId: communityData.id,
				}),
			});
			this.setState({
				[pendingStateKey]: false,
				doiSuffix: extractDoiSuffix(response.doi, this.props.depositTarget),
				error: false,
				success: true,
			});
			updatePubData({ doi: response.doi });
		} catch (_err) {
			this.setState({
				[pendingStateKey]: false,
				doiSuffix: fallback,
				error: true,
				success: false,
			});
		}
	}

	async handleDeleteDoiClick() {
		this.updateDoi('', 'deleting', this.state.doiSuffix);
	}

	async handleGenerateDoiClick() {
		const { updating, deleting, generating } = this.state;
		const { communityData, pubData } = this.props;

		if (updating || deleting || generating) {
			return;
		}

		this.setState({
			generating: true,
			error: false,
			success: false,
		});

		try {
			const params = new URLSearchParams({
				target: 'pub',
				communityId: communityData.id,
				pubId: pubData.id,
			});

			// Fetch a DOI preview which contains a newly generated DOI.
			const response = await apiFetch(`/api/generateDoi?${params.toString()}`);

			this.setState({
				generating: false,
				doiSuffix: extractDoiSuffix(response.dois.pub, this.props.depositTarget),
				error: false,
				success: false,
			});
		} catch (_err) {
			this.setState({
				generating: false,
				error: true,
				success: false,
			});
		}
	}

	async handleUpdateDoiClick() {
		const { pubData } = this.props;
		const doi = this.getFullDoi();
		const currentDoiSuffix = extractDoiSuffix(pubData.doi || '', this.props.depositTarget);
		this.updateDoi(doi, 'updating', currentDoiSuffix);
	}

	isDoiEditableWithoutRelations() {
		const { canIssueDoi, pubData } = this.props;
		const { justSetDoi } = this.state;
		const doiPrefix = this.getDoiPrefix();

		// The DOI is editable if
		return (
			// user has the correct permissions
			canIssueDoi &&
			// a deposit has not been submitted yet for this work
			!(justSetDoi || pubData.crossrefDepositRecordId) &&
			// and the Community has a custom DOI prefix
			this.props.depositTarget &&
			doiPrefix !== PUBPUB_DOI_PREFIX
		);
	}

	isDoiEditable() {
		return (
			this.isDoiEditableWithoutRelations() &&
			// the Pub is not a supplement to another work
			!this.findSupplementTo()
		);
	}

	renderParentEdgeRelation() {
		const parentPubEdge = this.findParentPubEdge();

		if (!parentPubEdge) {
			return null;
		}

		const relationDefinition = relationTypeDefinitions[parentPubEdge.relationType];
		const { article, preposition, name } = relationDefinition;
		const relationString = (
			<>
				{article} <strong>{name}</strong> {preposition}
			</>
		);

		return relationString;
	}

	renderCollectionContextMessage() {
		const { pubData } = this.props;
		const { justSetDoi } = this.state;
		if (justSetDoi) {
			return null;
		}
		const collection = getPrimaryCollection(pubData.collectionPubs);
		if (collection) {
			const schema = getSchemaForKind(collection.kind)!;
			return (
				<p>
					This Article will be cited as a member of the {schema.label.singular},{' '}
					<b>{collection.title}</b>. You can change this by updating the{' '}
					<em>Primary Issue</em> of the Article from the Issues tab.
				</p>
			);
		}
		return null;
	}

	renderStatusMessage() {
		const { pubData } = this.props;
		const { justSetDoi } = this.state;

		const isArk = pubData.doi?.startsWith('ark:');
		const hasCrossref = !!(this.props.communityData?.crossrefUsername && this.props.communityData?.crossrefPassword);

		if (justSetDoi) {
			return (
				<Callout intent="success" title="Success!">
					<p>{isArk ? 'Successfully assigned persistent identifier for this Article.' : 'Successfully submitted a DOI registration for this Pub.'}</p>
					<p>
						{isArk
							? 'Archival Resource Key is active and resolving globally via N2T.net.'
							: 'Registration may take a few hours to complete in Crossref&apos;s system. If DOI URLs do not work immediately, the registration is likely still processing.'}
					</p>
				</Callout>
			);
		}

		return (
			<>
				{!pubData.doi && <p>A persistent identifier can be set for each Article by admins of this Journal.</p>}
				{!isArk && !hasCrossref && this.disabledDueToUnmanagedPrefix() && (
					<Callout intent="warning">
						This Article cannot be deposited to Crossref via OpenScience.ph because there is no
						Crossref account connected to OpenScience.ph for this Journal.
					</Callout>
				)}
				{pubData.doi &&
					!isArk &&
					!pubData.crossrefDepositRecordId &&
					!this.disabledDueToNoReleases() &&
					!this.disabledDueToUnmanagedPrefix() && (
						<Callout intent="warning">
							A DOI has been assigned to this Article, but it has not yet been deposited
							to Crossref.
						</Callout>
					)}
				{pubData.crossrefDepositRecordId && <p>This Article has been deposited to Crossref.</p>}
				{isArk && (
					<Callout intent="success" title="Persistent Identifier Active">
						<p>This Article has an active persistent identifier.</p>
					</Callout>
				)}
				{this.isDoiEditableWithoutRelations() && this.findSupplementTo() && (
					<Callout intent="warning">
						The identifier for this Pub is not editable because it is a{' '}
						<strong>Supplement</strong> to another Article.
					</Callout>
				)}
			</>
		);
	}

	renderValidationWarnings() {
		const { validationIssues } = this.state;
		const { pubData } = this.props;

		if (!validationIssues || validationIssues.length === 0) {
			return null;
		}

		return (
			<>
				{validationIssues.map((issue: RelationshipIssue) => {
					if (issue.type === 'internal_not_deposited') {
						const pubUrl = issue.targetCommunitySubdomain
							? `https://${issue.targetCommunitySubdomain}.pubpub.org/dash/pub/${issue.targetPubSlug}/settings`
							: `/dash/pub/${issue.targetPubSlug}/settings`;
						return (
							<Callout key={issue.edgeId} intent="danger">
								<strong>
									<a href={pubUrl} target="_blank" rel="noopener noreferrer">
										{issue.targetTitle}
									</a>
								</strong>{' '}
								has DOI {issue.targetDoi} assigned but it does not exist in
								Crossref. Deposit{' '}
								<a href={pubUrl} target="_blank" rel="noopener noreferrer">
									{issue.targetTitle}
								</a>{' '}
								first, or disconnect it and deposit this Pub first.
								<WhyAmISeeingThis>{issue.message}</WhyAmISeeingThis>
							</Callout>
						);
					}

					if (issue.type === 'external_doi_not_crossref_registrar') {
						return (
							<Callout key={issue.edgeId} intent="danger">
								{issue.message}
								<WhyAmISeeingThis>
									Peer reviews deposited to Crossref must link to Crossref DOIs.
									Mark the Connection as something other than
									&quot;isReviewOf&quot; to deposit this Pub.
								</WhyAmISeeingThis>
							</Callout>
						);
					}

					if (issue.type === 'external_doi_not_in_crossref') {
						return (
							<Callout key={issue.edgeId} intent="danger">
								{issue.message} Please verify the DOI is correct, or manually add a
								DOI to the connection in the{' '}
								<a href={`/dash/pub/${pubData.slug}/connections`}>
									Connections tab
								</a>
								.
							</Callout>
						);
					}

					if (issue.type === 'external_url_no_doi_found') {
						return (
							<Callout key={issue.edgeId} intent="danger">
								{issue.message} Go to the{' '}
								<a href={`/dash/pub/${pubData.slug}/connections`}>
									Connections tab
								</a>{' '}
								to add a DOI.
							</Callout>
						);
					}

					return null;
				})}
			</>
		);
	}

	hasBlockingValidationIssues() {
		const { validationIssues } = this.state;
		// all issue types are now blocking
		return validationIssues?.length > 0;
	}

	renderCrossrefDeposit() {
		const { pubData } = this.props;
		const { justSetDoi } = this.state;
		const hasCrossref = !!(this.props.communityData?.crossrefUsername && this.props.communityData?.crossrefPassword);

		return (
			<FormGroup
				helperText={
					pubData.doi &&
					!justSetDoi && (
						<>
							If you&apos;ve changed aspects of this pub and wish to update its DOI
							deposit, you can do so here. In the future, PubPub will resubmit such
							changes automatically.{' '}
							{this.isDoiEditable() && (
								<>
									{' '}
									OpenScience.ph will automatically assign a DOI if the suffix is left
									blank. Please note that{' '}
									<strong>
										once submitted, the DOI will no longer be editable.
									</strong>
								</>
							)}
						</>
					)
				}
			>
				{hasCrossref && this.disabledDueToParentWithoutDoi() && (
					<Callout intent="warning">
						This Article cannot be deposited to Crossref because it is{' '}
						{this.renderParentEdgeRelation()} its parent Article, and its parent Article does
						not have a DOI.
					</Callout>
				)}
				{hasCrossref && this.disabledDueToNoReleases() && (
					<Callout intent="warning">
						This Article cannot be deposited to Crossref because it has no published
						releases.
					</Callout>
				)}
				{this.renderValidationWarnings()}
				<AssignDoi
					communityData={this.props.communityData}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(doi: any) => void' is not assignable to typ... Remove this comment to see the full error message
					onDeposit={this.handleDeposit}
					pubData={this.props.pubData}
					target="pub"
					disabled={
						this.props.depositDisabled ||
						(hasCrossref && (
							this.disabledDueToParentWithoutDoi() ||
							this.disabledDueToNoReleases() ||
							this.disabledDueToUnmanagedPrefix() ||
							this.hasBlockingValidationIssues()
						))
					}
				/>
				{!hasCrossref && !pubData.doi && (
					<div style={{ marginTop: '16px', borderTop: '1px solid #e1e4e8', paddingTop: '12px' }}>
						<Button
							minimal={true}
							small={true}
							icon={this.state.isLinkingExternal ? 'chevron-down' : 'chevron-right'}
							onClick={() => this.setState({ isLinkingExternal: !this.state.isLinkingExternal })}
							text="Link an existing identifier (DOI, Handle, ARK, or repository URL)"
						/>
						<Collapse isOpen={this.state.isLinkingExternal}>
							<div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
								<FormGroup
									label="Existing Identifier"
									helperText="If this article was previously published elsewhere, enter its existing persistent identifier or permanent repository URL."
								>
									<InputGroup
										placeholder="e.g. 10.xxxx/..., hdl:..., ark:/..., or URL"
										value={this.state.customIdentifier}
										onChange={(e) => this.setState({ customIdentifier: e.target.value })}
										style={{ marginBottom: '8px' }}
									/>
									<Button
										intent="success"
										text="Save Existing Identifier"
										disabled={!this.state.customIdentifier.trim()}
										loading={this.state.updating}
										onClick={() => {
										const raw = this.state.customIdentifier.trim();
										const clean = raw.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
										this.updateDoi(clean, 'updating', '');
									}}
									/>
								</FormGroup>
							</div>
						</Collapse>
					</div>
				)}
			</FormGroup>
		);
	}

	renderContent() {
		const { canIssueDoi } = this.props;

		if (!canIssueDoi) {
			return (
				<>
					{this.renderStatusMessage()}
					{this.renderDoi()}
				</>
			);
		}

		return (
			<>
				{this.renderStatusMessage()}
				{this.renderCollectionContextMessage()}
				{this.renderDoi()}
				{this.renderCrossrefDeposit()}
			</>
		);
	}

	renderDoi() {
		const { pubData } = this.props;
		const { doiSuffix, updating, generating, deleting } = this.state;
		const fullDoi = this.getFullDoi();
		const isArk = fullDoi.startsWith('ark:');
		const invalidDoi = doiSuffix && !isArk && !isDoi(fullDoi);
		const intent = this.getIntent(invalidDoi);
		const helperText = isArk
			? 'Persistent identifier updated successfully.'
			: this.getHelperText(invalidDoi);

		if (this.isDoiEditable()) {
			return (
				<FormGroup
					helperText={helperText}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type '"success"... Remove this comment to see the full error message
					intent={intent}
					className="doi"
					label="Identifier Suffix"
				>
					<InputGroup
						placeholder="Enter identifier suffix..."
						value={doiSuffix}
						onChange={(e) => this.setState({ doiSuffix: e.target.value })}
						leftElement={<span className="doi-prefix">{this.getDoiPrefix()}/</span>}
						style={{ zIndex: 0 }}
					/>
					<Button
						disabled={!doiSuffix || invalidDoi || deleting || generating}
						text="Update Suffix"
						loading={updating}
						onClick={this.handleUpdateDoiClick}
						intent="success"
					/>
					<Button
						disabled={invalidDoi || deleting || updating}
						text="Generate Suffix"
						loading={generating}
						onClick={this.handleGenerateDoiClick}
					/>
					<Button
						disabled={!pubData.doi || invalidDoi || updating || generating}
						text="Delete"
						loading={deleting}
						onClick={this.handleDeleteDoiClick}
						intent="danger"
					/>
				</FormGroup>
			);
		}

		return (
			<>
				{pubData.doi && (
					<div style={{ margin: '16px 0', padding: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px' }}>
						<p style={{ margin: '0 0 6px 0' }}>
							<strong>{pubData.doi.startsWith('ark:') ? 'Article ARK:' : (pubData.doi.startsWith('10.') ? 'Article DOI:' : 'Article Identifier:')}</strong>{' '}
							<code>{pubData.doi}</code>
						</p>
					<p style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
							<strong>Permanent Link:</strong>{' '}
							<a
								className="doi-link"
								target="_blank"
								rel="noopener noreferrer"
								href={pubData.doi.startsWith('ark:') ? `https://n2t.net/${pubData.doi}` : (pubData.doi.startsWith('http') ? pubData.doi : `https://doi.org/${pubData.doi}`)}
							>
								{pubData.doi.startsWith('ark:') ? `https://n2t.net/${pubData.doi}` : (pubData.doi.startsWith('http') ? pubData.doi : `https://doi.org/${pubData.doi}`)}
							</a>
						</p>
						<Button
							minimal={true}
							small={true}
							intent="danger"
							text="Remove Identifier"
							loading={this.state.deleting}
							onClick={() => this.handleDeleteDoiClick()}
						/>
					</div>
				)}
			</>
		);
	}

	render() {
		return <div className="pub-settings-container_doi-component">{this.renderContent()}</div>;
	}
}
export default Doi;
