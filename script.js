document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const colorInput = document.getElementById('targetColor');
    const colorCountDisplay = document.getElementById('colorCount');

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

    function processVideo() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frame.data;

        const targetColor = hexToRgb(colorInput.value);
        let colorPixelCount = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];     
            const g = pixels[i + 1]; 
            const b = pixels[i + 2]; 

            if (isColorMatch(r, g, b, targetColor)) {
                pixels[i] = 255;    
                pixels[i + 1] = 255;
                pixels[i + 2] = 255; 
                colorPixelCount++;
            }
        }

        ctx.putImageData(frame, 0, 0);

        colorCountDisplay.textContent = colorPixelCount;

        requestAnimationFrame(processVideo);
    }

    function isColorMatch(r, g, b, targetColor, threshold = 30) {
        return (
            Math.abs(r - targetColor.r) < threshold &&
            Math.abs(g - targetColor.g) < threshold &&
            Math.abs(b - targetColor.b) < threshold
        );
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    startVideo();
    video.addEventListener('play', processVideo);
});
