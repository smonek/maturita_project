const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const hueMin = document.getElementById('hueMin');
const hueMax = document.getElementById('hueMax');
const satMin = document.getElementById('satMin');
const satMax = document.getElementById('satMax');
const valMin = document.getElementById('valMin');
const valMax = document.getElementById('valMax');

let cap, frame, hsv, mask, contours;
let calibrationRatio = null;

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        initializeOpenCV();
    };
});

function initializeOpenCV() {
    cap = new cv.VideoCapture(video);
    frame = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
    hsv = new cv.Mat();
    mask = new cv.Mat();

    processVideo();
}

function processVideo() {
    cap.read(frame);
    cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    const lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        Number(hueMin.value),
        Number(satMin.value),
        Number(valMin.value),
    ]);
    const upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        Number(hueMax.value),
        Number(satMax.value),
        Number(valMax.value),
    ]);

    cv.inRange(hsv, lower, upper, mask);
    contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        if (area > 500) {
            const rect = cv.minAreaRect(contour);
            const points = cv.RotatedRect.points(rect);
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (calibrationRatio) {
                const width = rect.size.width / calibrationRatio;
                const height = rect.size.height / calibrationRatio;
                ctx.font = '16px Arial';
                ctx.fillStyle = 'white';
                ctx.fillText(`${width.toFixed(1)}x${height.toFixed(1)} cm`, points[0].x, points[0].y - 10);
            }
        }
    }

    requestAnimationFrame(processVideo);
}

document.getElementById('calibrate').addEventListener('click', () => {
    const referenceWidth = Number(document.getElementById('referenceWidth').value);
    if (contours.size() > 0 && referenceWidth > 0) {
        const rect = cv.minAreaRect(contours.get(0));
        calibrationRatio = rect.size.width / referenceWidth;
        alert(`Calibration successful! Ratio: ${calibrationRatio.toFixed(2)} px/cm`);
    }
});
