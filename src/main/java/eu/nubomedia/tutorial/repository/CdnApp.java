/*
 * (C) Copyright 2016 NUBOMEDIA (http://www.nubomedia.eu)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
