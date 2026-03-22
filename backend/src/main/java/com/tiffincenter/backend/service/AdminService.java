package com.tiffincenter.backend.service;

import com.tiffincenter.backend.api.dto.AdminLoginRequest;
import com.tiffincenter.backend.api.dto.AdminLoginResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.token}")
    private String adminToken;

    public AdminLoginResponse login(AdminLoginRequest request) {
        if (adminUsername.equals(request.username()) && adminPassword.equals(request.password())) {
            return new AdminLoginResponse(adminToken, "Login successful");
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin credentials");
    }
}
