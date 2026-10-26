# ==============================================================================
# OpenScience.ph Sovereign Dataverse Unified Container
# Target: ghcr.io/pinoyseoul/dataverse:latest
# Base: gdcc/dataverse:latest
# ==============================================================================
FROM gdcc/dataverse:latest

USER root

# Bake in verified OpenScience Facelets templates, header, and robots.txt
COPY docroot/contact.xhtml /opt/payara/deployments/dataverse/contact.xhtml
COPY docroot/dataset.xhtml /opt/payara/deployments/dataverse/dataset.xhtml
COPY docroot/loginpage.xhtml /opt/payara/deployments/dataverse/loginpage.xhtml
COPY docroot/editFilesFragment.xhtml /opt/payara/deployments/dataverse/editFilesFragment.xhtml
COPY docroot/search-include-fragment.xhtml /opt/payara/deployments/dataverse/search-include-fragment.xhtml
COPY docroot/dataverse_header.xhtml /opt/payara/deployments/dataverse/dataverse_header.xhtml
COPY docroot/404static.xhtml /opt/payara/deployments/dataverse/404static.xhtml
COPY docroot/robots.txt /opt/payara/deployments/dataverse/robots.txt

# Bake in authentic OpenScience.ph favicons and PWA manifest
COPY resources/images/fav/* /opt/payara/deployments/dataverse/resources/images/fav/
COPY resources/images/fav/favicon.ico /opt/payara/deployments/dataverse/favicon.ico

# Bake in standardized Solr search facets
COPY langBundles/staticSearchFields.properties /opt/payara/deployments/dataverse/WEB-INF/classes/propertyFiles/staticSearchFields.properties

# Create permanent docroot symlinks for logos, root favicon.ico, and academic sitemap
RUN ln -sf /dv/docroot/logos /opt/payara/appserver/glassfish/domains/domain1/docroot/logos && \
    ln -sf /dv/docroot/logos/favicon.ico /opt/payara/appserver/glassfish/domains/domain1/docroot/favicon.ico && \
    ln -sf /dv/docroot/sitemap /opt/payara/appserver/glassfish/domains/domain1/docroot/sitemap

# Ensure proper Payara ownership across webapp deployment
RUN chown -R payara:payara /opt/payara/deployments/dataverse/

USER payara
