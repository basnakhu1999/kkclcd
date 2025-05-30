const API_KEY = 'AIzaSyAeBhec1Z1fw2g0MOgCP28f8TII9j0zct8';
const FOLDER_ID = '1LJQ29KTc6nWm72y9WlX-yMbPFp2F2ClJ';
const IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
const VIDEO_MIMETYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const IMAGE_DURATION = 30000; // 30 seconds
const CHECK_INTERVAL = 3600000; // 1 hour

let files = [];
let currentIndex = 0;
let slideTimeout;

function loadGoogleDriveAPI() {
    console.log('Loading Google Drive API...');
    if (typeof gapi !== 'undefined') {
        gapi.load('client', initClient);
    } else {
        console.error('gapi is not defined. Ensure api.js is loaded correctly.');
        document.getElementById('media-container').innerHTML = '<p>Error loading Google API. Please check console.</p>';
    }
}

function initClient() {
    console.log('Initializing Google API Client...');
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    }).then(() => {
        console.log('Google API Client initialized successfully');
        fetchFiles();
        setInterval(fetchFiles, CHECK_INTERVAL);
    }).catch(error => {
        console.error('Error initializing Google API Client:', error);
        document.getElementById('media-container').innerHTML = '<p>Error initializing application. Please check console.</p>';
    });
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
            document.getElementById('media-container').innerHTML = '<p>No media found in the specified folder.</p>';
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

function getFileUrl(fileId) {
    return `/api/proxy?id=${fileId}`;
}

async function showNextSlide() {
    clearTimeout(slideTimeout);

    const imageElement = document.getElementById('slide-image');
    const videoElement = document.getElementById('slide-video');

    imageElement.style.display = 'none';
    videoElement.style.display = 'none';
    videoElement.pause();
    videoElement.src = '';

    if (files.length === 0) {
        console.warn('No files to display.');
        return;
    }

    const file = files[currentIndex];
    console.log('Attempting to display file:', file.name, 'MIME Type:', file.mimeType, 'ID:', file.id);

    const fileUrl = getFileUrl(file.id);

    if (IMAGE_MIMETYPES.includes(file.mimeType)) {
        imageElement.src = fileUrl;
        imageElement.style.display = 'block';
        imageElement.onerror = () => {
            console.error('Error loading image:', file.name, 'URL:', fileUrl);
            document.getElementById('media-container').innerHTML = `<p>Error loading ${file.name}. Skipping...</p>`;
            setTimeout(showNextSlide, 2000); // Show error briefly, then skip
        };
        slideTimeout = setTimeout(showNextSlide, IMAGE_DURATION);
    } else if (VIDEO_MIMETYPES.includes(file.mimeType)) {
        videoElement.src = fileUrl;
        videoElement.style.display = 'block';
        videoElement.onended = showNextSlide;
        videoElement.onerror = () => {
            console.error('Error loading video:', file.name, 'URL:', fileUrl);
            document.getElementById('media-container').innerHTML = `<p>Error loading ${file.name}. Skipping...</p>`;
            setTimeout(showNextSlide, 2000); // Show error briefly, then skip
        };
        videoElement.load();
        videoElement.play().catch(error => {
            console.error('Error playing video:', file.name, error);
            document.getElementById('media-container').innerHTML = `<p>Error playing ${file.name}. Skipping...</p>`;
            setTimeout(showNextSlide, 2000);
        });
    } else {
        console.warn(`Unsupported file type: ${file.mimeType} for file: ${file.name}`);
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
