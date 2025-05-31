console.log("Document loaded, starting slideshow");

const imageElement = document.getElementById("slide-image");
const videoElement = document.getElementById("slide-video");
const container = document.getElementById("media-container");

let cachedFiles = [];
let currentIndex = 0;
let refreshInterval;
let isTransitioning = false;

// Timing configuration (all in milliseconds)
const config = {
    displayDuration: 120000,    // 2 minutes (120000ms)
    fadeDuration: 3000,         // 3 seconds for fade in/out
    refreshInterval: 60000      // 1 minute (60000ms)
};

async function initializeSlideshow() {
    await fetchFiles();
    if (cachedFiles.length > 0) {
        container.style.opacity = 1;
        displayNextFile();
    }
    
    refreshInterval = setInterval(fetchFiles, config.refreshInterval);
}

async function fetchFiles() {
    console.log("Fetching files from Cloudinary...");
    try {
        const response = await fetch("/api/list-files");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const filtered = data.files
            .map(file => file.secure_url)
            .filter(url => url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".mp4"));

        if (JSON.stringify(filtered) !== JSON.stringify(cachedFiles)) {
            console.log("Files updated. New file count:", filtered.length);
            cachedFiles = filtered;
            
            if (currentIndex >= cachedFiles.length) {
                currentIndex = 0;
            }
            
            if (!isTransitioning) {
                displayNextFile();
            }
        }
    } catch (error) {
        console.error("Error fetching files:", error);
    }
}

// Smoother fade effects with longer duration
function fadeOut(element) {
    return new Promise(resolve => {
        element.style.transition = `opacity ${config.fadeDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        element.style.opacity = 0;
        setTimeout(() => {
            element.style.display = "none";
            resolve();
        }, config.fadeDuration);
    });
}

function fadeIn(element) {
    return new Promise(resolve => {
        element.style.display = "block";
        element.style.opacity = 0;
        requestAnimationFrame(() => {
            element.style.transition = `opacity ${config.fadeDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
            element.style.opacity = 1;
            setTimeout(resolve, config.fadeDuration);
        });
    });
}

async function displayNextFile() {
    if (cachedFiles.length === 0) return;
    
    isTransitioning = true;
    
    try {
        const url = cachedFiles[currentIndex];
        console.log("Displaying file:", url);
        const isVideo = url.endsWith(".mp4");

        // Smoothly fade out current media
        await Promise.all([
            fadeOut(imageElement),
            fadeOut(videoElement)
        ]);

        // Prepare new media
        imageElement.style.display = "none";
        videoElement.style.display = "none";

        if (isVideo) {
            // Video handling with smoother transition
            videoElement.src = url;
            videoElement.load();

            await new Promise((resolve) => {
                videoElement.onloadeddata = async () => {
                    imageElement.style.display = "none";
                    videoElement.style.display = "block";
                    await fadeIn(videoElement);
                    try {
                        await videoElement.play();
                    } catch (e) {
                        console.error("Video play error:", e);
                    }
                    resolve();
                };

                videoElement.onerror = () => {
                    console.error("Error loading video:", url);
                    resolve();
                };
            });
        } else {
            // Image handling with smoother transition
            imageElement.src = url;
            videoElement.pause();
            videoElement.removeAttribute("src");
            videoElement.load();

            imageElement.style.display = "block";
            await fadeIn(imageElement);
        }
    } catch (error) {
        console.error("Error displaying media:", error);
    } finally {
        isTransitioning = false;
        scheduleNext();
    }
}

function scheduleNext() {
    const currentUrl = cachedFiles[currentIndex];
    const isVideo = currentUrl && currentUrl.endsWith(".mp4");
    
    if (isVideo) {
        // For videos, we'll either wait for them to end or use the full duration
        const videoEndHandler = () => {
            videoElement.removeEventListener('ended', videoEndHandler);
            next();
        };
        
        videoElement.addEventListener('ended', videoEndHandler);
        
        // Fallback in case video doesn't fire 'ended' event
        setTimeout(() => {
            videoElement.removeEventListener('ended', videoEndHandler);
            if (!isTransitioning) next();
        }, config.displayDuration);
    } else {
        // For images, use the full display duration
        setTimeout(next, config.displayDuration);
    }
}

function next() {
    if (cachedFiles.length === 0) return;
    currentIndex = (currentIndex + 1) % cachedFiles.length;
    displayNextFile();
}

// Start the slideshow
initializeSlideshow();

// Clean up
window.addEventListener('beforeunload', () => {
    clearInterval(refreshInterval);
    videoElement.pause();
    videoElement.removeAttribute("src");
});
