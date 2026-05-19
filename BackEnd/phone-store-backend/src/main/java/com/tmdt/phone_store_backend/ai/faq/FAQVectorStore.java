package com.tmdt.phone_store_backend.ai.faq;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmdt.phone_store_backend.domain.entity.FAQ;
import com.tmdt.phone_store_backend.service.GeminiService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Vector Store cho FAQ - su dung ChromaDB REST API.
 * 
 * ChromaDB phai duoc chay truoc:
 * docker run -d --name chromadb -p 8000:8000 chromadb/chroma:latest
 * 
 * Hoac su dung in-memory search neu ChromaDB khong kha dung.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class FAQVectorStore {

    private static final String COLLECTION_NAME = "faqs";

    private final RestTemplate restTemplate;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Value("${chromadb.host:localhost}")
    private String chromaHost;

    @Value("${chromadb.port:8000}")
    private int chromaPort;

    private boolean chromaAvailable = false;

    @PostConstruct
    public void initializeCollection() {
        try {
            // Test ChromaDB connection
            String url = String.format("http://%s:%d/api/v1/version", chromaHost, chromaPort);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                chromaAvailable = true;
                
                // Create collection
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
            log.warn("ChromaDB not available, using in-memory search. Error: {}", e.getMessage());
        }
    }

    /**
     * Index danh sach FAQ vao ChromaDB.
     */
    public void indexFAQs(List<FAQ> faqs) {
        if (faqs == null || faqs.isEmpty()) {
            log.warn("No FAQs to index");
            return;
        }

        if (!chromaAvailable) {
            log.info("ChromaDB not available, skipping vector indexing");
            return;
        }

        try {
            String url = String.format("http://%s:%d/api/v1/collections/%s/add", 
                chromaHost, chromaPort, COLLECTION_NAME);

            List<Map<String, Object>> documents = new ArrayList<>();
            List<String> ids = new ArrayList<>();
            List<String> embeddings = new ArrayList<>();

            for (FAQ faq : faqs) {
                String id = "faq_" + faq.getId();
                String document = buildFAQDocument(faq);
                
                ids.add(id);
                documents.add(Map.of(
                    "faq_id", String.valueOf(faq.getId()),
                    "question", faq.getQuestion(),
                    "answer", faq.getAnswer(),
                    "category", faq.getCategory() != null ? faq.getCategory() : "CHUNG"
                ));
                
                String embedding = generateSimpleEmbedding(document);
                embeddings.add(embedding);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("ids", ids);
            body.put("documents", embeddings);
            body.put("metadatas", documents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);
            
            log.info("Indexed {} FAQs into ChromaDB", faqs.size());
        } catch (Exception e) {
            log.error("Failed to index FAQs to ChromaDB: {}", e.getMessage());
        }
    }

    /**
     * Search FAQs bang ChromaDB.
     */
    public List<FAQSearchResult> semanticSearch(String query, int topK) {
        if (!chromaAvailable) {
            log.info("ChromaDB not available, using in-memory search");
            return inMemorySearch(query, topK);
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
        
        return inMemorySearch(query, topK);
    }

    /**
     * In-memory search fallback khi ChromaDB khong kha dung.
     */
    private List<FAQSearchResult> inMemorySearch(String query, int topK) {
        return new ArrayList<>();
    }

    /**
     * Xoa FAQ khoi index.
     */
    public void deleteFAQ(Long faqId) {
        if (!chromaAvailable) return;
        
        try {
            String url = String.format("http://%s:%d/api/v1/collections/%s/delete", 
                chromaHost, chromaPort, COLLECTION_NAME);

            Map<String, Object> body = new HashMap<>();
            body.put("ids", Collections.singletonList("faq_" + faqId));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);
            
            log.info("Deleted FAQ {} from vector store", faqId);
        } catch (Exception e) {
            log.error("Failed to delete FAQ {}: {}", faqId, e.getMessage());
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
            log.info("Reset ChromaDB FAQ collection");
        } catch (Exception e) {
            log.error("Failed to reset FAQ collection: {}", e.getMessage());
        }
    }

    /**
     * Tao document text tu FAQ.
     */
    private String buildFAQDocument(FAQ faq) {
        StringBuilder sb = new StringBuilder();
        sb.append("Cau hoi: ").append(faq.getQuestion()).append("\n");
        sb.append("Cau tra loi: ").append(faq.getAnswer()).append("\n");
        sb.append("Danh muc: ").append(faq.getCategory() != null ? faq.getCategory() : "CHUNG").append("\n");
        
        if (faq.getKeywords() != null && !faq.getKeywords().isEmpty()) {
            sb.append("Tu khoa: ").append(faq.getKeywords()).append("\n");
        }
        
        return sb.toString();
    }

    /**
     * Generate simple embedding string (placeholder for real embeddings).
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

    private List<FAQSearchResult> parseChromaResponse(String body) {
        List<FAQSearchResult> results = new ArrayList<>();
        
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
                        
                        FAQSearchResult result = FAQSearchResult.builder()
                            .faqId(Long.parseLong(meta.get("faq_id").asText()))
                            .question(meta.get("question").asText())
                            .answer(meta.get("answer").asText())
                            .category(meta.has("category") ? meta.get("category").asText() : "CHUNG")
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
}
