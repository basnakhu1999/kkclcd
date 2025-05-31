console.log("Document loaded, starting slideshow");

const imageElement = document.getElementById("slide-image");
const videoElement = document.getElementById("slide-video");
const container = document.getElementById("media-container");

let cachedFiles = [];
let currentIndex = 0;

async function fetchFiles() {
    console.log("Fetching files from Cloudinary...");
    const response = await fetch("/api/list-files");
    const data = await response.json();

    const filtered = data.files
        .map(file => file.secure_url)
        .filter(url => url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".mp4"));

    cachedFiles = filtered;
    console.log("Cached files:", cachedFiles.length, cachedFiles);
}

function fadeOut(element, duration = 2000) {
    return new Promise(resolve => {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = 0;
        setTimeout(() => {
            element.style.display = "none";
            resolve();
        }, duration);
    });
}

function fadeIn(element, duration = 2000) {
    return new Promise(resolve => {
        element.style.display = "block";
        requestAnimationFrame(() => {
            element.style.transition = `opacity ${duration}ms`;
            element.style.opacity = 1;
            setTimeout(resolve, duration);
        });
    });
}

async function displayNextFile() {
    if (cachedFiles.length === 0) return;

    const url = cachedFiles[currentIndex];
    console.log("Displaying file:", url);

    const isVideo = url.endsWith(".mp4");

    // Fade out current media
    await Promise.all([
        fadeOut(imageElement, 1000),
        fadeOut(videoElement, 1000)
    ]);

    // Clear and prepare
    imageElement.style.display = "none";
    videoElement.style.display = "none";

    if (isVideo) {
        videoElement.src = url;
        videoElement.load();

        videoElement.onloadeddata = async () => {
            imageElement.style.display = "none";
            videoElement.style.display = "block";
            videoElement.play();
            await fadeIn(videoElement, 1000);
        };

        videoElement.onerror = () => {
            console.error("Error loading video:", url);
            next();
        };

        videoElement.onended = next;

    } else {
        imageElement.src = url;
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();

        imageElement.style.display = "block";
        await fadeIn(imageElement, 1000);
        setTimeout(next, 10000); // Show image for 10 sec
    }
}

function next() {
    currentIndex = (currentIndex + 1) % cachedFiles.length;
    displayNextFile();
}

(async function start() {
    await fetchFiles();
    if (cachedFiles.length > 0) {
        container.style.opacity = 1;
        displayNextFile();
    }
})();
