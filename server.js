const express = require('express');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const CRYPTO_SYMBOLS = process.env.CRYPTO_SYMBOLS.split(',');
const INTERVAL_MINUTES = process.env.INTERVAL_MINUTES || 5;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const fetchData = async () => {
  try {
    const symbols = CRYPTO_SYMBOLS.join(',');
    const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}`, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
      },
    });
    return Object.values(response.data.data);
  } catch (error) {
    console.error('Error fetching data from CoinMarketCap:', error.response ? error.response.data : error.message);
    return [];
  }
};

io.on('connection', async (socket) => {
  console.log('a user connected');

  // İlk bağlantıda veri çekme
  const initialData = await fetchData();
  socket.emit('cryptoData', initialData);

  const interval = setInterval(async () => {
    const data = await fetchData();
    socket.emit('cryptoData', data);
  }, INTERVAL_MINUTES * 60 * 1000); // Convert minutes to milliseconds

  socket.on('disconnect', () => {
    console.log('user disconnected');
    clearInterval(interval);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
