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

function fadeOut(element, duration = 500) {
    return new Promise(resolve => {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = 0;
        setTimeout(resolve, duration);
    });
}

function fadeIn(element, duration = 500) {
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

    await fadeOut(container);

    imageElement.style.display = "none";
    videoElement.style.display = "none";

    if (url.endsWith(".mp4")) {
        videoElement.src = url;
        videoElement.load();
        videoElement.style.opacity = 0;
        videoElement.onloadeddata = async () => {
            imageElement.style.display = "none";
            videoElement.style.display = "block";
            await fadeIn(container);
            videoElement.play();
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
        await fadeIn(container);

        setTimeout(next, 3000); // Show image for 3 sec
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
