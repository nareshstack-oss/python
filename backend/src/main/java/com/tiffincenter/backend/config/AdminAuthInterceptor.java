package com.tiffincenter.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Value("${app.admin.token}")
    private String adminToken;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/admin") || path.equals("/api/admin/login")) {
            return true;
        }

        String providedToken = request.getHeader("X-Admin-Token");
        if (adminToken.equals(providedToken)) {
            return true;
        }

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Unauthorized\"}");
        return false;
    }
}
