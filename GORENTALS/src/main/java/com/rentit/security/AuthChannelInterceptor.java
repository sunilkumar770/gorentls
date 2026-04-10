package com.rentit.security;

import com.rentit.config.UserDetailsServiceImpl;
import com.rentit.util.JwtUtil;
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

import java.util.List;

@Component
public class AuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuthChannelInterceptor.class);

    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserDetailsServiceImpl userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> headers = accessor.getNativeHeader("Authorization");
            if (headers == null || headers.isEmpty()) {
                throw new IllegalArgumentException("Missing Authorization header in STOMP CONNECT");
            }
            String header = headers.get(0);
            if (header == null || !header.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Authorization header must start with Bearer");
            }
            String jwt = header.substring(7);
            String username;
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                log.warn("WS CONNECT rejected: invalid JWT - {}", e.getMessage());
                throw new IllegalArgumentException("Invalid JWT token");
            }
            if (username == null || !jwtUtil.validateToken(jwt, username)) {
                throw new IllegalArgumentException("JWT validation failed");
            }
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accessor.setUser(auth);
            log.debug("WS CONNECT authenticated: {}", username);
        }
        return message;
    }
}
