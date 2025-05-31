const cloudName = "daopyjiux";
const folderName = "video";

const imageElement = document.getElementById("slide-image");
const videoElement = document.getElementById("slide-video");

let cachedFiles = [];
let currentIndex = 0;

// เก็บ preload object
let preloadImages = {};
let preloadVideos = {};

document.addEventListener("DOMContentLoaded", () => {
    console.log("Document loaded, starting slideshow");
    fetchCloudinaryFiles();
});

async function fetchCloudinaryFiles() {
    console.log("Fetching files from Cloudinary...");
    try {
        const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/list/${folderName}.json`);
        const data = await response.json();

        const files = data.resources
            .filter(file => /\.(jpg|jpeg|png|gif|mp4)$/i.test(file.public_id))
            .map(file => {
                const extension = file.format;
                const typeFolder = extension === "mp4" ? "video" : "image";
                return `https://res.cloudinary.com/${cloudName}/${typeFolder}/upload/${file.public_id}.${extension}`;
            });

        console.log("Filtered files:", files);
        await preloadAllFiles(files);

    } catch (error) {
        console.error("Error fetching Cloudinary files:", error);
    }
}

async function preloadAllFiles(files) {
    const preloadPromises = files.map(url => {
        if (url.endsWith(".mp4")) {
            return new Promise(resolve => {
                const video = document.createElement("video");
                video.src = url;
                video.muted = true;
                video.preload = "auto";
                video.addEventListener("canplaythrough", () => {
                    preloadVideos[url] = video;
                    resolve(url);
                });
                video.addEventListener("error", () => {
                    console.warn("Failed to preload video:", url);
                    resolve(null); // Don't include failed video
                });
            });
        } else {
            return new Promise(resolve => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    preloadImages[url] = img;
                    resolve(url);
                };
                img.onerror = () => {
                    console.warn("Failed to preload image:", url);
                    resolve(null);
                };
            });
        }
    });

    const loadedFiles = await Promise.all(preloadPromises);
    cachedFiles = loadedFiles.filter(Boolean); // Remove failed/null entries

    console.log("Preloaded and cached:", cachedFiles);
    displayNextFile();
}

function next() {
    currentIndex = (currentIndex + 1) % cachedFiles.length;
    displayNextFile();
}

function displayNextFile() {
    if (cachedFiles.length === 0) return;

    const url = cachedFiles[currentIndex];
    console.log("Displaying file:", url);

    imageElement.style.opacity = 0;
    videoElement.style.opacity = 0;

    if (url.endsWith(".mp4")) {
        const video = preloadVideos[url];
        if (!video) {
            console.error("Video not cached:", url);
            next();
            return;
        }

        videoElement.src = video.src;
        videoElement.load();

        imageElement.style.display = "none";
        videoElement.style.display = "block";

        setTimeout(() => {
            videoElement.style.opacity = 1;
            videoElement.play();
        }, 50);

        videoElement.onended = next;
        videoElement.onerror = () => {
            console.error("Error playing video:", url);
            next();
        };
    } else {
        const img = preloadImages[url];
        if (!img) {
            console.error("Image not cached:", url);
            next();
            return;
        }

        imageElement.src = img.src;
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();

        videoElement.style.display = "none";
        imageElement.style.display = "block";

        setTimeout(() => {
            imageElement.style.opacity = 1;
        }, 50);

        setTimeout(next, 3000);
    }
}
