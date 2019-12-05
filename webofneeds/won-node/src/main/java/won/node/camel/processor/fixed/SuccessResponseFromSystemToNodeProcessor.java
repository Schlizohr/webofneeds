/*
 * Copyright 2012 Research Studios Austria Forschungsges.m.b.H. Licensed under
 * the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable
 * law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
package won.node.camel.processor.fixed;

import org.apache.camel.Exchange;
import org.springframework.stereotype.Component;

import won.node.camel.processor.AbstractCamelProcessor;
import won.node.camel.processor.annotation.FixedMessageProcessor;
import won.protocol.vocabulary.WONMSG;

/**
 * Processes responses to generated by the system and directed at the remote
 * side.
 */
@Component
@FixedMessageProcessor(direction = WONMSG.FromSystemString, messageType = WONMSG.SuccessResponseString)
public class SuccessResponseFromSystemToNodeProcessor extends AbstractCamelProcessor {
    @Override
    public void process(Exchange exchange) throws Exception {
        // nothing to do
    }
}
