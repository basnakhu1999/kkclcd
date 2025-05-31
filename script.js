const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];
const IMAGE_DURATION = 3000; // 3 seconds
const CHECK_INTERVAL = 3600000; // 1 hour
const TRANSITION_DURATION = 1000; // 1 second for transition

let cachedFiles = [];
let currentIndex = 0;
let slideTimeout;

const imageElement = document.getElementById('slide-image');
const videoElement = document.getElementById('slide-video');
const container = document.getElementById('media-container');

// รายการเอฟเฟกต์
const TRANSITION_EFFECTS = ['fade', 'slide-right', 'slide-left', 'zoom-in', 'zoom-out'];

// สุ่มเลือกเอฟเฟกต์
function getRandomEffect() {
    const randomIndex = Math.floor(Math.random() * TRANSITION_EFFECTS.length);
    return TRANSITION_EFFECTS[randomIndex];
}

// Preload สื่อและเก็บใน browser cache
async function preloadMedia(url, type) {
    return new Promise((resolve, reject) => {
        if (type === 'image') {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                console.log('Preloaded image:', url);
                resolve();
            };
            img.onerror = () => {
                console.error('Failed to preload image:', url);
                reject();
            };
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = url;
            video.preload = 'auto';
            video.onloadeddata = () => {
                console.log('Preloaded video:', url);
                resolve();
            };
            video.onerror = () => {
                console.error('Failed to preload video:', url);
                reject();
            };
            video.load();
        }
    });
}

async function fetchFiles() {
    console.log('Fetching files from Cloudinary...');
    try {
        const response = await fetch('/api/list-files');
        const data = await response.json();
        console.log('Response from /api/list-files:', JSON.stringify(data, null, 2));

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to fetch files');
        }

        // กรองและจัดรูปแบบไฟล์
        const newFiles = data.files
            .filter(file => {
                const ext = file.secure_url.split('.').pop().toLowerCase();
                return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
            })
            .map(file => ({
                url: file.secure_url,
                type: IMAGE_EXTENSIONS.includes(file.secure_url.split('.').pop().toLowerCase()) ? 'image' : 'video'
            }));

        if (newFiles.length === 0) {
            console.warn('No supported files found.');
            container.innerHTML = '<p>No media found.</p>';
            return;
        }

        // Preload ไฟล์ใหม่ทั้งหมด
        console.log('Preloading', newFiles.length, 'files...');
        await Promise.all(newFiles.map(file => preloadMedia(file.url, file.type).catch(() => null)));

        // อัปเดต cachedFiles
        cachedFiles = newFiles;
        console.log('Cached files:', cachedFiles.length, cachedFiles.map(f => f.url));

        // รีเซ็ต index
        if (currentIndex >= cachedFiles.length) {
            currentIndex = 0;
        }
    } catch (error) {
        console.error('Error fetching files:', error);
        container.innerHTML = '<p>Error loading media. Please try again later.</p>';
    }
}

function showNextSlide() {
    clearTimeout(slideTimeout);

    // ซ่อนสื่อปัจจุบัน
    imageElement.classList.remove('active', ...TRANSITION_EFFECTS);
    videoElement.classList.remove('active', ...TRANSITION_EFFECTS);
    videoElement.pause();
    videoElement.src = '';

    if (cachedFiles.length === 0) {
        console.warn('No files to display.');
        container.innerHTML = '<p>No media found.</p>';
        return;
    }

    const file = cachedFiles[currentIndex];
    const effect = getRandomEffect(); // สุ่มเอฟเฟกต์
    console.log('Displaying file:', file.url, 'Type:', file.type, 'Effect:', effect);

    if (file.type === 'image') {
        imageElement.src = file.url;
        imageElement.classList.add(effect, 'active'); // ใช้เอฟเฟกต์และแสดง
        imageElement.onerror = () => {
            console.error('Error displaying image:', file.url);
            container.innerHTML = `<p>Error loading ${file.url}. Skipping...</p>`;
            setTimeout(showNextSlide, 2000);
        };
        imageElement.onload = () => {
            console.log('Image displayed:', file.url);
        };
        slideTimeout = setTimeout(() => {
            imageElement.classList.remove('active'); // เริ่ม transition ออก
            setTimeout(showNextSlide, TRANSITION_DURATION); // รอ transition
        }, IMAGE_DURATION);
    } else if (file.type === 'video') {
        videoElement.src = file.url;
        videoElement.classList.add(effect, 'active'); // ใช้เอฟเฟกต์และแสดง
        videoElement.onended = () => {
            console.log('Video ended:', file.url);
            videoElement.classList.remove('active'); // เริ่ม transition ออก
            setTimeout(showNextSlide, TRANSITION_DURATION); // รอ transition
        };
        videoElement.onerror = () => {
            console.error('Error displaying video:', file.url);
            container.innerHTML = `<p>Error loading ${file.url}. Skipping...</p>`;
            setTimeout(showNextSlide, 2000);
        };
        videoElement.onloadeddata = () => {
            console.log('Video loaded:', file.url);
        };
        videoElement.load();
        videoElement.play().catch(error => {
            console.error('Error playing video:', file.url, error);
            setTimeout(showNextSlide, TRANSITION_DURATION);
        });
    }

    currentIndex = (currentIndex + 1) % cachedFiles.length;
}

async function start() {
    console.log('Document loaded, starting slideshow');
    await fetchFiles();
    if (cachedFiles.length > 0) {
        container.style.opacity = 1;
        showNextSlide();
    }
    // อัปเดตทุกชั่วโมง
    setInterval(async () => {
        await fetchFiles();
        if (cachedFiles.length > 0) {
            showNextSlide();
        }
    }, CHECK_INTERVAL);
}

document.addEventListener('DOMContentLoaded', start);
