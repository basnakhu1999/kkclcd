console.log("Document loaded, starting slideshow");

const imageElement = document.getElementById("slide-image");
const videoElement = document.getElementById("slide-video");
const container = document.getElementById("media-container");

// Configuration variables
const config = {
    // Display durations in milliseconds
    imageDisplayDuration: 10000,    // 5 seconds for images
    videoLoopCount: 2,             // Loop videos 2 times
    
    // Auto-refresh interval
    refreshInterval: 60000,        // 1 minute
    
    // Transition effects
    fadeDuration: 1000             // 1 second fade duration
};

let cachedFiles = [];
let currentIndex = 0;
let refreshTimer;
let isTransitioning = false;
let currentLoopCount = 0;

// Main initialization function
async function initializeSlideshow() {
    await fetchFiles();
    if (cachedFiles.length > 0) {
        container.style.opacity = 1;
        displayNextFile();
    }
    
    // Set up auto-refresh
    refreshTimer = setInterval(fetchFiles, config.refreshInterval);
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

function fadeOut(element) {
    return new Promise(resolve => {
        element.style.transition = `opacity ${config.fadeDuration}ms ease-in-out`;
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
            element.style.transition = `opacity ${config.fadeDuration}ms ease-in-out`;
            element.style.opacity = 1;
            setTimeout(resolve, config.fadeDuration);
        });
    });
}

async function displayNextFile() {
    if (cachedFiles.length === 0) return;
    
    isTransitioning = true;
    currentLoopCount = 0; // Reset loop counter
    
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
            videoElement.loop = false; // We'll handle looping manually
            videoElement.load();

            await new Promise((resolve) => {
                videoElement.onloadeddata = async () => {
                    videoElement.style.display = "block";
                    await fadeIn(videoElement);
                    
                    // Play video and handle looping
                    videoElement.play().catch(e => console.error("Video play error:", e));
                    
                    // Increment loop count when video ends
                    videoElement.onended = () => {
                        currentLoopCount++;
                        if (currentLoopCount < config.videoLoopCount) {
                            videoElement.currentTime = 0;
                            videoElement.play();
                        } else {
                            resolve();
                        }
                    };
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
            
            // Wait for the specified image display duration
            await new Promise(resolve => {
                setTimeout(resolve, config.imageDisplayDuration);
            });
        }
    } catch (error) {
        console.error("Error displaying media:", error);
    } finally {
        isTransitioning = false;
        next();
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
    clearInterval(refreshTimer);
    videoElement.pause();
    videoElement.removeAttribute("src");
});
