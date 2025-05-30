const fetch = require('node-fetch');

export default async function handler(req, res) {
    const fileId = req.query.id;
    const apiKey = 'AIzaSyAeBhec1Z1fw2g0MOgCP28f8TII9j0zct8';

    if (!fileId) {
        console.error('No fileId provided in query');
        res.status(400).json({ error: 'Missing fileId parameter' });
        return;
    }

    try {
        console.log(`Fetching file with ID: ${fileId}`);
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`, {
            headers: {
                'Accept': 'image/*,video/*'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            res.status(response.status).json({ error: `Failed to fetch file: ${errorText}` });
            return;
        }

        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        response.body.pipe(res);
    } catch (error) {
        console.error(`Proxy error for fileId ${fileId}:`, error.message);
        res.status(500).json({ error: `Server error: ${error.message}` });
    }
}
