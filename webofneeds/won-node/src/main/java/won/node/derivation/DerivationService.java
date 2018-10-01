package won.node.derivation;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import org.apache.jena.query.Dataset;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import won.protocol.model.Connection;
import won.protocol.model.Need;
import won.protocol.repository.NeedRepository;

/**
 * Service that is informed of a state change of a connection and performs
 * data derivation work, changing the data of the need owning the connection. 
 * 
 */

@Component
public class DerivationService {
    
    Logger logger = LoggerFactory.getLogger(getClass());
    
    @Autowired
    NeedRepository needRepository;
    
    Map<URI, FacetDerivationConfig> hardcodedConfigs = new HashMap<>();
    
    public DerivationService() {
        addConfig(new DerivationConfigOfHoldableFacet());
        addConfig(new DerivationConfigOfHolderFacet());        
        addConfig(new DerivationConfigOfGroupFacet());
        addConfig(new DerivationConfigOfChatFacet());
    }
    
    private void addConfig(FacetDerivationConfig config) {
        this.hardcodedConfigs.put(config.getFacetType(), config);
    }
    
    
    public void deriveDataForStateChange(ConnectionStateChange stateChange, Need need, Connection con)  {
        if (stateChange.isConnect() || stateChange.isDisconnect()) {
            logger.info("performing data derivation for connection {}", con.getConnectionURI());
            Dataset needDataset = need.getDatatsetHolder().getDataset();
            Model derivationModel = needDataset.getNamedModel(need.getNeedURI() + "#derivedData");
            if (derivationModel == null) {
                derivationModel = ModelFactory.createDefaultModel();
                needDataset.addNamedModel(need.getNeedURI()+"#derivedData", derivationModel);
            }
            final Model modelToManipulate = derivationModel; 
            URI facetType = con.getTypeURI();
            if (hardcodedConfigs.containsKey(facetType)) {
                Resource needRes = derivationModel.getResource(need.getNeedURI().toString());
                Resource remoteNeedRes = derivationModel.getResource(con.getRemoteNeedURI().toString());
                FacetDerivationConfig config = hardcodedConfigs.get(facetType);
                if (stateChange.isConnect()) {
                    logger.info("adding data for connection {}" + con.getConnectionURI());        
                    config.getDerivationProperties().stream().forEach(p -> modelToManipulate.add(needRes, p, remoteNeedRes));
                } else {
                    logger.info("removing data for connection {}" + con.getConnectionURI());
                    config.getDerivationProperties().stream().forEach(p -> modelToManipulate.remove(needRes, p, remoteNeedRes));
                }
            }
            need.getDatatsetHolder().setDataset(needDataset);
            needRepository.save(need);
        }
    }
}
