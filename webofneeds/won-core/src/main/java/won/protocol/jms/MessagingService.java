package won.protocol.jms;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.Future;

/**
 * User: LEIH-NB
 * Date: 04.11.13
 */
public interface MessagingService<T> {
    public Future<URI> sendInOutMessage(Map properties, Map headers, Object body, String endpoint);
    public Future<String> sendInOutMessageForString(String methodName, Map headers, Object body, String endpoint);
    public void sendInOnlyMessage(Map properties, Map headers, Object body, String endpoint);
    public Future<T> sendInOutMessageGeneric(Map properties, Map headers, Object body, String endpoint);
}
