const BASE_URL = 'https://provinces.open-api.vn/api/v2';

const ProvincesService = {
  /**
   * Lấy danh sách tất cả tỉnh/thành phố
   * @returns {Promise<Array<{code: string, name: string}>>}
   */
  getProvinces: async () => {
    const res = await fetch(`${BASE_URL}/p/`);
    const data = await res.json();
    return data.map(p => ({ code: String(p.code), name: p.name }));
  },

  /**
   * Lấy danh sách phường/xã theo mã tỉnh
   * @param {string|number} provinceCode
   * @returns {Promise<Array<string>>}
   */
  getWardsByProvinceCode: async (provinceCode) => {
    const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
    const data = await res.json();
    return (data.wards || []).map(w => w.name);
  },
};

export default ProvincesService;
