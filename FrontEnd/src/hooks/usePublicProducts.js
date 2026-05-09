import { useEffect, useState } from 'react';
import ProductService from '../services/productService';

export const usePublicProducts = (params = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const serializedParams = JSON.stringify(params);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await ProductService.getProducts(params);
        if (isMounted) {
          setProducts(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setProducts([]);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [serializedParams]);

  return { products, loading, error };
};
