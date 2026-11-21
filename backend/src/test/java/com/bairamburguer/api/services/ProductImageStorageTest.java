package com.bairamburguer.api.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductImageStorageTest {
    @TempDir
    Path directory;

    @Test
    void storesLargePhotoWithShortUniqueFilenameAndPreservesExistingImages() throws Exception {
        Path oldImage = directory.resolve("foto-antiga.png");
        Files.writeString(oldImage, "imagem existente");
        ProductImageStorage storage = new ProductImageStorage(directory);
        byte[] content = new byte[2_414_077];
        MockMultipartFile image = new MockMultipartFile("image", "lanche".repeat(100) + ".png", "image/png", content);

        String first = storage.save(image);
        String second = storage.save(image);

        assertThat(first).matches("/uploads/[a-f0-9-]{36}\\.png");
        assertThat(first).isNotEqualTo(second);
        assertThat(Files.readAllBytes(directory.resolve(first.substring("/uploads/".length())))).isEqualTo(content);
        assertThat(Files.readString(oldImage)).isEqualTo("imagem existente");
    }

    @Test
    void rejectsFilesAboveFiveMegabytes() {
        MockMultipartFile image = new MockMultipartFile("image", "foto.png", "image/png", new byte[5 * 1024 * 1024 + 1]);
        assertThatThrownBy(() -> new ProductImageStorage(directory).save(image))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("413");
    }

    @Test
    void reportsStorageFailureInsteadOfPretendingTheImageWasSaved() throws Exception {
        Path notDirectory = directory.resolve("arquivo");
        Files.writeString(notDirectory, "ocupado");
        MockMultipartFile image = new MockMultipartFile("image", "foto.png", "image/png", new byte[]{1});
        assertThatThrownBy(() -> new ProductImageStorage(notDirectory).save(image))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("500");
    }
}
