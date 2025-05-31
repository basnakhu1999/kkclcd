console.log("Document loaded, starting slideshow");

const imageElement = document.getElementById("slide-image");
const videoElement = document.getElementById("slide-video");
const container = document.getElementById("media-container");

let cachedFiles = [];
let currentIndex = 0;
let refreshInterval;
let isTransitioning = false;

// Main initialization function
async function initializeSlideshow() {
    await fetchFiles();
    if (cachedFiles.length > 0) {
        container.style.opacity = 1;
        displayNextFile();
    }
    
    // Set up auto-refresh every minute (60000ms)
    refreshInterval = setInterval(fetchFiles, 60000);
}

// Enhanced file fetching with error handling
async function fetchFiles() {
    console.log("Fetching files from Cloudinary...");
    try {
        const response = await fetch("/api/list-files");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const filtered = data.files
            .map(file => file.secure_url)
            .filter(url => url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".mp4"));

        // Only update if files have changed
        if (JSON.stringify(filtered) !== JSON.stringify(cachedFiles)) {
            console.log("Files updated. New file count:", filtered.length);
            cachedFiles = filtered;
            
            // Reset index if it's now out of bounds
            if (currentIndex >= cachedFiles.length) {
                currentIndex = 0;
            }
            
            // If we're not in the middle of a transition, show next file
            if (!isTransitioning) {
                displayNextFile();
            }
        }
    } catch (error) {
        console.error("Error fetching files:", error);
    }
}

// Improved fade effects with better timing
function fadeOut(element, duration = 1000) {
    return new Promise(resolve => {
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.style.opacity = 0;
        setTimeout(() => {
            element.style.display = "none";
            resolve();
        }, duration);
    });
}

function fadeIn(element, duration = 1000) {
    return new Promise(resolve => {
        element.style.display = "block";
        element.style.opacity = 0;
        requestAnimationFrame(() => {
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = 1;
            setTimeout(resolve, duration);
        });
    });
}

// Enhanced media display with better error handling
async function displayNextFile() {
    if (cachedFiles.length === 0) return;
    
    isTransitioning = true;
    
    try {
        const url = cachedFiles[currentIndex];
        console.log("Displaying file:", url);
        const isVideo = url.endsWith(".mp4");

        // Fade out current media
        await Promise.all([
            fadeOut(imageElement),
            fadeOut(videoElement)
        ]);

        // Clear and prepare
        imageElement.style.display = "none";
        videoElement.style.display = "none";

        if (isVideo) {
            // Video handling
            videoElement.src = url;
            videoElement.load();

            await new Promise((resolve) => {
                videoElement.onloadeddata = async () => {
                    imageElement.style.display = "none";
                    videoElement.style.display = "block";
                    await fadeIn(videoElement);
                    videoElement.play().catch(e => console.error("Video play error:", e));
                    resolve();
                };

                videoElement.onerror = () => {
                    console.error("Error loading video:", url);
                    resolve();
                };
            });
        } else {
            // Image handling
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
    
    // Different delay for videos (wait for end) vs images (fixed delay)
    if (isVideo) {
        videoElement.onended = next;
    } else {
        setTimeout(next, 10000); // Show image for 10 sec
    }
}

function next() {
    if (cachedFiles.length === 0) return;
    currentIndex = (currentIndex + 1) % cachedFiles.length;
    displayNextFile();
}

// Start the slideshow
initializeSlideshow();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(refreshInterval);
});
