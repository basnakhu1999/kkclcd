const API_KEY = 'AIzaSyAeBhec1Z1fw2g0MOgCP28f8TII9j0zct8';
const FOLDER_ID = '1LJQ29KTc6nWm72y9WlX-yMbPFp2F2ClJ';
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const VIDEO_EXTENSIONS = ['mp4', 'webm'];
const IMAGE_DURATION = 30000;
const CHECK_INTERVAL = 3600000;

let files = [];
let currentIndex = 0;

function loadGoogleDriveAPI() {
    console.log('Loading Google Drive API...');
    gapi.load('client', initClient);
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
    });
}

function fetchFiles() {
    console.log('Fetching files from Google Drive...');
    gapi.client.drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)'
    }).then(response => {
        console.log('Files fetched:', response.result.files);
        files = response.result.files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
        });
        if (files.length === 0) {
            console.warn('No supported files found in the folder.');
            return;
        }
        showNextSlide();
    }).catch(error => {
        console.error('Error fetching files:', error);
    });
}

function getFileUrl(fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function showNextSlide() {
    const imageElement = document.getElementById('slide-image');
    const videoElement = document.getElementById('slide-video');
    
    imageElement.style.display = 'none';
    videoElement.style.display = 'none';

    if (files.length === 0) {
        console.warn('No files to display.');
        return;
    }

    const file = files[currentIndex];
    console.log('Displaying file:', file.name);
    const ext = file.name.split('.').pop().toLowerCase();
    const fileUrl = getFileUrl(file.id);

    if (IMAGE_EXTENSIONS.includes(ext)) {
        imageElement.src = fileUrl;
        imageElement.style.display = 'block';
        setTimeout(showNextSlide, IMAGE_DURATION);
    } else if (VIDEO_EXTENSIONS.includes(ext)) {
        videoElement.src = fileUrl;
        videoElement.style.display = 'block';
        videoElement.onended = showNextSlide;
        videoElement.play().catch(error => {
            console.error('Error playing video:', error);
            showNextSlide();
        });
    }

    currentIndex = (currentIndex + 1) % files.length;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, starting Google Drive API');
    loadGoogleDriveAPI();
});
