import axios from 'axios';

const API_URL = '/api/products'; // Vite proxy will handle the redirection

const getProducts = () => {
  return axios.get(API_URL);
};

const createProduct = (product) => {
  return axios.post(API_URL, product);
};

const updateProduct = (id, product) => {
  return axios.put(`${API_URL}/${id}`, product);
};

const deleteProduct = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

export default {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
