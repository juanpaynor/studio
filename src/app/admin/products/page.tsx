import { getProducts } from '@/lib/data';
import { ProductDataTable } from '@/components/admin/products/ProductDataTable';
import { productColumns } from '@/components/admin/products/ProductColumns';

export default function ProductsPage() {
  const products = getProducts();

  return (
    <div className="container mx-auto py-10">
      <h1 className="font-headline text-3xl font-bold mb-6">Product Management</h1>
      <ProductDataTable columns={productColumns} data={products} />
    </div>
  );
}
