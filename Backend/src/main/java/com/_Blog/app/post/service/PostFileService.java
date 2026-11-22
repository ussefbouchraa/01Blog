package com._Blog.app.post.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import com._Blog.app.exception.BlogExceptions.BadRequestException;
import com._Blog.app.exception.BlogExceptions.InternalServerException;
import com._Blog.app.post.entity.Post;

@Service
public class PostFileService {

    private static final Path UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();
    private static final Set<String> IMAGES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> VIDEOS = Set.of("video/mp4", "video/webm");
    private static final long MAX_AVATAR_SIZE = 5L * 1024 * 1024;

    // Save the file under uploads/ (creates the folder if needed) and set mediaUrl on the post.
    public void attach(Post post, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }

        String type = file.getContentType();
        String kind;
        String extension;
        if (IMAGES.contains(type)) {
            kind = "image";
            extension = imageExtension(type);
        } else if (VIDEOS.contains(type)) {
            kind = "video";
            extension = type.equals("video/webm") ? ".webm" : ".mp4";
        } else {
            throw new BadRequestException("Only jpeg, png, gif, webp, mp4, and webm files are allowed.");
        }

        String previousMediaUrl = post.getMediaUrl();
        post.setMediaUrl(store(file, extension));
        post.setMediaType(kind);
        delete(previousMediaUrl);
    }

    // Store a new avatar and return its /uploads/... URL. The previous file is only
    // removed after the surrounding transaction commits, so a failed DB update keeps it.
    public String saveAvatar(MultipartFile file, String previousAvatarUrl) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("An avatar image is required.");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new BadRequestException("Avatar image must be 5 MB or smaller.");
        }
        String type = file.getContentType();
        if (!IMAGES.contains(type)) {
            throw new BadRequestException("Only jpeg, png, gif, and webp images are allowed for avatars.");
        }

        String avatarUrl = store(file, imageExtension(type));
        deleteAfterCommit(previousAvatarUrl);
        return avatarUrl;
    }

    private String imageExtension(String type) {
        return type.equals("image/png") ? ".png"
                : type.equals("image/gif") ? ".gif"
                : type.equals("image/webp") ? ".webp" : ".jpg";
    }

    // Single storage path shared by post media and avatars.
    private String store(MultipartFile file, String extension) {
        String filename = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(UPLOAD_DIR);
            Files.copy(file.getInputStream(), UPLOAD_DIR.resolve(filename));
        } catch (IOException exception) {
            throw new InternalServerException("Could not store the uploaded file.");
        }
        return "/uploads/" + filename;
    }

    public void delete(String mediaUrl) {
        if (mediaUrl == null || !mediaUrl.startsWith("/uploads/")) {
            return;
        }
        Path file = UPLOAD_DIR.resolve(mediaUrl.substring("/uploads/".length())).normalize();
        if (!file.startsWith(UPLOAD_DIR)) {
            return;
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            throw new InternalServerException("Could not delete the uploaded file.");
        }
    }

    // Delete the file, but only after I'm sure the database deletion succeeded.
    public void deleteAfterCommit(String mediaUrl) {
        if (mediaUrl == null) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            delete(mediaUrl);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    delete(mediaUrl);
                }
            }
        );
    }
}
