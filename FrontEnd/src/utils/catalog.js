export const priceToNumber = (value) => Number(value || 0);

export const getVariantColors = (product) => {
  // New model: variants = List<AdminProductVariantDto> (each product = 1 variant)
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return product.variants.map(v => v.color).filter(Boolean);
  }
  // Old model: variants.colors = array of color objects
  if (Array.isArray(product?.variants?.colors)) {
    return product.variants.colors.map(c => typeof c === 'string' ? c : c?.name || c?.color);
  }
  return [];
};
export const getVariantStorages = (product) => {
  // New model: variants = List<AdminProductVariantDto>
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return product.variants.map(v => v.storageLabel).filter(Boolean);
  }
  // Old model: variants.storages = array of strings
  if (Array.isArray(product?.variants?.storages)) {
    return product.variants.storages;
  }
  return [];
};
export const getVariantItems = (product) => {
  // Support both new model (variants = list) and old model (variantItems = list)
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return product.variants;
  }
  return Array.isArray(product?.variantItems) ? product.variantItems : [];
};

export const getProductThumbnail = (product) => {
  // Ưu tiên: thumbnailUrl > images[0] > image (legacy)
  if (product?.thumbnailUrl) return product.thumbnailUrl;
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images[0];
  }
  return product?.image || '';
};

export const getProductStock = (product) => priceToNumber(product?.stock);

export const deriveCatalogOptions = (products = []) => {
  const colors = new Set();
  const storages = new Set();
  const rams = new Set();

  products.forEach((product) => {
    getVariantColors(product).forEach((color) => {
      if (typeof color === 'string' && color.trim()) {
        colors.add(color.trim());
      } else if (color?.name) {
        colors.add(color.name.trim());
      }
    });

    getVariantStorages(product).forEach((storage) => {
      if (storage) {
        storages.add(String(storage).trim());
      }
    });

    getVariantItems(product).forEach((variant) => {
      if (variant?.ramGb) {
        rams.add(`${variant.ramGb}GB`);
      }
      if (variant?.storageLabel) {
        storages.add(String(variant.storageLabel).trim());
      } else if (variant?.storageGb) {
        storages.add(`${variant.storageGb}GB`);
      }
      if (variant?.color) {
        colors.add(String(variant.color).trim());
      }
    });

    const ramSpec = product?.specifications?.ram;
    if (typeof ramSpec === 'string' && ramSpec.trim()) {
      rams.add(ramSpec.trim());
    }
    const storageSpec = product?.specifications?.storage;
    if (typeof storageSpec === 'string' && storageSpec.trim()) {
      storages.add(storageSpec.trim());
    }
  });

  return {
    colors: Array.from(colors),
    storages: Array.from(storages),
    rams: Array.from(rams),
  };
};

const matchesTextOption = (sourceValue, selectedValues = []) => {
  if (!selectedValues || selectedValues.length === 0) {
    return true;
  }

  const normalizedSource = String(sourceValue || '').toLowerCase();
  return selectedValues.some((value) => normalizedSource.includes(String(value || '').toLowerCase()));
};

export const applyCatalogFilters = (products, filters = {}) => {
  return products.filter((product) => {
    const price = priceToNumber(product?.price);

    if (filters.priceRange && (price < filters.priceRange.min || price > filters.priceRange.max)) {
      return false;
    }

    if (filters.inStockOnly && getProductStock(product) <= 0) {
      return false;
    }

    if (filters.selectedSeries && filters.selectedSeries.length > 0) {
      const productSeriesSlug = product?.seriesSlug
        ? String(product.seriesSlug).toLowerCase()
        : (product?.seriesName ? String(product.seriesName).toLowerCase() : '');
      const match = filters.selectedSeries.some(
        (s) => productSeriesSlug === s.toLowerCase()
      );
      if (!match) return false;
    }

    const specs = product?.specifications || {};
    if (!matchesTextOption(specs.ram, filters.rams)) {
      const variantRams = getVariantItems(product).map((variant) => `${variant?.ramGb || ''}GB`);
      if (!variantRams.some((value) => matchesTextOption(value, filters.rams))) {
        return false;
      }
    }

    if (!matchesTextOption(specs.storage, filters.storages)) {
      const storageValues = [
        ...getVariantStorages(product),
        ...getVariantItems(product).map((variant) => variant?.storageLabel || (variant?.storageGb ? `${variant.storageGb}GB` : '')),
      ].filter(Boolean);
      if (!storageValues.some((value) => matchesTextOption(value, filters.storages))) {
        return false;
      }
    }

    if (filters.colors && filters.colors.length > 0) {
      const colorValues = [
        ...getVariantColors(product).map((color) => (typeof color === 'string' ? color : color?.name)),
        ...getVariantItems(product).map((variant) => variant?.color),
      ].filter(Boolean);
      if (!colorValues.some((value) => matchesTextOption(value, filters.colors))) {
        return false;
      }
    }

    return true;
  });
};
