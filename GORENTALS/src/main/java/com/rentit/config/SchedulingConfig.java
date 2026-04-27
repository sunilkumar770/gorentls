package com.rentit.config;

import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Activates Spring @Scheduled + ShedLock only when
 * gorentals.scheduling.enabled=true (default: true in prod,
 * disabled in test via application-test.yml).
 *
 * This prevents PayoutEngine jobs from firing during integration tests
 * and causing interference with test assertions.
 */
@Configuration
@ConditionalOnProperty(
    name         = "gorentals.scheduling.enabled",
    havingValue  = "true",
    matchIfMissing = true
)
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT14M")
public class SchedulingConfig {}
