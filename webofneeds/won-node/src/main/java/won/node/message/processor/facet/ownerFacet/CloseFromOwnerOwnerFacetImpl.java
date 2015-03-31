package won.node.message.processor.facet.ownerFacet;

import org.apache.camel.Exchange;
import org.springframework.stereotype.Component;
import won.node.message.processor.AbstractFromOwnerCamelProcessor;
import won.node.message.processor.annotation.DefaultFacetMessageProcessor;
import won.node.message.processor.annotation.FacetMessageProcessor;
import won.protocol.vocabulary.WON;
import won.protocol.vocabulary.WONMSG;

/**
 * User: syim
 * Date: 05.03.2015
 */
@Component
@DefaultFacetMessageProcessor(direction=WONMSG.TYPE_FROM_OWNER_STRING,messageType = WONMSG.TYPE_CLOSE_STRING)
@FacetMessageProcessor(facetType = WON.OWNER_FACET_STRING,direction=WONMSG.TYPE_FROM_OWNER_STRING,messageType =
  WONMSG.TYPE_CLOSE_STRING)
public class CloseFromOwnerOwnerFacetImpl extends AbstractFromOwnerCamelProcessor
{
  @Override
  public void process(final Exchange exchange) {
    logger.debug("default facet implementation, not doing anything");
  }
}
