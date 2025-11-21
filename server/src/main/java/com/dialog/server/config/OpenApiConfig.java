package com.dialog.server.config;

import com.dialog.server.exception.ErrorCode;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Dialog Error Codes"));
    }

    @Bean
    public OpenApiCustomizer errorCodeCustomizer() {
        return openApi -> {
            Schema<?> errorCodeSchema = createErrorCodeSchema();
            openApi.setPaths(new Paths());
            openApi.setComponents(new Components());
            openApi.getComponents().addSchemas("ErrorCodes", errorCodeSchema);
        };
    }

    private Schema<?> createErrorCodeSchema() {
        Schema<?> schema = new ObjectSchema();
        schema.setDescription("Dialog API에서 사용하는 모든 에러 코드 목록");

        for (ErrorCode errorCode : ErrorCode.values()) {
            Schema<?> errorSchema = new ObjectSchema()
                    .addProperty("code", new StringSchema()._default(errorCode.code))
                    .addProperty("message", new StringSchema()._default(errorCode.message))
                    .addProperty("httpStatus", new IntegerSchema()._default(errorCode.status.value()))
                    .description(String.format("[%s] %s (%d %s)",
                            errorCode.code,
                            errorCode.message,
                            errorCode.status.value(),
                            errorCode.status.getReasonPhrase()));

            schema.addProperty(errorCode.name(), errorSchema);
        }
        return schema;
    }
}
