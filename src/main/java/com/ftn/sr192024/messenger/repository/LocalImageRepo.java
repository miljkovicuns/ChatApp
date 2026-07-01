package com.ftn.sr192024.messenger.repository;

import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Repository
public class LocalImageRepo {
    public byte[] getImage(UUID userId) {
        Path dirPath = Paths.get("img");
        Path path = dirPath.resolve(userId.toString());
        if (Files.exists(path)) {
            try {
                return Files.readAllBytes(path);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        return null;
    }

    public void saveImage(byte[] fileBytes, UUID userId) {
        if (fileBytes != null) {
            Path dirPath = Paths.get("img");
            Path filePath = dirPath.resolve(userId.toString());
            try {
                if (!Files.exists(dirPath)) {
                    Files.createDirectory(dirPath);
                }
                Files.write(filePath,fileBytes);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
