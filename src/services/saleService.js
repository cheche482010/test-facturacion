import axios from 'axios';

const API_URL = '/api/sales';

const createSale = (saleData) => {
  return axios.post(API_URL, saleData);
};

export default {
  createSale,
};
