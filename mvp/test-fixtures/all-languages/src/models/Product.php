<?php

namespace App\Models;

class Product
{
    private int $id;
    private string $name;
    private float $price;
    private int $stock;
    
    public function __construct(int $id, string $name, float $price, int $stock = 0)
    {
        $this->id = $id;
        $this->name = $name;
        $this->price = $price;
        $this->stock = $stock;
    }
    
    public function isAvailable(): bool
    {
        return $this->stock > 0;
    }
    
    public function updateStock(int $quantity): void
    {
        $this->stock += $quantity;
    }
    
    public function getId(): int
    {
        return $this->id;
    }
}
