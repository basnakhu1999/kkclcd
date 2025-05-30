const fetch = require('node-fetch');

export default async function handler(req, res) {
    const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN; // เก็บใน Vercel Environment Variables
    const DROPBOX_FOLDER_PATH = '/media'; // โฟลเดอร์ใน Dropbox

    try {
        const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: DROPBOX_FOLDER_PATH,
                recursive: false
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('Dropbox API error:', data.error || response.statusText);
            return res.status(response.status).json({ error: 'Failed to fetch files from Dropbox' });
        }

        // ดึง Shared Link สำหรับแต่ละไฟล์
        const files = await Promise.all(data.entries.map(async (entry) => {
            if (entry['.tag'] !== 'file') return null;
            try {
                const linkResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        path: entry.path_lower,
                        settings: { access: 'viewer', allow_download: true }
                    })
                });

                const linkData = await linkResponse.json();
                if (linkData.error) {
                    console.error(`Error getting shared link for ${entry.name}:`, linkData.error);
                    return null;
                }

                return {
                    name: entry.name,
                    url: linkData.url
                };
            } catch (error) {
                console.error(`Error processing file ${entry.name}:`, error);
                return null;
            }
        }));

        res.status(200).json({ files: files.filter(file => file !== null) });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
}