<?php

namespace App\Services;

use App\Models\Product;

class ProductService
{
    private array $products = [];
    private int $nextId = 1;
    
    public function __construct()
    {
    }
    
    public function getAllProducts(): array
    {
        return array_values($this->products);
    }
    
    public function getProductById(int $id): ?Product
    {
        return $this->products[$id] ?? null;
    }
    
    public function createProduct(string $name, float $price, int $stock = 0): Product
    {
        $product = new Product($this->nextId++, $name, $price, $stock);
        $this->products[$product->getId()] = $product;
        return $product;
    }
    
    public function deleteProduct(int $id): bool
    {
        if (isset($this->products[$id])) {
            unset($this->products[$id]);
            return true;
        }
        return false;
    }
}
