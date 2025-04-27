const express = require('express');
const axios = require("axios");

const app = express();

// Маршрут для получения статистики
app.get('/api/to/two', async (req, res) => {
    try {
        setInterval(async () => {
            const response = await axios.get('http://test-two:3102/api/big-govno');
        }, 1000);

        const response = await axios.get('http://192.168.194.192:3105/api/big-govno');
        res.json({ result: response.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});