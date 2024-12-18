document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvasRaw = document.getElementById('canvasRaw');
    const canvasBW = document.getElementById('canvasBW');
    const ctxRaw = canvasRaw.getContext('2d');
    const ctxBW = canvasBW.getContext('2d');
    const colorInput = document.getElementById('targetColor');

    let lower = [0, 0, 0];
    let upper = [180, 255, 255]; 

    const MIN_CONTOUR_SIZE = 500;

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

    function updateColorRange(event, x, y) {
        const imgData = ctxRaw.getImageData(0, 0, canvasRaw.width, canvasRaw.height);
        const pixel = imgData.data;

        const idx = (y * canvasRaw.width + x) * 4;
        const r = pixel[idx]; 
        const g = pixel[idx + 1]; 
        const b = pixel[idx + 2]; 

        const targetColor = rgbToHsv(r, g, b);

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

    canvasRaw.addEventListener('click', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;
        updateColorRange(event, x, y);
    });

    function processVideo() {
        ctxRaw.drawImage(video, 0, 0, canvasRaw.width, canvasRaw.height);
        const frame = ctxRaw.getImageData(0, 0, canvasRaw.width, canvasRaw.height);
        const pixels = frame.data;
    
        const mask = new Uint8Array(pixels.length / 4);
    
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
    
            const hsv = rgbToHsv(r, g, b);
            if (isColorInRange(hsv, lower, upper)) {
                mask[i / 4] = 1;
            } else {
                mask[i / 4] = 0;
            }
        }
    
        const contours = findContours(mask);
        contours.forEach(contour => {
            if (contour.length >= MIN_CONTOUR_SIZE) {
                drawBoundingBox(contour, pixels, canvasRaw.width);
            }
        });
    
        ctxRaw.putImageData(frame, 0, 0);
    
        const bwImageData = new ImageData(canvasRaw.width, canvasRaw.height);
        for (let i = 0; i < mask.length; i++) {
            const value = mask[i] * 255;
            const idx = i * 4;
            bwImageData.data[idx] = value;
            bwImageData.data[idx + 1] = value;
            bwImageData.data[idx + 2] = value;
            bwImageData.data[idx + 3] = 255;
        }
        ctxBW.putImageData(bwImageData, 0, 0);
    
        requestAnimationFrame(processVideo);
    }
    
    function isColorInRange(hsv, lower, upper) {
        return (
            hsv.h >= lower[0] && hsv.h <= upper[0] &&
            hsv.s >= lower[1] && hsv.s <= upper[1] &&
            hsv.v >= lower[2] && hsv.v <= upper[2]
        );
    }

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

        const thickness = 3;
        for (let t = 0; t < thickness; t++) {
            for (let x = minX; x <= maxX; x++) {
                const topIdx = ((minY + t) * width + x) * 4;
                const bottomIdx = ((maxY - t) * width + x) * 4;
                pixels[topIdx] = pixels[bottomIdx] = 255; pixels[topIdx + 1] = pixels[bottomIdx + 1] = 0;
                pixels[topIdx + 2] = pixels[bottomIdx + 2] = 0;
            }
            for (let y = minY; y <= maxY; y++) {
                const leftIdx = ((y * width) + (minX + t)) * 4;
                const rightIdx = ((y * width) + (maxX - t)) * 4;
                pixels[leftIdx] = pixels[rightIdx] = 255; pixels[leftIdx + 1] = pixels[rightIdx + 1] = 0;
                pixels[leftIdx + 2] = pixels[rightIdx + 2] = 0;
            }
        }
    }

    startVideo();
    video.addEventListener('play', processVideo);
});
