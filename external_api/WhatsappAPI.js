const axios = require('axios');

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function initialize(userId, whatsappNumber) {
  return instance.post('/auth/init', { userId, whatsappNumber });
}

function getStatus(userId) {
  return instance.get(`/auth/connection/${userId}`);
}

function getStatusByNumber(userId, whatsappNumber) {
  return instance.get(`/auth/connection/${userId}/${whatsappNumber}`);
}

function logout(userId, whatsappNumber) {
  return instance.post('/auth/logout', { userId, whatsappNumber });
}

module.exports = {
  initialize,
  getStatus,
  getStatusByNumber,
  logout,
};
