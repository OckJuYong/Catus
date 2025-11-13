package com.catus.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Firebase configuration for Firebase Cloud Messaging (FCM)
 * Initializes Firebase Admin SDK with graceful degradation if credentials are not available
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Autowired
    private ApplicationContext applicationContext;

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    /**
     * Initialize FirebaseApp with service account credentials
     * If credentials are not available, logs warning and allows app to start without FCM
     */
    @Bean
    public FirebaseApp firebaseApp() {
        if (!firebaseEnabled) {
            log.info("Firebase is disabled via configuration");
            return null;
        }

        if (serviceAccountPath == null || serviceAccountPath.isEmpty()) {
            log.warn("Firebase service account path not configured. FCM notifications will be disabled.");
            log.warn("Set 'firebase.service-account-path' property to enable FCM notifications.");
            return null;
        }

        Path credentialsPath = Paths.get(serviceAccountPath);
        if (!Files.exists(credentialsPath)) {
            log.warn("Firebase service account file not found at: {}", serviceAccountPath);
            log.warn("FCM notifications will be disabled. Application will continue without push notifications.");
            return null;
        }

        try (FileInputStream serviceAccount = new FileInputStream(credentialsPath.toFile())) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp app = FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
                return app;
            } else {
                log.info("Firebase Admin SDK already initialized");
                return FirebaseApp.getInstance();
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
            log.warn("FCM notifications will be disabled. Application will continue without push notifications.");
            return null;
        }
    }

    /**
     * Create FirebaseMessaging bean for sending push notifications
     * Only created if FirebaseApp bean exists
     */
    @Bean
    public FirebaseMessaging firebaseMessaging() {
        // Try to get FirebaseApp from context
        try {
            FirebaseApp firebaseApp = applicationContext.getBean(FirebaseApp.class);
            if (firebaseApp == null) {
                log.info("FirebaseMessaging bean not created - Firebase not initialized");
                return null;
            }

            FirebaseMessaging messaging = FirebaseMessaging.getInstance(firebaseApp);
            log.info("FirebaseMessaging instance created successfully");
            return messaging;
        } catch (Exception e) {
            log.warn("FirebaseMessaging bean not created - FirebaseApp not available: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Check if Firebase is properly initialized and available
     */
    public boolean isFirebaseAvailable() {
        return FirebaseApp.getApps() != null && !FirebaseApp.getApps().isEmpty();
    }
}
