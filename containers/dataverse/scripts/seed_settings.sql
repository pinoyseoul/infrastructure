-- ==============================================================================
-- OpenScience.ph Sovereign Dataverse Native Settings Seed
-- Target: PostgreSQL dataverse database
-- ==============================================================================

INSERT INTO setting (name, lang, content) VALUES
(':GuidesBaseUrl', '', 'https://journals.openscience.ph'),
(':NavbarAboutUrl', '', 'https://openscience.ph/about'),
(':NavbarGuidesUrl', '', 'https://journals.openscience.ph'),
(':NavbarSupportUrl', '', '/contact.xhtml'),
(':InheritParentTheme', '', 'true'),
(':SearchHighlighting', '', 'true'),
(':FileFixityChecksumAlgorithm', '', 'SHA-512')
ON CONFLICT (name, lang) DO UPDATE SET content = EXCLUDED.content;
