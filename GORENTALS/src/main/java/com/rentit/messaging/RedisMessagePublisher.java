package com.rentit.messaging;

import com.rentit.config.RedisConfig;
import com.rentit.dto.messaging.MessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
public class RedisMessagePublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    public void publish(MessageResponse message) {
        redisTemplate.convertAndSend(RedisConfig.CHAT_CHANNEL, message);
    }
}
