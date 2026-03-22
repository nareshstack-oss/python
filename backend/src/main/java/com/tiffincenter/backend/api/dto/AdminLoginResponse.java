package com.tiffincenter.backend.api.dto;

public record AdminLoginResponse(
    String token,
    String message
) {
}
