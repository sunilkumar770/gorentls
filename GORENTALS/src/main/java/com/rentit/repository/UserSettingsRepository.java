package com.rentit.repository;

import com.rentit.model.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {
}
