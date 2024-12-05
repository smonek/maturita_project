import cv2
import numpy as np

lower = np.array([15, 100, 100])
upper = np.array([35, 255, 255])

def pick_color(event, x, y, flags, param):
    global lower, upper, hsv_image
    if event == cv2.EVENT_LBUTTONDOWN:
        hsv_pixel = hsv_image[y, x]
        h, s, v = hsv_pixel

        lower = np.array([max(h - 10, 0), max(s - 40, 0), max(v - 40, 0)])
        upper = np.array([min(h + 10, 179), min(s + 40, 255), min(v + 40, 255)])
        print(f"New HSV Range: Lower={lower}, Upper={upper}")

video = cv2.VideoCapture(0)

cv2.namedWindow("Webcam")
cv2.setMouseCallback("Webcam", pick_color)

while True:
    success, img = video.read()
    if not success:
        print("Failed to capture video frame")
        break

    hsv_image = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    mask = cv2.inRange(hsv_image, lower, upper)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        if cv2.contourArea(contour) > 500:
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 3)

    cv2.imshow("Mask", mask)
    cv2.imshow("Webcam", img)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video.release()
cv2.destroyAllWindows()
