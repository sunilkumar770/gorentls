package com.rentit.security;

import com.rentit.config.UserDetailsServiceImpl;
import com.rentit.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
// Spring Boot 3.3.6 = jakarta.servlet
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String COOKIE_NAME = "gorentals_token";

    @Autowired private JwtUtil                   jwtUtil;
    @Autowired private UserDetailsServiceImpl    userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         chain)
            throws ServletException, IOException {

        // Skip JWT for WebSocket upgrade — auth handled by AuthChannelInterceptor
        if (request.getRequestURI().startsWith("/ws/")) {
            chain.doFilter(request, response);
            return;
        }

        String username = null;
        String jwt = null;

        // 1. Try Authorization: Bearer <token> header first
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        }

        // 2. Fallback: read from HttpOnly cookie (used by SSR / direct browser requests)
        if (jwt == null) {
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (COOKIE_NAME.equals(cookie.getName())) {
                        jwt = cookie.getValue();
                        break;
                    }
                }
            }
        }

        // 3. Extract username from whichever token source we found
        if (jwt != null) {
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (ExpiredJwtException e) {
                log.warn("[JWT] Expired: {}", request.getRequestURI());
            } catch (MalformedJwtException e) {
                log.warn("[JWT] Malformed: {}", request.getRequestURI());
            } catch (Exception e) {
                log.warn("[JWT] Error: {} - {}", request.getRequestURI(), e.getMessage());
            }
        }

        // 4. Authenticate if we have a valid username
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails ud = userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateToken(jwt, username)) {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        chain.doFilter(request, response);
    }
}
