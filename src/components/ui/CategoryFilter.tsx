'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { categories } from '@/data/products';

interface CategoryFilterProps {
  activeCategory?: Category | 'all';
}

export default function CategoryFilter({ activeCategory = 'all' }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <Link
        href="/shop"
        className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
          activeCategory === 'all'
            ? 'bg-primary text-background'
            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/shop/${category.id}`}
          className={`px-6 py-2 rounded-full font-medium transition-all duration-200 capitalize ${
            activeCategory === category.id
              ? 'bg-primary text-background'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
