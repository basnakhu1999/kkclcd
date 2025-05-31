const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];
const IMAGE_DURATION = 30000; // 30 วินาที
const CHECK_INTERVAL = 3600000; // รีเฟรช cache ทุก 1 ชั่วโมง

let files = [];
let currentIndex = 0;
let slideTimeout;

// โหลดและอัปเดต cache media
async function fetchFiles() {
    console.log('Fetching files from Cloudinary...');
    try {
        const response = await fetch('/api/list-files');
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to fetch files');
        }

        const fetchedFiles = data.files
            .filter(file => {
                const ext = file.secure_url.split('.').pop().toLowerCase();
                return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
            })
            .map(file => ({
                url: file.secure_url,
                type: IMAGE_EXTENSIONS.includes(file.secure_url.split('.').pop().toLowerCase()) ? 'image' : 'video'
            }));

        if (fetchedFiles.length === 0) {
            console.warn('No supported files found.');
            document.getElementById('media-container').innerHTML = '<p>No media found.</p>';
            return;
        }

        files = fetchedFiles; // อัปเดตแคช
        currentIndex = 0;      // รีเซ็ต index เพื่อเริ่ม loop ใหม่
        console.log('Cached files:', files.length, files.map(f => f.url));

    } catch (error) {
        console.error('Error fetching files:', error);
        document.getElementById('media-container').innerHTML = '<p>Error loading media. Please try again later.</p>';
    }
}

// แสดง media ตัวถัดไปและวน loop
function showNextSlide() {
    clearTimeout(slideTimeout);

    if (files.length === 0) {
        console.warn('No files to display.');
        return;
    }

    const imageElement = document.getElementById('slide-image');
    const videoElement = document.getElementById('slide-video');

    imageElement.style.display = 'none';
    videoElement.style.display = 'none';
    videoElement.pause();
    videoElement.src = '';

    const file = files[currentIndex];
    console.log('Displaying file:', file.url);

    if (file.type === 'image') {
        imageElement.src = file.url;
        imageElement.style.display = 'block';
        imageElement.onerror = () => {
            console.error('Error loading image:', file.url);
            showNextSlide(); // ข้ามไปเลย
        };
        slideTimeout = setTimeout(showNextSlide, IMAGE_DURATION);
    } else if (file.type === 'video') {
        videoElement.src = file.url;
        videoElement.style.display = 'block';
        videoElement.onended = showNextSlide;
        videoElement.onerror = () => {
            console.error('Error loading video:', file.url);
            showNextSlide(); // ข้ามไปเลย
        };
        videoElement.load();
        videoElement.play().catch(error => {
            console.error('Error playing video:', file.url, error);
            showNextSlide(); // ข้ามไปเลย
        });
    }

    currentIndex = (currentIndex + 1) % files.length; // เดิน index วนรอบ
}

// เริ่มต้น
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Document loaded, starting slideshow');
    await fetchFiles();      // โหลดแคช
    showNextSlide();         // เริ่มเล่น loop
    setInterval(fetchFiles, CHECK_INTERVAL); // รีเฟรชแคชทุก 1 ชม.
});
