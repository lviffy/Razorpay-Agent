import { getAllStores, getProducts, deduplicateProducts } from "../services/merchant";
import type { Product, Store } from "@zapai/types";

export interface SearchFilters {
  query?: string;
  category?: string;
  maxPrice?: number; // in rupees
  minPrice?: number;
  inStockOnly?: boolean;
}

export interface StoreCatalogResult {
  store: Store;
  products: Product[];
}

/**
 * Parallel multi-merchant catalog discovery.
 * Queries all connected merchant stores simultaneously.
 */
export async function searchCatalogsParallel(
  filters: SearchFilters = {},
  storeIds?: string[]
): Promise<StoreCatalogResult[]> {
  const allStores = await getAllStores();
  const targetStores = storeIds && storeIds.length > 0
    ? allStores.filter((s) => storeIds.includes(s.id) || storeIds.includes(s.name.toLowerCase()))
    : allStores;

  // Execute catalog retrieval across all stores in parallel
  const storeResults = await Promise.all(
    targetStores.map(async (store) => {
      try {
        const rawProducts = await getProducts(store.id);
        let products = deduplicateProducts(rawProducts);

        // Apply filtering
        if (filters.query) {
          const q = filters.query.toLowerCase().trim();
          products = products.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q) ||
              (p.category && p.category.toLowerCase().includes(q)) ||
              (p.description && p.description.toLowerCase().includes(q))
          );
        }

        if (filters.category) {
          const cat = filters.category.toLowerCase();
          products = products.filter(
            (p) => p.category && p.category.toLowerCase().includes(cat)
          );
        }

        if (filters.maxPrice !== undefined) {
          products = products.filter(
            (p) => (p.listedPrice ?? p.price ?? 0) <= filters.maxPrice!
          );
        }

        if (filters.minPrice !== undefined) {
          products = products.filter(
            (p) => (p.listedPrice ?? p.price ?? 0) >= filters.minPrice!
          );
        }

        if (filters.inStockOnly !== false) {
          products = products.filter(
            (p) => (p.inventoryAvailable ?? p.inventory ?? 0) > 0
          );
        }

        return { store, products };
      } catch (err) {
        console.error(`Error fetching catalog for store ${store.id}:`, err);
        return { store, products: [] };
      }
    })
  );

  return storeResults.filter((res) => res.products.length > 0);
}
