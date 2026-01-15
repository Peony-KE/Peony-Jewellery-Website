import { Metadata } from 'next';
import ProductCard from '@/components/ui/ProductCard';
import CategoryFilter from '@/components/ui/CategoryFilter';
import { products } from '@/data/products';

export const metadata: Metadata = {
  title: 'Shop All | Peony HQ Kenya',
  description: 'Browse our complete collection of beautiful jewellery including earrings, necklaces, rings, and bracelets.',
};

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Shop All
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our complete collection of handpicked jewellery pieces. 
            From elegant earrings to stunning necklaces, find the perfect accessory for every occasion.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-10">
          <CategoryFilter activeCategory="all" />
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing <span className="text-foreground font-medium">{products.length}</span> products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
