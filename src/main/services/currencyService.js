const https = require('https');

const currencyService = {
  async getOfficialRate() {
    return new Promise((resolve, reject) => {
      const url = 'https://ve.dolarapi.com/v1/dolares/oficial';

      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (parsedData && parsedData.promedio) {
              resolve(parsedData.promedio);
            } else {
              reject(new Error('Invalid API response structure'));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }
};

module.exports = currencyService;
