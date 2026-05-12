import { useEffect, useState } from 'react';
import BannerService from '../services/bannerService';

export const useHomeBanners = (position = 'home_hero') => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBanners = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await BannerService.getHomeBanners(position);
        if (isMounted) {
          setBanners(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setBanners([]);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBanners();

    return () => {
      isMounted = false;
    };
  }, [position]);

  return { banners, loading, error };
};
