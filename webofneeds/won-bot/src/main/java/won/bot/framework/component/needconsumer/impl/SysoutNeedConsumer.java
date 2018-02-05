/*
 * Copyright 2012  Research Studios Austria Forschungsges.m.b.H.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

package won.bot.framework.component.needconsumer.impl;

import org.apache.jena.query.Dataset;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import won.bot.framework.component.needconsumer.NeedConsumer;

/**
 * Prints needs to sysout.
 */
public class SysoutNeedConsumer implements NeedConsumer
{
  @Override
  public void consume(final Dataset need)
  {
    RDFDataMgr.write(System.out, need, Lang.TTL);
  }

  @Override
  public boolean isExhausted()
  {
    return true;
  }
}
