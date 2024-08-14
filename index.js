const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.get('/regco', async (req, res) => {
     const musicUrl = req.originalUrl.split('/regco?file=')[1];;

    if (!musicUrl) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const filePath = path.join(__dirname, 'temp.mp3');

    try {
        let response = await axios({
            url: musicUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(fs.createWriteStream(filePath));

        await new Promise((resolve, reject) => {
            response.data.on('end', resolve);
            response.data.on('error', reject);
        });

        const form = new FormData();
        form.append('api_token', 'e5f83a85a377becae7b6a2a5ae97f09c');
        form.append('file', fs.createReadStream(filePath));
        form.append('return', 'apple_music,spotify');

        const uploadResponse = await axios.post('https://api.audd.io/', form, {
            headers: {
                ...form.getHeaders(),
                'Content-Type': 'multipart/form-data'
            },
            responseType: 'json'
        });

        res.json(uploadResponse.data);
    } catch (error) {
        try {
            let response = await axios({
                url: musicUrl,
                method: 'GET',
                responseType: 'arraybuffer'
            });

            fs.writeFileSync(filePath, response.data);

            const form = new FormData();
            form.append('api_token', 'e5f83a85a377becae7b6a2a5ae97f09c');
            form.append('file', fs.createReadStream(filePath));
            form.append('return', 'apple_music,spotify');

            const uploadResponse = await axios.post('https://api.audd.io/', form, {
                headers: {
                    ...form.getHeaders(),
                    'Content-Type': 'multipart/form-data'
                },
                responseType: 'json'
            });

            res.json(uploadResponse.data);
        } catch (finalError) {
            res.status(500).json({ error: 'File processing failed', message: finalError.message });
        } finally {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Failed to delete temporary file:', err);
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
