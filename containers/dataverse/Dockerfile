# ==============================================================================
# OpenScience.ph Sovereign Dataverse Unified Container
# Target: ghcr.io/pinoyseoul/dataverse:latest
# Base: gdcc/dataverse:latest
# ==============================================================================
FROM gdcc/dataverse:latest

USER root

# Bake in verified OpenScience Facelets templates and robots.txt
COPY docroot/contact.xhtml /opt/payara/deployments/dataverse/contact.xhtml
COPY docroot/dataset.xhtml /opt/payara/deployments/dataverse/dataset.xhtml
COPY docroot/loginpage.xhtml /opt/payara/deployments/dataverse/loginpage.xhtml
COPY docroot/editFilesFragment.xhtml /opt/payara/deployments/dataverse/editFilesFragment.xhtml
COPY docroot/search-include-fragment.xhtml /opt/payara/deployments/dataverse/search-include-fragment.xhtml
COPY docroot/404static.xhtml /opt/payara/deployments/dataverse/404static.xhtml
COPY docroot/robots.txt /opt/payara/deployments/dataverse/robots.txt

# Ensure proper Payara ownership across webapp deployment
RUN chown -R payara:payara /opt/payara/deployments/dataverse/

USER payara
