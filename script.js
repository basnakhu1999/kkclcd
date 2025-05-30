const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];
const IMAGE_DURATION = 30000; // 30 seconds
const CHECK_INTERVAL = 3600000; // 1 hour
const TRANSITION_DURATION = 1000; // 1 second for fade

let files = [];
let currentIndex = 0;
let slideTimeout;

async function fetchFiles() {
    console.log('Fetching files from Cloudinary...');
    try {
        const response = await fetch('/api/list-files');
        const data = await response.json();
        console.log('Response from /api/list-files:', JSON.stringify(data, null, 2));

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to fetch files');
        }

        files = data.files
            .filter(file => {
                const ext = file.secure_url.split('.').pop().toLowerCase();
                const isSupported = IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
                if (!isSupported) {
                    console.warn('Unsupported file:', file.public_id, 'Extension:', ext);
                }
                return isSupported;
            })
            .map(file => ({
                url: file.secure_url,
                type: IMAGE_EXTENSIONS.includes(file.secure_url.split('.').pop().toLowerCase()) ? 'image' : 'video'
            }));

        console.log('Filtered files:', files.length, files.map(f => f.url));
        if (files.length === 0) {
            console.warn('No supported files found.');
            document.getElementById('media-container').innerHTML = '<p>No media found.</p>';
            return;
        }

        if (currentIndex >= files.length) {
            currentIndex = 0;
        }
        showNextSlide();
    } catch (error) {
        console.error('Error fetching files:', error);
        document.getElementById('media-container').innerHTML = '<p>Error loading media. Please try again later.</p>';
    }
}

function showNextSlide() {
    clearTimeout(slideTimeout);

    const imageElement = document.getElementById('slide-image');
    const videoElement = document.getElementById('slide-video');

    // ซ่อนสื่อปัจจุบัน
    imageElement.classList.remove('visible');
    videoElement.classList.remove('visible');
    videoElement.pause();
    videoElement.src = '';

    if (files.length === 0) {
        console.warn('No files to display.');
        document.getElementById('media-container').innerHTML = '<p>No media found.</p>';
        return;
    }

    const file = files[currentIndex];
    console.log('Preparing to display file:', file.url, 'Type:', file.type);

    if (file.type === 'image') {
        imageElement.src = file.url;
        console.log('Setting image src:', file.url);
        imageElement.classList.add('visible'); // Fade-in
        imageElement.onerror = () => {
            console.error('Error loading image:', file.url);
            document.getElementById('media-container').innerHTML = `<p>Error loading ${file.url}. Skipping...</p>`;
            setTimeout(showNextSlide, 2000);
        };
        imageElement.onload = () => {
            console.log('Image loaded successfully:', file.url);
        };
        slideTimeout = setTimeout(() => {
            imageElement.classList.remove('visible'); // Fade-out
            setTimeout(showNextSlide, TRANSITION_DURATION); // รอ fade-out
        }, IMAGE_DURATION);
    } else if (file.type === 'video') {
        videoElement.src = file.url;
        console.log('Setting video src:', file.url);
        videoElement.classList.add('visible'); // Fade-in
        videoElement.onended = () => {
            console.log('Video ended:', file.url);
            videoElement.classList.remove('visible'); // Fade-out
            setTimeout(showNextSlide, TRANSITION_DURATION); // รอ fade-out
        };
        videoElement.onerror = () => {
            console.error('Error loading video:', file.url);
            document.getElementById('media-container').innerHTML = `<p>Error loading ${file.url}. Skipping...</p>`;
            setTimeout(showNextSlide, 2000);
        };
        videoElement.onloadeddata = () => {
            console.log('Video loaded successfully:', file.url);
        };
        videoElement.load();
        videoElement.play().catch(error => {
            console.error('Error playing video:', file.url, error);
            setTimeout(showNextSlide, TRANSITION_DURATION);
        });
    }

    currentIndex = (currentIndex + 1) % files.length;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, starting slideshow');
    fetchFiles();
    setInterval(fetchFiles, CHECK_INTERVAL);
});
