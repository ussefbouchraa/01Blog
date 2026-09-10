package com._Blog.app.post.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com._Blog.app.exception.BlogExceptions.BadRequestException;
import com._Blog.app.exception.BlogExceptions.InternalServerException;
import com._Blog.app.post.entity.Post;

@Service
public class PostFileService {

    private static final Path UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();
    private static final Set<String> IMAGES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> VIDEOS = Set.of("video/mp4", "video/webm");

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
            extension = type.equals("image/png") ? ".png"
                    : type.equals("image/gif") ? ".gif"
                    : type.equals("image/webp") ? ".webp" : ".jpg";
        } else if (VIDEOS.contains(type)) {
            kind = "video";
            extension = type.equals("video/webm") ? ".webm" : ".mp4";
        } else {
            throw new BadRequestException("Only jpeg, png, gif, webp, mp4, and webm files are allowed.");
        }

        String filename = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(UPLOAD_DIR);
            Files.copy(file.getInputStream(), UPLOAD_DIR.resolve(filename));
        } catch (IOException exception) {
            throw new InternalServerException("Could not store the uploaded file.");
        }

        delete(post.getMediaUrl());
        post.setMediaUrl("/uploads/" + filename);
        post.setMediaType(kind);
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
}
