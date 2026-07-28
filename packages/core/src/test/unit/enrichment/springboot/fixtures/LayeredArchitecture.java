package com.example;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.*;
import java.util.List;

/**
 * Complete Layered Architecture in One File (for testing)
 * Demonstrates the full Spring Boot request flow
 * 
 * FLOW:
 * GET /api/products/:id → 
 *   ProductController.getProduct() → 
 *   ProductService.findById() → 
 *   ProductRepository.findById() → 
 *   Product entity → 
 *   ProductDTO → 
 *   ResponseEntity<ProductDTO>
 * 
 * MUST detect:
 * - All layer stereotypes (@RestController, @Service, @Repository, @Entity)
 * - Dependency injection chain (Controller -> Service -> Repository)
 * - HTTP route mapping
 * - Method call relationships
 * - Entity management
 * - DTO transformation
 */

// ==================== CONTROLLER LAYER ====================

@RestController
@RequestMapping("/api/products")
class ProductController {
    
    private final ProductService productService;
    
    // MUST detect: Constructor injection
    public ProductController(ProductService productService) {
        this.productService = productService;
    }
    
    // MUST detect: GET /api/products/:id
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProduct(@PathVariable Long id) {
        // MUST detect: Calls productService.findById()
        ProductDTO product = productService.findById(id);
        return ResponseEntity.ok(product);
    }
    
    // MUST detect: POST /api/products
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ProductDTO> createProduct(@RequestBody ProductDTO dto) {
        // MUST detect: Calls productService.create()
        ProductDTO created = productService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

// ==================== SERVICE LAYER ====================

@Service
class ProductService {
    
    private final ProductRepository productRepository;
    
    // MUST detect: Constructor injection
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
    
    // MUST detect: @Transactional(readOnly = true)
    @Transactional(readOnly = true)
    public ProductDTO findById(Long id) {
        // MUST detect: Calls productRepository.findById()
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        // MUST detect: Entity -> DTO transformation
        return toDTO(product);
    }
    
    // MUST detect: @Transactional (write)
    @Transactional
    public ProductDTO create(ProductDTO dto) {
        // MUST detect: DTO -> Entity transformation
        Product product = toEntity(dto);
        // MUST detect: Calls productRepository.save()
        Product saved = productRepository.save(product);
        return toDTO(saved);
    }
    
    private ProductDTO toDTO(Product product) {
        return new ProductDTO(product.getId(), product.getName(), product.getPrice());
    }
    
    private Product toEntity(ProductDTO dto) {
        Product product = new Product();
        product.setName(dto.getName());
        product.setPrice(dto.getPrice());
        return product;
    }
}

// ==================== REPOSITORY LAYER ====================

@Repository
interface ProductRepository extends JpaRepository<Product, Long> {
    // MUST detect: extends JpaRepository<Product, Long>
    // MUST detect: Entity type = Product
    // MUST detect: ID type = Long
    // MUST detect: Custom query method
    List<Product> findByPriceLessThan(Double price);
}

// ==================== ENTITY LAYER ====================

@Entity
@Table(name = "products")
class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private Double price;
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}

// ==================== DTO ====================

class ProductDTO {
    private Long id;
    private String name;
    private Double price;
    
    public ProductDTO(Long id, String name, Double price) {
        this.id = id;
        this.name = name;
        this.price = price;
    }
    
    public Long getId() { return id; }
    public String getName() { return name; }
    public Double getPrice() { return price; }
}

// ==================== EXCEPTION ====================

class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found with id: " + id);
    }
}
