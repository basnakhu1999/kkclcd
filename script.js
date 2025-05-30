const CLIENT_ID = '827577128994-nkig4pae5h7dasg6jshkhd603t6h8qgm.apps.googleusercontent.com'; // <--- REPLACE THIS
const FOLDER_ID = '1LJQ29KTc6nWm72y9WlX-yMbPFp2F2ClJ';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly'; // Scope for read-only access

const IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']; // Added webp
const VIDEO_MIMETYPES = ['video/mp4', 'video/webm', 'video/ogg'];

const IMAGE_DURATION = 30000; // 30 seconds
const CHECK_INTERVAL = 3600000; // 1 hour

let files = [];
let currentIndex = 0;
let slideTimeout;
let auth2; // GoogleAuth object

function loadGoogleDriveAPI() {
    console.log('Loading Google Drive API...');
    if (typeof gapi !== 'undefined') {
        gapi.load('client:auth2', initClient); // Load auth2 library as well
    } else {
        console.error('gapi is not defined. Ensure api.js is loaded correctly.');
    }
}

function initClient() {
    console.log('Initializing Google API Client and Auth...');
    gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    }).then(() => {
        console.log('Google API Client initialized successfully');
        auth2 = gapi.auth2.getAuthInstance(); // Get the GoogleAuth object
        auth2.isSignedIn.listen(updateSigninStatus); // Listen for sign-in status changes
        updateSigninStatus(auth2.isSignedIn.get()); // Set initial sign-in status
    }).catch(error => {
        console.error('Error initializing Google API Client:', error);
        document.getElementById('media-container').innerHTML = '<p>Error initializing application. Please check console.</p>';
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        console.log('User signed in, fetching files...');
        document.getElementById('media-container').innerHTML = ''; // Clear any sign-in message
        fetchFiles();
        setInterval(fetchFiles, CHECK_INTERVAL);
    } else {
        console.log('User not signed in. Showing sign-in prompt.');
        document.getElementById('media-container').innerHTML = `
            <p>Please sign in to view content from Google Drive.</p>
            <button id="authorize_button" onclick="handleAuthClick()">Sign In</button>
        `;
    }
}

function handleAuthClick() {
    if (auth2) {
        auth2.signIn();
    } else {
        console.error('GoogleAuth instance not available.');
    }
}

function fetchFiles() {
    console.log('Fetching files from Google Drive...');
    gapi.client.drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 100
    }).then(response => {
        const fetchedFiles = response.result.files;
        console.log('Files fetched:', fetchedFiles);

        files = fetchedFiles.filter(file => {
            return IMAGE_MIMETYPES.includes(file.mimeType) || VIDEO_MIMETYPES.includes(file.mimeType);
        });

        if (files.length === 0) {
            console.warn('No supported image or video files found in the folder.');
            document.getElementById('media-container').innerHTML = '<p>No media found.</p>';
            return;
        }

        if (currentIndex >= files.length) {
            currentIndex = 0;
        }
        showNextSlide();
    }).catch(error => {
        console.error('Error fetching files:', error);
        document.getElementById('media-container').innerHTML = '<p>Error loading media. Please try again later.</p>';
    });
}

/**
 * Fetches file content as a Blob and returns a URL.createObjectURL.
 * This is the recommended method for embedding content to avoid ORB issues.
 * REQUIRES OAuth 2.0 authentication.
 */
async function getFileContentAsBlobUrl(fileId, mimeType) {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media' // This is key to getting the file content
        }, {
            // Important: Set the response type to 'arraybuffer' for binary data
            // This is a client-side library option, not part of gapi.client.drive.files.get
            // You might need to adjust how gapi.client.request is used if 'alt: media'
            // doesn't directly give you a Blob/ArrayBuffer in the .then() block.
            // For gapi.client.drive.files.get, response.body is a string by default.
            // A more direct way to fetch binary data might be a raw `gapi.client.request`:
            // const response = await gapi.client.request({
            //     path: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            //     method: 'GET',
            //     headers: { 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token },
            //     responseType: 'arraybuffer' // Specify response type for binary data
            // });
        });

        // The response.body for gapi.client.drive.files.get({alt: 'media'})
        // typically comes as a base64 encoded string if not directly an ArrayBuffer
        // or a blob via a specific client config.
        // For direct binary fetching that results in ArrayBuffer:
        let arrayBuffer;
        if (response.body instanceof ArrayBuffer) {
            arrayBuffer = response.body;
        } else if (typeof response.body === 'string') {
            // Assuming response.body is base64 encoded for images/videos fetched this way
            // This is a common pattern when gapi.client.request is used without responseType: 'arraybuffer'
            // For simple gapi.client.drive.files.get with alt=media, it's often a raw string.
            // For binary data, you'd usually have to convert.
            // The safest approach is to use `fetch` with `responseType: 'arraybuffer'` or `blob()`
            // once you have the access token from gapi.auth2.
            console.warn('gapi.client.drive.files.get alt=media returned string. Attempting Blob conversion. For binary data, consider `fetch` with access token.');
            const decoder = new TextDecoder('utf-8'); // This is wrong for binary, just for example
            arrayBuffer = new TextEncoder().encode(response.body).buffer; // This won't correctly convert binary string
            // Correct approach for binary data with gapi and ArrayBuffer:
            // This usually involves using `gapi.client.request` directly.
        }

        // A more reliable way to get a Blob from a gapi.client.drive.files.get({alt: 'media'})
        // is often to directly use `fetch` after getting the access token.
        const accessToken = gapi.auth.getToken().access_token;
        const fetchResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const blob = await fetchResponse.blob();
        return URL.createObjectURL(blob);

    } catch (error) {
        console.error('Error fetching file content:', error);
        return null;
    }
}


async function showNextSlide() {
    clearTimeout(slideTimeout);

    const imageElement = document.getElementById('slide-image');
    const videoElement = document.getElementById('slide-video');

    imageElement.style.display = 'none';
    videoElement.style.display = 'none';
    videoElement.pause();
    videoElement.src = ''; // Clear video source

    if (files.length === 0) {
        console.warn('No files to display. Please ensure files are fetched and authorized.');
        return;
    }

    const file = files[currentIndex];
    console.log('Attempting to display file:', file.name, 'MIME Type:', file.mimeType, 'ID:', file.id);

    const blobUrl = await getFileContentAsBlobUrl(file.id, file.mimeType);

    if (!blobUrl) {
        console.error('Failed to get Blob URL for file:', file.name);
        currentIndex = (currentIndex + 1) % files.length;
        showNextSlide(); // Skip to the next slide
        return;
    }

    if (IMAGE_MIMETYPES.includes(file.mimeType)) {
        imageElement.src = blobUrl;
        imageElement.style.display = 'block';
        slideTimeout = setTimeout(() => {
            URL.revokeObjectURL(blobUrl); // Clean up the Blob URL
            showNextSlide();
        }, IMAGE_DURATION);
    } else if (VIDEO_MIMETYPES.includes(file.mimeType)) {
        videoElement.src = blobUrl;
        videoElement.style.display = 'block';
        videoElement.onended = () => {
            URL.revokeObjectURL(blobUrl); // Clean up the Blob URL
            showNextSlide();
        };
        videoElement.load();
        try {
            await videoElement.play();
        } catch (error) {
            console.error('Error playing video:', error);
            URL.revokeObjectURL(blobUrl); // Clean up even on play error
            slideTimeout = setTimeout(showNextSlide, 3000);
        }
    } else {
        console.warn(`Unsupported file type: ${file.mimeType} for file: ${file.name}`);
        URL.revokeObjectURL(blobUrl); // Clean up
        currentIndex = (currentIndex + 1) % files.length;
        showNextSlide();
        return;
    }

    currentIndex = (currentIndex + 1) % files.length;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, starting Google Drive API');
    loadGoogleDriveAPI();
});
