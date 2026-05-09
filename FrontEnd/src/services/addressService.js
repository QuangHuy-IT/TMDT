import api from '../api/axiosInstance';

const AddressService = {
  getAddresses: () => {
    return api.get('/users/addresses');
  },

  createAddress: (data) => {
    return api.post('/users/addresses', data);
  },

  updateAddress: (id, data) => {
    return api.put(`/users/addresses/${id}`, data);
  },

  deleteAddress: (id) => {
    return api.delete(`/users/addresses/${id}`);
  },

  setDefaultAddress: (id) => {
    return api.put(`/users/addresses/${id}/default`);
  },
};

export default AddressService;
