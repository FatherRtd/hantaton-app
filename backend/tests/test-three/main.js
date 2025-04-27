const express = require('express');

const app = express();

app.get('/api/big-govno', async (req, res) => {
    try {
        res.json({ result: JSON.stringify(Array.from({ length: 400 }, () => Math.random())) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});