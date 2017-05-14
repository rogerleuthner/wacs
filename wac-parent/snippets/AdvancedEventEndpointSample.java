/*
 * ****************************************************************************
 *  * Source code Copyright 2017 by Roger B. Leuthner
 *  *
 *  * This program is distributed in the hope that it will be useful, but 
 *  * WITHOUT ANY WARRANTY; without even the implied warranty of 
 *  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General
 *  * Public License for more details.
 *  *
 *  * Commercial Distribution License
 *  * If you would like to distribute this source code (or portions thereof) 
 *  * under a license other than the "GNU General Public License, version 2", 
 *  * contact Roger B. Leuthner through GitHub.
 *  *
 *  * GNU Public License, version 2
 *  * All distribution of this source code must conform to the terms of the GNU 
 *  * Public License, version 2.
 *  ***************************************************************************
 */

package com.tf.wac.ws;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import javax.ejb.EJB;
import javax.websocket.OnClose;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;



/* EJB CODE companion to below
@Inject
Event<NewArticleEvent> newArticleEvent;

public void publishArticle(Article article) {
  ...
  newArticleEvent.fire(new ArticleEvent(article));
  ...
}
 */

class ArticleBean {

}

@ServerEndpoint("/myendpoint")
public class AdvancedEventEndpointSample {
  // EJB that fires an event when a new article appears
  @EJB
  ArticleBean articleBean;
  // a collection containing all the sessions
  private static final Set<Session> sessions =
          Collections.synchronizedSet(new HashSet<Session>());

  @OnOpen
  public void onOpen(final Session session) {
    // add the new session to the set
    ((Set<Session>) session).add(session);
// ...
  }

  @OnClose
  public void onClose(final Session session) {
    // remove the session from the set
    sessions.remove(session);
  }

//  public void broadcastArticle(@Observes @NewArticleEvent ArticleEvent articleEvent) {
//    synchronized(sessions) {
//      for (Session s : sessions) {
//        if (s.isOpen()) {
//          try {
//            // send the article summary to all the connected clients
//            s.getBasicRemote().sendText("New article up:" + articleEvent.getArticle().getSummary());
//          } catch (IOException ex) { }
//        }
//      }
//    }
//  }
}