package com.dialog.server.dto.security;

import com.dialog.server.domain.User;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

public record OAuth2UserPrincipal(User user, Map<String, Object> attributes) implements OAuth2User {
    @Override
    public Map<String, Object> getAttributes() {
        return Collections.unmodifiableMap(attributes);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return user.getRole().toAuthorities();
    }

    @Override
    public String getName() {
        return user.getOauthId();
    }
}
