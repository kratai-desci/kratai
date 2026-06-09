<?php

namespace App\Controllers;

use App\Services\ProductService;
use App\Models\Product;

class ProductController
{
    private ProductService $productService;
    
    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }
    
    public function getAll(): array
    {
        $products = $this->productService->getAllProducts();
        return [
            'products' => $products,
            'count' => count($products)
        ];
    }
    
    public function getById(int $id): array
    {
        $product = $this->productService->getProductById($id);
        if ($product) {
            return ['product' => $product];
        }
        return ['error' => 'Product not found'];
    }
    
    public function create(string $name, float $price, int $stock = 0): array
    {
        $product = $this->productService->createProduct($name, $price, $stock);
        return ['product' => $product];
    }
    
    public function delete(int $id): array
    {
        $success = $this->productService->deleteProduct($id);
        return [
            'success' => $success,
            'message' => $success ? 'Product deleted' : 'Product not found'
        ];
    }
}
