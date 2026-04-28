package com.rentit.security;

import com.rentit.config.UserDetailsServiceImpl;
import com.rentit.util.JwtUtil;
import com.rentit.util.LogUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class AuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuthChannelInterceptor.class);

    @Autowired private JwtUtil                jwtUtil;
    @Autowired private UserDetailsServiceImpl userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String header = accessor.getFirstNativeHeader("Authorization");
            log.info("[WS-AUTH] CONNECT — token present: {}", header != null);

            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                try {
                    String email = jwtUtil.extractUsername(token);
                    if (email == null) throw new IllegalArgumentException("null email in token");

                    if (jwtUtil.validateToken(token, email)) {
                        UserDetails ud = userDetailsService.loadUserByUsername(email);
                        // Sets principal.getName() = email in ChatWebSocketController
                        accessor.setUser(new UsernamePasswordAuthenticationToken(
                            ud, null, ud.getAuthorities()));
                        log.info("[WS-AUTH] ✓ Authenticated: {}", LogUtils.maskEmail(email));
                    } else {
                        log.warn("[WS-AUTH] ✗ Token invalid for: {}", LogUtils.maskEmail(email));
                        throw new IllegalArgumentException("WS token validation failed");
                    }
                } catch (IllegalArgumentException e) {
                    throw e;
                } catch (Exception e) {
                    log.error("[WS-AUTH] ✗ Error: {}", e.getMessage());
                    throw new IllegalArgumentException("WS auth error: " + e.getMessage());
                }
            } else {
                log.warn("[WS-AUTH] ✗ No Bearer token — rejecting CONNECT");
                throw new IllegalArgumentException("WebSocket requires Authorization header");
            }
        }
        return message;
    }
}
