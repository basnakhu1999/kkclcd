const fetch = require('node-fetch');

export default async function handler(req, res) {
    const fileId = req.query.id;
    const apiKey = 'AIzaSyAeBhec1Z1fw2g0MOgCP28f8TII9j0zct8';

    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        res.setHeader('Content-Type', response.headers.get('content-type'));
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
        response.body.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Error fetching file');
    }
}