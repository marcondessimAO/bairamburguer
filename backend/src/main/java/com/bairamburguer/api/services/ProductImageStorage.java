package com.bairamburguer.api.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ProductImageStorage {
    private static final Logger log = LoggerFactory.getLogger(ProductImageStorage.class);
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp", "image/gif", ".gif");
    private final Path uploadPath;

    public ProductImageStorage() {
        this(Path.of("uploads"));
    }

    ProductImageStorage(Path uploadPath) {
        this.uploadPath = uploadPath;
    }

    public String save(MultipartFile image) {
        String contentType = image.getContentType();
        String extension = contentType == null ? null : EXTENSIONS.get(contentType.toLowerCase(Locale.ROOT));
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de imagem invalido. Use JPG, PNG, WebP ou GIF.");
        }
        if (image.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "A imagem excede o limite de 5 MB.");
        }

        String filename = UUID.randomUUID() + extension;
        try (InputStream input = image.getInputStream()) {
            Files.createDirectories(uploadPath);
            Files.copy(input, uploadPath.resolve(filename));
        } catch (IOException exception) {
            log.error("Falha ao gravar imagem do produto na pasta de uploads", exception);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Nao foi possivel salvar a imagem no servidor. Verifique o armazenamento de uploads.", exception);
        }
        return "/uploads/" + filename;
    }
}
