import { useEffect, useState } from 'react';
import brandService from '../services/brandService';

export const useBrandSeries = (brandSlug) => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandSlug) {
      setSeries([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSeries = async () => {
      setLoading(true);
      try {
        const data = await brandService.getBrandSeries(brandSlug);
        if (isMounted) {
          setSeries(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setSeries([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSeries();
    return () => {
      isMounted = false;
    };
  }, [brandSlug]);

  return { series, loading };
};
