package com.rentit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.task.DelegatingSecurityContextAsyncTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configures @Async to propagate the Spring Security context into background
 * threads so audit log writes can read the authenticated admin's identity.
 *
 * Without this, Spring's default async executor spawns a new thread that has
 * no SecurityContext, so SecurityContextHolder.getContext().getAuthentication()
 * returns null and every audit row ends up with adminUserId = null.
 *
 * DelegatingSecurityContextAsyncTaskExecutor copies the SecurityContext from
 * the calling thread into the async thread before execution begins.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("audit-");
        executor.initialize();
        // Wraps the executor so SecurityContextHolder is propagated to async threads
        return new DelegatingSecurityContextAsyncTaskExecutor(executor);
    }
}
