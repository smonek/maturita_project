document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvasRaw = document.getElementById('canvasRaw');
    const canvasBW = document.getElementById('canvasBW');
    const ctxRaw = canvasRaw.getContext('2d');
    const ctxBW = canvasBW.getContext('2d');
    const colorInput = document.getElementById('targetColor');

    let lower = [0, 0, 0];  // Lower HSV bound
    let upper = [180, 255, 255];  // Upper HSV bound

    // Start the video feed
    async function startVideo() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            video.srcObject = stream;
            video.play();
        } catch (err) {
            console.error("Error accessing the webcam: ", err);
        }
    }

    // Update the color range based on mouse click
    function updateColorRange(event, x, y) {
        const imgData = ctxRaw.getImageData(0, 0, canvasRaw.width, canvasRaw.height);
        const pixel = imgData.data;

        const idx = (y * canvasRaw.width + x) * 4;
        const r = pixel[idx];     // Red channel
        const g = pixel[idx + 1]; // Green channel
        const b = pixel[idx + 2]; // Blue channel

        const targetColor = rgbToHsv(r, g, b);

        // Update the lower and upper bounds based on the selected color
        const tolerance = 30;
        lower = [
            Math.max(targetColor.h - tolerance, 0),
            Math.max(targetColor.s - tolerance, 0),
            Math.max(targetColor.v - tolerance, 0)
        ];
        upper = [
            Math.min(targetColor.h + tolerance, 180),
            Math.min(targetColor.s + tolerance, 255),
            Math.min(targetColor.v + tolerance, 255)
        ];

        console.log('Updated color range:', lower, upper);
    }

    // Mouse click listener for color selection
    canvasRaw.addEventListener('click', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;
        updateColorRange(event, x, y);
    });

    // Process each video frame for color detection and object bounding
    function processVideo() {
        ctxRaw.drawImage(video, 0, 0, canvasRaw.width, canvasRaw.height);
        const frame = ctxRaw.getImageData(0, 0, canvasRaw.width, canvasRaw.height);
        const pixels = frame.data;

        // Apply the current color range for detection
        const targetColor = { h: lower[0], s: lower[1], v: lower[2] };  // Current color range
        const mask = new Uint8Array(pixels.length / 4);

        // Convert each pixel to HSV and check if it's within the target range
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            const hsv = rgbToHsv(r, g, b);
            if (isColorInRange(hsv, lower, upper)) {
                mask[i / 4] = 1;
                pixels[i] = 255;    // Highlight matching pixels in white (for raw video)
                pixels[i + 1] = 255;
                pixels[i + 2] = 255;
            } else {
                mask[i / 4] = 0;
            }
        }

        // Detect and draw bounding boxes around matching regions
        const contours = findContours(mask);
        contours.forEach(contour => {
            drawBoundingBox(contour, pixels, canvasRaw.width);
        });

        // Draw the processed image to the raw canvas (with bounding boxes)
        ctxRaw.putImageData(frame, 0, 0);

        // Draw the binary black-and-white mask to the second canvas
        const bwImageData = new ImageData(canvasRaw.width, canvasRaw.height);
        for (let i = 0; i < pixels.length; i += 4) {
            const value = mask[i / 4] * 255;
            bwImageData.data[i] = value;     // Red channel
            bwImageData.data[i + 1] = value; // Green channel
            bwImageData.data[i + 2] = value; // Blue channel
            bwImageData.data[i + 3] = 255;   // Alpha channel
        }
        ctxBW.putImageData(bwImageData, 0, 0);

        // Request the next animation frame
        requestAnimationFrame(processVideo);
    }

    // Check if the color is within the given range
    function isColorInRange(hsv, lower, upper) {
        return (
            hsv.h >= lower[0] && hsv.h <= upper[0] &&
            hsv.s >= lower[1] && hsv.s <= upper[1] &&
            hsv.v >= lower[2] && hsv.v <= upper[2]
        );
    }

    // Convert RGB to HSV
    function rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let h, s, v = max;
        let d = max - min;

        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 180, s: s * 255, v: v * 255 };
    }

    // Find contours from a binary mask
    function findContours(mask) {
        let contours = [];
        let visited = new Set();

        for (let i = 0; i < mask.length; i++) {
            if (mask[i] === 1 && !visited.has(i)) {
                let contour = [];
                dfs(i, contour, visited, mask, canvasRaw.width);
                contours.push(contour);
            }
        }
        return contours;
    }

    // Depth-first search for contour discovery
    function dfs(i, contour, visited, mask, width) {
        const directions = [-1, 1, -width, width];
        const stack = [i];
        while (stack.length > 0) {
            const index = stack.pop();
            if (visited.has(index)) continue;

            visited.add(index);
            contour.push(index);

            directions.forEach(direction => {
                const neighbor = index + direction;
                if (neighbor >= 0 && neighbor < mask.length && mask[neighbor] === 1) {
                    stack.push(neighbor);
                }
            });
        }
    }

    // Draw a red bounding box around the contour (border only)
    function drawBoundingBox(contour, pixels, width) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        contour.forEach(index => {
            const x = index % width;
            const y = Math.floor(index / width);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });

        // Draw the bounding box border
        for (let x = minX; x <= maxX; x++) {
            pixels[(minY * width + x) * 4] = 255;
            pixels[(minY * width + x) * 4 + 1] = 0;
            pixels[(minY * width + x) * 4 + 2] = 0;

            pixels[(maxY * width + x) * 4] = 255;
            pixels[(maxY * width + x) * 4 + 1] = 0;
            pixels[(maxY * width + x) * 4 + 2] = 0;
        }

        for (let y = minY; y <= maxY; y++) {
            pixels[(y * width + minX) * 4] = 255;
            pixels[(y * width + minX) * 4 + 1] = 0;
            pixels[(y * width + minX) * 4 + 2] = 0;

            pixels[(y * width + maxX) * 4] = 255;
            pixels[(y * width + maxX) * 4 + 1] = 0;
            pixels[(y * width + maxX) * 4 + 2] = 0;
        }
    }

    startVideo();
    video.addEventListener('play', processVideo);
});
