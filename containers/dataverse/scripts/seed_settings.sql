-- ==============================================================================
-- OpenScience.ph Sovereign Dataverse Native Settings Seed
-- Target: PostgreSQL dataverse database
-- ==============================================================================

INSERT INTO setting (name, lang, content) VALUES
(':GuidesBaseUrl', '', 'https://journal.pinoyseoul.com'),
(':NavbarAboutUrl', '', 'https://obra.pinoyseoul.com'),
(':NavbarGuidesUrl', '', 'https://journal.pinoyseoul.com'),
(':NavbarSupportUrl', '', '/contact.xhtml'),
(':InheritParentTheme', '', 'true'),
(':SearchHighlighting', '', 'true'),
(':FileFixityChecksumAlgorithm', '', 'SHA-512')
ON CONFLICT (name, lang) DO UPDATE SET content = EXCLUDED.content;
