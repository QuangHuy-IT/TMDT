package com.tmdt.phone_store_backend.ai.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Vector Store cho Product - su dung ChromaDB REST API.
 * 
 * ChromaDB phai duoc chay truoc:
 * docker run -d --name chromadb -p 8000:8000 chromadb/chroma:latest
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProductVectorStore {

    private static final String COLLECTION_NAME = "products";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    @Value("${chromadb.host:localhost}")
    private String chromaHost;

    @Value("${chromadb.port:8000}")
    private int chromaPort;

    private boolean chromaAvailable = false;

    @PostConstruct
    public void initializeCollection() {
        try {
            String url = String.format("http://%s:%d/api/v1/version", chromaHost, chromaPort);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                chromaAvailable = true;
                
                String createUrl = String.format("http://%s:%d/api/v1/collections", chromaHost, chromaPort);
                
                Map<String, Object> body = new HashMap<>();
                body.put("name", COLLECTION_NAME);
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                
                try {
                    restTemplate.postForEntity(createUrl, request, String.class);
                    log.info("ChromaDB connected and collection '{}' created", COLLECTION_NAME);
                } catch (Exception e) {
                    log.info("ChromaDB collection '{}' ready", COLLECTION_NAME);
                }
            }
        } catch (Exception e) {
            chromaAvailable = false;
            log.warn("ChromaDB not available for ProductVectorStore. Error: {}", e.getMessage());
        }
    }

    /**
     * Index danh sach Product vao ChromaDB.
     */
    public void indexProducts(List<Product> products) {
        if (products == null || products.isEmpty()) {
            log.warn("No products to index");
            return;
        }

        if (!chromaAvailable) {
            log.info("ChromaDB not available, skipping product vector indexing");
            return;
        }

        try {
            String url = String.format("http://%s:%d/api/v1/collections/%s/add", 
                chromaHost, chromaPort, COLLECTION_NAME);

            List<String> ids = new ArrayList<>();
            List<String> documents = new ArrayList<>();
            List<Map<String, Object>> metadatas = new ArrayList<>();

            for (Product product : products) {
                String id = "product_" + product.getId();
                String document = buildProductDocument(product);
                
                ids.add(id);
                documents.add(generateSimpleEmbedding(document));
                
                // Get primary variant info for metadata
                List<ProductVariant> variants = variantRepository
                    .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(product.getId());
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("product_id", product.getId());
                metadata.put("name", product.getName());
                metadata.put("brand", product.getBrand() != null ? product.getBrand().getName() : "");
                metadata.put("category", product.getCategory() != null ? product.getCategory().getName() : "");
                metadata.put("slug", product.getSlug());
                metadata.put("short_description", product.getShortDescription() != null ? product.getShortDescription() : "");
                
                if (!variants.isEmpty()) {
                    ProductVariant pv = variants.get(0);
                    metadata.put("min_price", pv.getPrice());
                    metadata.put("ram", pv.getRamGb());
                    metadata.put("storage", pv.getStorageGb());
                }
                
                metadatas.add(metadata);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("ids", ids);
            body.put("documents", documents);
            body.put("metadatas", metadatas);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);
            
            log.info("Indexed {} products into ChromaDB", products.size());
        } catch (Exception e) {
            log.error("Failed to index products to ChromaDB: {}", e.getMessage());
        }
    }

    /**
     * Search products bang ChromaDB.
     */
    public List<ProductSearchResult> semanticSearch(String query, int topK) {
        if (!chromaAvailable) {
            log.info("ChromaDB not available, using database search");
            return Collections.emptyList();
        }

        try {
            String url = String.format("http://%s:%d/api/v1/collections/%s/query", 
                chromaHost, chromaPort, COLLECTION_NAME);

            String queryEmbedding = generateSimpleEmbedding(query);

            Map<String, Object> body = new HashMap<>();
            body.put("query_embeddings", Collections.singletonList(parseEmbeddingToList(queryEmbedding)));
            body.put("n_results", topK);
            body.put("include", Arrays.asList("documents", "metadatas", "distances"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return parseChromaResponse(response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to search ChromaDB: {}", e.getMessage());
        }
        
        return Collections.emptyList();
    }

    /**
     * Xoa product khoi index.
     */
    public void deleteProduct(Long productId) {
        if (!chromaAvailable) return;
        
        try {
            String url = String.format("http://%s:%d/api/v1/collections/%s/delete", 
                chromaHost, chromaPort, COLLECTION_NAME);

            Map<String, Object> body = new HashMap<>();
            body.put("ids", Collections.singletonList("product_" + productId));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);
            
            log.info("Deleted product {} from vector store", productId);
        } catch (Exception e) {
            log.error("Failed to delete product {}: {}", productId, e.getMessage());
        }
    }

    /**
     * Reset collection.
     */
    public void resetCollection() {
        if (!chromaAvailable) return;
        
        try {
            String url = String.format("http://%s:%d/api/v1/collections/%s", 
                chromaHost, chromaPort, COLLECTION_NAME);
            restTemplate.delete(url);
            log.info("Reset ChromaDB Product collection");
        } catch (Exception e) {
            log.error("Failed to reset Product collection: {}", e.getMessage());
        }
    }

    /**
     * Tao document text tu Product.
     */
    private String buildProductDocument(Product product) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ten san pham: ").append(product.getName()).append("\n");
        sb.append("Mo ta ngan: ").append(product.getShortDescription() != null ? product.getShortDescription() : "").append("\n");
        sb.append("Mo ta chi tiet: ").append(product.getDetailDescription() != null ? product.getDetailDescription() : "").append("\n");
        
        if (product.getBrand() != null) {
            sb.append("Hang: ").append(product.getBrand().getName()).append("\n");
        }
        if (product.getCategory() != null) {
            sb.append("Danh muc: ").append(product.getCategory().getName()).append("\n");
        }
        
        // Add variant info
        List<ProductVariant> variants = variantRepository
            .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(product.getId());
        
        for (ProductVariant variant : variants) {
            sb.append("RAM: ").append(variant.getRamGb()).append(" GB, ");
            sb.append("ROM: ").append(variant.getStorageGb()).append(" GB, ");
            sb.append("Mau: ").append(variant.getColor() != null ? variant.getColor() : "").append("\n");
        }
        
        return sb.toString();
    }

    /**
     * Generate simple embedding string.
     */
    private String generateSimpleEmbedding(String text) {
        int hash = text.hashCode();
        Random random = new Random(hash);
        
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < 128; i++) {
            if (i > 0) sb.append(",");
            sb.append(String.format("%.6f", random.nextGaussian() * 0.5));
        }
        sb.append("]");
        
        return sb.toString();
    }

    private List<Double> parseEmbeddingToList(String embedding) {
        try {
            String cleaned = embedding.substring(1, embedding.length() - 1);
            String[] parts = cleaned.split(",");
            List<Double> result = new ArrayList<>();
            for (String part : parts) {
                result.add(Double.parseDouble(part.trim()));
            }
            return result;
        } catch (Exception e) {
            return Collections.singletonList(0.0);
        }
    }

    private List<ProductSearchResult> parseChromaResponse(String body) {
        List<ProductSearchResult> results = new ArrayList<>();
        
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode ids = root.get("ids");
            JsonNode metadatas = root.get("metadatas");
            JsonNode distances = root.get("distances");
            
            if (ids != null && ids.isArray()) {
                for (int i = 0; i < ids.size(); i++) {
                    double distance = distances != null && distances.get(i) != null ? 
                        distances.get(i).asDouble() : 1.0;
                    
                    if (metadatas != null && metadatas.get(i) != null) {
                        JsonNode meta = metadatas.get(i);
                        
                        ProductSearchResult result = ProductSearchResult.builder()
                            .productId(meta.get("product_id").asLong())
                            .name(meta.get("name").asText())
                            .brand(meta.has("brand") ? meta.get("brand").asText() : "")
                            .category(meta.has("category") ? meta.get("category").asText() : "")
                            .slug(meta.get("slug").asText())
                            .similarity(1.0 - distance)
                            .build();
                        results.add(result);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse ChromaDB response: {}", e.getMessage());
        }
        
        return results;
    }

    /**
     * DTO cho ket qua tim kiem product.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProductSearchResult {
        private Long productId;
        private String name;
        private String brand;
        private String category;
        private String slug;
        private double similarity;
    }
}
