export const isSafeSlug = (value) => (
  typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
);

export const getSafeProductSlug = (...values) => {
  const slug = values.find(isSafeSlug);
  return slug || '';
};
