/*
 * (C) Copyright 2016 NUBOMEDIA (http://www.nubomedia.eu)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */
package eu.nubomedia.tutorial.repository;

import java.io.IOException;

import org.kurento.repository.RepositoryClient;
import org.kurento.repository.RepositoryClientProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.google.api.client.auth.oauth2.Credential;
import com.google.common.collect.Lists;

import de.fhg.fokus.nubomedia.cdn.CdnManager;
import de.fhg.fokus.nubomedia.cdn.provider.youtube.Auth;

/**
 * WebRTC in loopback with recording in repository capabilities main class.
 *
 * @author Boni Garcia (boni.garcia@urjc.es)
 * @author Alice Cheambe (alice.cheambe@fokus.fraunhofe.de)
 * @since 6.4.1
 */
@SpringBootApplication
@EnableWebSocket
public class CdnApp implements WebSocketConfigurer {

  @Bean
  public CdnRepositoryHandler handler() {
    return new CdnRepositoryHandler();
  }

  @Bean
  public RepositoryClient repositoryServiceProvider() {
    return RepositoryClientProvider.create();
  }
  
  @Bean
  public CdnManager cdnClient() {
      return new CdnManager();
  }
  
  @Bean
  public Credential credential(){
  	try {
			return  Auth.authorize(Lists.newArrayList("https://www.googleapis.com/auth/youtube.upload"), "uploadvideo");
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(handler(), "/repository");
  }

  public static void main(String[] args) throws Exception {
    new SpringApplication(CdnApp.class).run(args);
  }
}
