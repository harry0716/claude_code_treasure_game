const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`後端伺服器啟動於 http://localhost:${PORT}`);
});
