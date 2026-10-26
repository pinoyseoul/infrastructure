package ph.openscience.pidproviders.ark;

import edu.harvard.iq.dataverse.DvObject;
import edu.harvard.iq.dataverse.GlobalId;
import edu.harvard.iq.dataverse.pidproviders.AbstractPidProvider;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class ArkPidProvider extends AbstractPidProvider {
    public static final String PROTOCOL = "ark";
    public static final String TYPE = "ark";
    public static final String SEPARATOR = "/";

    private static final Logger logger = Logger.getLogger(ArkPidProvider.class.getCanonicalName());

    private String baseUrl;
    private String separator;

    public ArkPidProvider(String id, String label, String providerAuthority, String providerShoulder,
                          String identifierGenerationStyle, String datafilePidFormat,
                          String managedList, String excludedList, String baseUrl, String separator) {
        super(id, label, PROTOCOL, providerAuthority, providerShoulder, identifierGenerationStyle,
                datafilePidFormat, managedList, excludedList);
        this.baseUrl = (baseUrl != null && !baseUrl.isEmpty()) ? baseUrl : "https://n2t.net/ark:/";
        this.separator = (separator != null && !separator.isEmpty()) ? separator : SEPARATOR;
    }

    @Override
    public String getSeparator() {
        return this.separator;
    }

    @Override
    public String getUrlPrefix() {
        return this.baseUrl;
    }

    @Override
    public String getProtocol() {
        return PROTOCOL;
    }

    @Override
    public String getProviderType() {
        return TYPE;
    }

    @Override
    public boolean canManagePID() {
        return true;
    }

    @Override
    public boolean registerWhenPublished() {
        return false;
    }

    @Override
    public boolean alreadyRegistered(GlobalId globalId, boolean noProviderDefault) {
        if (this.pidProviderService != null) {
            boolean existsLocally = !this.pidProviderService.isGlobalIdLocallyUnique(globalId);
            return existsLocally ? existsLocally : noProviderDefault;
        }
        return noProviderDefault;
    }

    @Override
    public List<String> getProviderInformation() {
        return List.of(getId(), getUrlPrefix());
    }

    @Override
    public String createIdentifier(DvObject dvo) throws Throwable {
        GlobalId gid = dvo.getGlobalId();
        if (gid != null) {
            return gid.asString();
        }
        DvObject generated = generatePid(dvo);
        return generated.getIdentifier();
    }

    @Override
    public Map<String, String> getIdentifierMetadata(DvObject dvo) {
        return new HashMap<>();
    }

    @Override
    public String modifyIdentifierTargetURL(DvObject dvo) throws Exception {
        return getTargetUrl(dvo);
    }

    @Override
    public void deleteIdentifier(DvObject dvo) throws Exception {
        // no-op
    }

    @Override
    public boolean publicizeIdentifier(DvObject dvObject) {
        if (dvObject.getIdentifier() == null || dvObject.getIdentifier().isEmpty()) {
            dvObject = generatePid(dvObject);
        }
        return true;
    }

    @Override
    public GlobalId parsePersistentId(String fullIdentifierString) {
        if (fullIdentifierString == null) {
            return null;
        }
        fullIdentifierString = fullIdentifierString.replace("%3A", ":");
        if (fullIdentifierString.startsWith(getUrlPrefix())) {
            fullIdentifierString = PROTOCOL + ":" + fullIdentifierString.substring(getUrlPrefix().length());
        }
        if (fullIdentifierString.startsWith("ark:/")) {
            fullIdentifierString = "ark:" + fullIdentifierString.substring(5);
        }
        return super.parsePersistentId(fullIdentifierString);
    }
}
