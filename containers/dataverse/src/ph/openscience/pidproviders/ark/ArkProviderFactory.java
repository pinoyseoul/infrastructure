package ph.openscience.pidproviders.ark;

import edu.harvard.iq.dataverse.pidproviders.PidProvider;
import edu.harvard.iq.dataverse.pidproviders.PidProviderFactory;
import edu.harvard.iq.dataverse.settings.JvmSettings;
import edu.harvard.iq.dataverse.util.SystemConfig;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.logging.Level;

public class ArkProviderFactory implements PidProviderFactory {
    private static final Logger logger = Logger.getLogger(ArkProviderFactory.class.getCanonicalName());

    @Override
    public String getType() {
        return "ark";
    }

    @Override
    public PidProvider createPidProvider(String providerId) {
        try {
            String providerType = JvmSettings.PID_PROVIDER_TYPE.lookupOptional(providerId).orElse("ark");
            if (!providerType.equalsIgnoreCase(getType())) {
                return null;
            }
            String providerLabel = JvmSettings.PID_PROVIDER_LABEL.lookupOptional(providerId).orElse("ARK");
            String providerAuthority = JvmSettings.PID_PROVIDER_AUTHORITY.lookupOptional(providerId).orElse("14373");
            String providerShoulder = JvmSettings.PID_PROVIDER_SHOULDER.lookupOptional(providerId).orElse("");
            String identifierGenerationStyle = JvmSettings.PID_PROVIDER_IDENTIFIER_GENERATION_STYLE
                    .lookupOptional(providerId).orElse("randomString");
            String datafilePidFormat = JvmSettings.PID_PROVIDER_DATAFILE_PID_FORMAT.lookupOptional(providerId)
                    .orElse(SystemConfig.DataFilePIDFormat.DEPENDENT.toString());
            String managedList = JvmSettings.PID_PROVIDER_MANAGED_LIST.lookupOptional(providerId).orElse("");
            String excludedList = JvmSettings.PID_PROVIDER_EXCLUDED_LIST.lookupOptional(providerId).orElse("");

            String baseUrl = System.getProperty("dataverse.pid." + providerId + ".base-url", "https://n2t.net/ark:/");
            String separator = System.getProperty("dataverse.pid." + providerId + ".separator", "/");

            logger.info("Initializing ArkPidProvider: id=" + providerId + ", authority=" + providerAuthority
                    + ", shoulder=" + providerShoulder + ", baseUrl=" + baseUrl);

            return new ArkPidProvider(providerId, providerLabel, providerAuthority, providerShoulder,
                    identifierGenerationStyle, datafilePidFormat, managedList, excludedList, baseUrl, separator);
        } catch (Throwable t) {
            logger.log(Level.SEVERE, "Failed to create ArkPidProvider for " + providerId, t);
            return null;
        }
    }
}
