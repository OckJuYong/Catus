package com.catus.backend.service;

import com.catus.backend.exception.ErrorCode;
import com.catus.backend.exception.InvalidFileException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service for AWS S3 file upload operations.
 * Handles image validation, resizing, and upload to S3.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int PROFILE_IMAGE_SIZE = 300; // 300x300px

    /**
     * Upload profile image to S3
     * @param file Image file to upload
     * @param userId User ID for path construction
     * @return S3 object URL
     */
    public String uploadProfileImage(MultipartFile file, Long userId) {
        log.info("Uploading profile image for user {}", userId);

        // Validate file
        validateImageFile(file);

        try {
            // Resize image to 300x300px
            byte[] resizedImageBytes = resizeImage(file.getBytes(), PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE);

            // Generate unique file name
            String fileName = generateFileName(userId, file.getOriginalFilename());
            String key = "profiles/" + userId + "/" + fileName;

            // Upload to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(resizedImageBytes));

            String imageUrl = String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
            log.info("Profile image uploaded successfully: {}", imageUrl);

            return imageUrl;

        } catch (S3Exception e) {
            log.error("S3 upload failed: {}", e.getMessage(), e);
            throw new InvalidFileException(ErrorCode.S3_UPLOAD_ERROR,
                    "Failed to upload image to S3: " + e.getMessage());
        } catch (IOException e) {
            log.error("Image processing failed: {}", e.getMessage(), e);
            throw new InvalidFileException(ErrorCode.INVALID_IMAGE_FORMAT,
                    "Failed to process image: " + e.getMessage());
        }
    }

    /**
     * Validate image file type and size
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw InvalidFileException.invalidFormat("File is empty");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw InvalidFileException.tooLarge(file.getSize(), MAX_FILE_SIZE);
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw InvalidFileException.invalidType(file.getOriginalFilename());
        }

        log.debug("File validation passed - Type: {}, Size: {} bytes", contentType, file.getSize());
    }

    /**
     * Resize image to specified dimensions
     */
    private byte[] resizeImage(byte[] originalImageBytes, int targetWidth, int targetHeight) throws IOException {
        ByteArrayInputStream inputStream = new ByteArrayInputStream(originalImageBytes);
        BufferedImage originalImage = ImageIO.read(inputStream);

        if (originalImage == null) {
            throw new IOException("Failed to read image data");
        }

        // Create resized image
        BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = resizedImage.createGraphics();

        // Set rendering hints for better quality
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        graphics.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
        graphics.dispose();

        // Convert to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(resizedImage, "jpg", outputStream);

        log.debug("Image resized from {}x{} to {}x{}", originalImage.getWidth(), originalImage.getHeight(),
                targetWidth, targetHeight);

        return outputStream.toByteArray();
    }

    /**
     * Upload image from URL to S3 (used for DALL-E generated images)
     * @param imageUrl The URL of the image to download
     * @param userId User ID for path construction
     * @param prefix Subdirectory prefix (e.g., "diaries", "profiles")
     * @return S3 object URL
     */
    public String uploadFromUrl(String imageUrl, Long userId, String prefix) {
        log.info("Uploading image from URL for user {} to prefix {}", userId, prefix);

        try {
            // Download image from URL
            byte[] imageBytes = downloadImageFromUrl(imageUrl);

            // Generate unique file name
            String fileName = generateFileName(userId, "dalle_image.png");
            String key = prefix + "/" + userId + "/" + fileName;

            // Upload to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType("image/png")
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(imageBytes));

            String s3Url = String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
            log.info("Image uploaded successfully from URL to S3: {}", s3Url);

            return s3Url;

        } catch (S3Exception e) {
            log.error("S3 upload failed: {}", e.getMessage(), e);
            throw new InvalidFileException(ErrorCode.S3_UPLOAD_ERROR,
                    "Failed to upload image to S3: " + e.getMessage());
        } catch (IOException e) {
            log.error("Image download failed: {}", e.getMessage(), e);
            throw new InvalidFileException(ErrorCode.EXTERNAL_API_ERROR,
                    "Failed to download image from URL: " + e.getMessage());
        }
    }

    /**
     * Download image from URL
     */
    private byte[] downloadImageFromUrl(String imageUrl) throws IOException {
        log.debug("Downloading image from URL with 90s timeout: {}", imageUrl);

        try {
            java.net.URL url = new java.net.URL(imageUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(30000); // 30 seconds - connection timeout
            connection.setReadTimeout(90000);    // 90 seconds - read timeout for large image downloads
            connection.connect();

            if (connection.getResponseCode() != 200) {
                throw new IOException("Failed to download image: HTTP " + connection.getResponseCode());
            }

            try (java.io.InputStream inputStream = connection.getInputStream();
                 java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream()) {

                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }

                byte[] imageBytes = outputStream.toByteArray();
                log.debug("Downloaded {} bytes from URL", imageBytes.length);

                return imageBytes;
            }

        } catch (java.net.MalformedURLException e) {
            throw new IOException("Invalid image URL: " + imageUrl, e);
        }
    }

    /**
     * Generate unique file name with timestamp and UUID
     */
    private String generateFileName(Long userId, String originalFileName) {
        String extension = originalFileName != null && originalFileName.contains(".")
                ? originalFileName.substring(originalFileName.lastIndexOf("."))
                : ".jpg";

        return System.currentTimeMillis() + "_" + UUID.randomUUID().toString() + extension;
    }
}
