/**
 * The inner bits 'n' pieces of the form that lets you edit structured collection metadata, i.e. to
 * create a collection that represents a structured collection of content like a journal issue or
 * book.
 */

import type { Collection } from 'types';

import * as React from 'react';

import {
	Button,
	ButtonGroup,
	Callout,
	FormGroup,
	InputGroup,
	NonIdealState,
	Tag,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import ConfirmDialog from 'components/ConfirmDialog/ConfirmDialog';
import { enumerateMetadataFields, normalizeMetadataToKind } from 'utils/collections/metadata';
import { getSchemaForKind } from 'utils/collections/schemas';

import './collectionMetadataEditor.scss';

type Props = {
	allowUpdateDoi?: boolean;
	collection: Collection;
	communityData: any;
	onUpdateCollection: (update: Partial<Collection>) => unknown;
};

const validateField = ({ type, value }) => !value || !type || type.validate(value);

type State = any;

class CollectionMetadataEditor extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		const initialMetadata = this.normalizeMetadata(props.collection.metadata || {});
		this.state = {
			metadata: initialMetadata,
			isGettingDoi: false,
			deposited: false,
			saved: false,
			isSettingExternalDoi: false,
			externalDoiValue: '',
		};
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleGetDoiClick = this.handleGetDoiClick.bind(this);
	}

	allFieldsValidate(metadata) {
		const {
			collection: { kind },
		} = this.props;
		const fields = enumerateMetadataFields(metadata, kind);
		return fields.reduce((value, nextField) => value && validateField(nextField), true);
	}

	normalizeMetadata(metadata) {
		const { collection, communityData } = this.props;
		return normalizeMetadataToKind(metadata, collection.kind, {
			community: communityData,
			collection,
		});
	}

	deriveInputValue(derive) {
		const { communityData: community, collection } = this.props;
		return derive({ community, collection });
	}

	handleGetDoiClick() {
		const { communityData, collection, onUpdateCollection } = this.props;
		this.setState({ isGettingDoi: true, deposited: false, saved: false });
		return apiFetch('/api/doi', {
			method: 'POST',
			body: JSON.stringify({
				target: 'collection',
				collectionId: collection.id,
				communityId: communityData.id,
			}),
		})
			.then(({ dois }) => {
				onUpdateCollection({ doi: dois.collection });
				this.setState({ isGettingDoi: false, deposited: true });
			})
			.catch(() => {
				this.setState({ isGettingDoi: false });
			});
	}

	handleAssignArk = async () => {
		const { collection, communityData, onUpdateCollection } = this.props;
		const sub = communityData?.subdomain ? `${communityData.subdomain}-` : '';
		const ark = `ark:/14373/c1${sub}${collection.slug}`;
		this.setState({ isGettingDoi: true, deposited: false, saved: false });
		try {
			await onUpdateCollection({ doi: ark });
			this.setState({ isGettingDoi: false, saved: true });
		} catch (e) {
			this.setState({ isGettingDoi: false });
		}
	};

	handleRemoveArk = async () => {
		const { onUpdateCollection } = this.props;
		this.setState({ isGettingDoi: true, deposited: false, saved: false });
		try {
			await onUpdateCollection({ doi: null });
			this.setState({ isGettingDoi: false, saved: true, externalDoiValue: '' });
		} catch (e) {
			this.setState({ isGettingDoi: false });
		}
	};

	handleSetExternalDoi = async () => {
		const { onUpdateCollection } = this.props;
		const { externalDoiValue } = this.state;
		if (!externalDoiValue || !externalDoiValue.trim()) return;
		this.setState({ isGettingDoi: true, deposited: false, saved: false });
		try {
			await onUpdateCollection({ doi: externalDoiValue.trim() });
			this.setState({ isGettingDoi: false, saved: true, isSettingExternalDoi: false });
		} catch (e) {
			this.setState({ isGettingDoi: false });
		}
	};

	handleInputChange(field, value, pattern) {
		const { onUpdateCollection } = this.props;
		const { metadata } = this.state;
		if (pattern && !new RegExp(pattern).test(value)) {
			return;
		}
		const nextMetadata = this.normalizeMetadata({
			...metadata,
			[field]: value,
		});
		this.setState({
			metadata: nextMetadata,
		});
		if (this.allFieldsValidate(nextMetadata)) {
			onUpdateCollection({ metadata: nextMetadata });
		}
	}

	componentDidUpdate() {}

	renderGetDoiButton() {
		const { collection, communityData } = this.props;
		const { isGettingDoi, isSettingExternalDoi, externalDoiValue } = this.state;
		const isArkMode = !communityData.crossrefUsername && !communityData.crossrefPassword;

		if (isArkMode) {
			if (collection.doi) {
				const isArk = collection.doi.startsWith('ark:');
				const resolverUrl = isArk
					? `https://n2t.net/${collection.doi}`
					: `https://doi.org/${collection.doi}`;
				return (
					<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<Tag intent={isArk ? 'primary' : 'success'} round large>
								{isArk ? 'ARK' : 'DOI'}
							</Tag>
							<a
								href={resolverUrl}
								target="_blank"
								rel="noopener noreferrer"
								style={{ fontWeight: 600, fontSize: '15px' }}
							>
								{collection.doi}
							</a>
							<Button
								icon="trash"
								intent="danger"
								minimal
								loading={isGettingDoi}
								disabled={isGettingDoi}
								onClick={this.handleRemoveArk}
								title="Remove Persistent Identifier"
							>
								Remove
							</Button>
						</div>
					</div>
				);
			}

			return (
				<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
					<ButtonGroup>
						<Button
							icon="barcode"
							intent="primary"
							loading={isGettingDoi}
							disabled={isGettingDoi}
							onClick={this.handleAssignArk}
						>
							Assign Persistent Identifier (ARK)
						</Button>
						<Button
							icon="link"
							minimal
							onClick={() =>
								this.setState({ isSettingExternalDoi: !isSettingExternalDoi })
							}
						>
							{isSettingExternalDoi ? 'Cancel' : 'Link External Identifier'}
						</Button>
					</ButtonGroup>

					{isSettingExternalDoi && (
						<div style={{ display: 'flex', gap: '8px', maxWidth: '450px' }}>
							<InputGroup
								placeholder="e.g. 10.xxxx/... or ark:/... or handle"
								value={externalDoiValue}
								onChange={(e: any) =>
									this.setState({ externalDoiValue: e.target.value })
								}
								fill
							/>
							<Button
								intent="success"
								loading={isGettingDoi}
								disabled={!externalDoiValue.trim() || isGettingDoi}
								onClick={this.handleSetExternalDoi}
							>
								Save
							</Button>
						</div>
					)}
				</div>
			);
		}

		return collection.doi ? (
			<Button
				icon="link"
				loading={isGettingDoi}
				disabled={isGettingDoi}
				onClick={this.handleGetDoiClick}
			>
				Re-deposit to Crossref
			</Button>
		) : (
			<ConfirmDialog
				onConfirm={this.handleGetDoiClick}
				confirmLabel="Assign DOI"
				intent="primary"
				text="This is the first time this collection has been deposited to Crossref. Once assigned, the DOI for this collection cannot be changed."
			>
				{({ open }) => (
					<Button
						icon="link"
						loading={isGettingDoi}
						disabled={isGettingDoi}
						onClick={open}
					>
						Deposit to Crossref
					</Button>
				)}
			</ConfirmDialog>
		);
	}

	renderFieldRightElement(field) {
		const { name, defaultDerivedFrom, value } = field;
		const derivedHintValue = defaultDerivedFrom && this.deriveInputValue(defaultDerivedFrom);
		return (
			derivedHintValue && (
				<Button
					minimal
					icon="lightbulb"
					disabled={value === derivedHintValue}
					// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
					onClick={() => this.handleInputChange(name, derivedHintValue)}
				>
					Use default
				</Button>
			)
		);
	}

	renderField(field) {
		const { name, label, derivedFrom, derivedLabelInfo, pattern, type, value } = field;
		const derivedValue = derivedFrom && this.deriveInputValue(derivedFrom);
		return (
			<FormGroup
				key={name}
				label={label}
				labelInfo={derivedValue ? derivedLabelInfo : type && type.labelInfo}
			>
				<InputGroup
					className="field"
					value={derivedValue || value || ''}
					onChange={(event) => this.handleInputChange(name, event.target.value, pattern)}
					intent={validateField(field) ? 'none' : 'danger'}
					rightElement={this.renderFieldRightElement(field)}
				/>
			</FormGroup>
		);
	}

	renderFields() {
		const { collection } = this.props;
		const { metadata } = this.state;
		const { kind } = collection;
		const fields = enumerateMetadataFields(metadata, kind);
		if (fields.length === 0) {
			return (
				<NonIdealState
					className="fields-empty-state"
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'false | E... Remove this comment to see the full error message
					icon={getSchemaForKind(kind).bpDisplayIcon || 'help'}
					title="This collection type has no metadata"
				/>
			);
		}
		return <div className="fields">{fields.map((field) => this.renderField(field))}</div>;
	}

	renderStatusMessage() {
		if (this.state.deposited) {
			return (
				<Callout intent="success" title="Success!">
					<p>Successfully submitted a DOI registration for this Collection.</p>
					<p>
						Registration may take a few hours to complete in Crossref&apos;s system. If
						DOI URLs do not work immediately, the registration is likely still
						processing.
					</p>
				</Callout>
			);
		}

		if (this.state.saved) {
			return (
				<Callout intent="success" title="Success!">
					<p>Successfully updated Collection persistent identifier & metadata.</p>
				</Callout>
			);
		}

		return null;
	}

	render() {
		return (
			<div className="dashboard-content_collection-metadata-editor">
				{this.renderFields()}
				{this.props.allowUpdateDoi !== false && (
					<ButtonGroup>{this.renderGetDoiButton()}</ButtonGroup>
				)}
				{this.renderStatusMessage()}
			</div>
		);
	}
}
export default CollectionMetadataEditor;
