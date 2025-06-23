package com.dialog.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MultipartConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // "/profile-images/**" URL 패턴으로 요청이 오면
        // 'file:///C:/dev/upload/profile_images/' (Windows) 또는 'file:/home/user/upload/profile_images/' (Linux/Mac) 경로에서 파일을 찾도록 설정
        registry.addResourceHandler("/profile-images/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }
}
