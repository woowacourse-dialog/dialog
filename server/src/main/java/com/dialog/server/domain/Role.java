package com.dialog.server.domain;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public enum Role {
    TEMP_USER(List.of("ROLE_TEMP_USER")),
    USER(List.of("ROLE_USER")),
    ADMIN(List.of("ROLE_USER", "ROLE_ADMIN")),
    ;

    public final List<String> roles;

    Role(List<String> roles) {
        this.roles = roles;
    }

    public Collection<? extends GrantedAuthority> toAuthorities() {
        return this.roles.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    public static boolean isLoggedInFromAuthorities(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> "ROLE_USER".equals(role) || "ROLE_ADMIN".equals(role));
    }
}
