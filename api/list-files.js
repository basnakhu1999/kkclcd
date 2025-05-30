const fetch = require('node-fetch');

export default async function handler(req, res) {
    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
    const FOLDER = 'media';

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/search`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    expression: `folder:${FOLDER}`,
                    max_results: 100,
                    resource_type: 'image,video'
                })
            }
        );

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('Cloudinary API error:', data.error || response.statusText);
            return res.status(response.status).json({ error: 'Failed to fetch files from Cloudinary' });
        }

        const files = data.resources.map(resource => ({
            public_id: resource.public_id,
            secure_url: resource.secure_url
        }));

        res.status(200).json({ files });
    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
}
