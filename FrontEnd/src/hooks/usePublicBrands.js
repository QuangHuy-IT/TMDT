import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export const usePublicBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchBrands = async () => {
      setLoading(true);
      try {
        const response = await api.get('/brands');
        if (isMounted) {
          setBrands(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (isMounted) {
          setBrands([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  return { brands, loading };
};
