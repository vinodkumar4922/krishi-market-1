/**
 * Helper to manage user-scoped recently viewed products
 */

const getStorageKey = (userId) => `km_recent_${userId || 'guest'}`;

export const recentlyViewedManager = {
  get: (userId) => {
    try {
      const raw = localStorage.getItem(getStorageKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add: (userId, product) => {
    if (!product || !product._id) return;
    try {
      const key = getStorageKey(userId);
      const existing = recentlyViewedManager.get(userId);

      // Filter out if already in list
      const filtered = existing.filter((p) => p._id !== product._id);

      // Add minimal product snapshot to front of list
      const item = {
        _id: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.images?.[0] || '',
        category: product.category?.name || '',
        district: product.location?.district || '',
        isOrganic: product.isOrganic,
        rating: product.rating?.average || 5.0,
      };

      const updated = [item, ...filtered].slice(0, 8); // Max 8 items
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save recently viewed product:', e);
    }
  },

  clear: (userId) => {
    try {
      localStorage.removeItem(getStorageKey(userId));
    } catch (e) {
      console.warn('Could not clear recently viewed:', e);
    }
  },
};
