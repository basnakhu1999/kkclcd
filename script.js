const API_KEY = 'AIzaSyAeBhec1Z1fw2g0MOgCP28f8TII9j0zct8'; // WARNING: Exposing API key in frontend is a security risk!
const FOLDER_ID = '1LJQ29KTc6nWm72y9WlX-yMbPFp2F2ClJ';

const IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp']; // Use MIME types for robustness
const VIDEO_MIMETYPES = ['video/mp4', 'video/webm', 'video/ogg']; // Use MIME types for robustness
const IMAGE_DURATION = 30000; // 30 seconds
const CHECK_INTERVAL = 3600000; // 1 hour (for fetching new files)

let files = [];
let currentIndex = 0;
let slideTimeout; // To store the timeout for images

function loadGoogleDriveAPI() {
    console.log('Loading Google Drive API...');
    // Ensure the `gapi` object is available before trying to load 'client'
    if (typeof gapi !== 'undefined') {
        gapi.load('client', initClient);
    } else {
        console.error('gapi is not defined. Ensure api.js is loaded correctly.');
        // You might want to retry loading gapi or inform the user
    }
}

function initClient() {
    console.log('Initializing Google API Client...');
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    }).then(() => {
        console.log('Google API Client initialized successfully');
        // Check for public access to the folder and files before fetching
        // This is a basic check; real authentication would be needed for private files.
        fetchFiles();
        setInterval(fetchFiles, CHECK_INTERVAL);
    }).catch(error => {
        console.error('Error initializing Google API Client:', error);
        // Provide user feedback, e.g., "Could not load content. Please check API key or network."
    });
}

function fetchFiles() {
    console.log('Fetching files from Google Drive...');
    // Add orderBy to sort files, e.g., by name or creation time
    gapi.client.drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)', // Request mimeType for better filtering
        pageSize: 100 // Adjust if you have many files in the folder
    }).then(response => {
        const fetchedFiles = response.result.files;
        console.log('Files fetched:', fetchedFiles);

        files = fetchedFiles.filter(file => {
            // Using mimeType is more robust than just extension
            return IMAGE_MIMETYPES.includes(file.mimeType) || VIDEO_MIMETYPES.includes(file.mimeType);
        });

        if (files.length === 0) {
            console.warn('No supported image or video files found in the folder.');
            // Display a message to the user
            document.getElementById('media-container').innerHTML = '<p>No media found.</p>';
            return;
        }

        // If files are re-fetched, ensure currentIndex is valid or reset
        if (currentIndex >= files.length) {
            currentIndex = 0; // Reset if the current index is out of bounds
        }
        showNextSlide(); // Start or restart the slideshow with new files
    }).catch(error => {
        console.error('Error fetching files:', error);
        // Display an error message on the page
        document.getElementById('media-container').innerHTML = '<p>Error loading media. Please try again later.</p>';
    });
}

/**
 * Generates a direct access URL for a file.
 * This is primarily for publicly shared files or for files where you handle authentication.
 * For private files, fetching via gapi.client.drive.files.get({fileId: fileId, alt: 'media'})
 * and then creating a Blob URL is more reliable.
 */
function getDirectDownloadUrl(fileId) {
    // This URL works best for publicly shared files.
    // For private files, direct embedding often fails due to CORS or authentication.
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function showNextSlide() {
    clearTimeout(slideTimeout); // Clear any existing timeouts

    const imageElement = document.getElementById('slide-image');
    const videoElement = document.getElementById('slide-video');

    imageElement.style.display = 'none';
    videoElement.style.display = 'none';
    videoElement.pause(); // Pause any currently playing video
    videoElement.src = ''; // Clear video source

    if (files.length === 0) {
        console.warn('No files to display. Please ensure files are fetched.');
        document.getElementById('media-container').innerHTML = '<p>No media to display.</p>';
        return;
    }

    const file = files[currentIndex];
    console.log('Displaying file:', file.name, 'MIME Type:', file.mimeType);

    // Using mimeType for more accurate handling
    if (IMAGE_MIMETYPES.includes(file.mimeType)) {
        imageElement.src = getDirectDownloadUrl(file.id); // Or use fetch to create Blob URL
        imageElement.style.display = 'block';
        slideTimeout = setTimeout(showNextSlide, IMAGE_DURATION);
    } else if (VIDEO_MIMETYPES.includes(file.mimeType)) {
        videoElement.src = getDirectDownloadUrl(file.id); // Or use fetch to create Blob URL
        videoElement.style.display = 'block';
        videoElement.onended = showNextSlide; // Advance after video ends
        videoElement.load(); // Ensure video is ready to play
        try {
            await videoElement.play();
        } catch (error) {
            console.error('Error playing video:', error);
            // If autoplay fails, still advance to the next slide
            slideTimeout = setTimeout(showNextSlide, 3000); // Advance after a short delay if video can't play
        }
    } else {
        console.warn(`Unsupported file type: ${file.mimeType} for file: ${file.name}`);
        // Advance to the next slide if file type is not supported
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

// Optional: Implement a more robust way to get file content (requires OAuth for private files)
/*
async function getFileContentAsBlobUrl(fileId, mimeType) {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media' // Request the file content
        });

        // 'response.body' contains the file content as a string or array buffer
        // You might need to convert it to a Blob depending on the content type
        const blob = new Blob([response.body], { type: mimeType });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error fetching file content:', error);
        return null;
    }
}
*/
