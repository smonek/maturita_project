import cv2
import numpy as np

lower = np.array([255, 255, 255])
upper = np.array([255, 255, 255])

color_name = "Undefined"
calibration_ratio = None

def get_color_name(h, s, v):
    if s < 40 and v > 200:
        return "Bila"
    elif v < 40:
        return "Cerna"
    elif s < 40:
        return "Seda"
    elif h < 10 or h > 170:
        return "Cervena"
    elif 10 <= h < 25:
        return "Oranzova"
    elif 25 <= h < 35:
        return "Zluta"
    elif 35 <= h < 85:
        return "Zelena"
    elif 85 <= h < 170:
        return "Modra"
    else:
        return "Nerozpoznana"

def pick_color(event, x, y, flags, param):
    global lower, upper, hsv_image, color_name, calibration_ratio
    if event == cv2.EVENT_LBUTTONDOWN:
        hsv_pixel = hsv_image[y, x]
        h, s, v = hsv_pixel

        color_name = get_color_name(h, s, v)

        if h < 10 or h > 170:
            lower1 = np.array([max(h - 10, 0), max(s - 40, 0), max(v - 40, 0)])
            upper1 = np.array([min(h + 10, 179), min(s + 40, 255), min(v + 40, 255)])
            if h < 10:
                lower2 = np.array([170, max(s - 40, 0), max(v - 40, 0)])
                upper2 = np.array([179, min(s + 40, 255), min(v + 40, 255)])
            else:
                lower2 = np.array([0, max(s - 40, 0), max(v - 40, 0)])
                upper2 = np.array([10, min(s + 40, 255), min(v + 40, 255)])
            lower = (lower1, lower2)
            upper = (upper1, upper2)
            print(f"New HSV Range for Red: Lower1={lower1}, Upper1={upper1}, Lower2={lower2}, Upper2={upper2}")
        else:
            lower = np.array([max(h - 10, 0), max(s - 40, 0), max(v - 40, 0)])
            upper = np.array([min(h + 10, 179), min(s + 40, 255), min(v + 40, 255)])
            print(f"New HSV Range: Lower={lower}, Upper={upper}")

    elif event == cv2.EVENT_RBUTTONDOWN:
        print("Right-click detected. Select a reference object.")
        for contour in contours:
            if cv2.contourArea(contour) > 500:
                x, y, w, h = cv2.boundingRect(contour)
                print(f"Reference object width in pixels: {w}")
                actual_width = float(input("Enter the actual width of the object in cm: "))
                calibration_ratio = w / actual_width
                print(f"Calibration ratio updated: {calibration_ratio} pixels per cm")
                break

video = cv2.VideoCapture(0)

cv2.namedWindow("Webcam")
cv2.setMouseCallback("Webcam", pick_color)

while True:
    success, img = video.read()
    if not success or img is None:
        print("Failed to capture video frame")
        break

    hsv_image = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    try:
        if isinstance(lower, tuple):
            mask1 = cv2.inRange(hsv_image, lower[0], upper[0])
            mask2 = cv2.inRange(hsv_image, lower[1], upper[1])
            mask = cv2.bitwise_or(mask1, mask2)
        else:
            mask = cv2.inRange(hsv_image, lower, upper)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            if cv2.contourArea(contour) > 500:
                x, y, w, h = cv2.boundingRect(contour)

                if calibration_ratio:
                    real_width = w / calibration_ratio
                    real_height = h / calibration_ratio
                    cv2.putText(img, f"{real_width:.1f}x{real_height:.1f} cm", (x, y - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 3)
                cv2.putText(img, color_name, (x, y - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        cv2.imshow("Mask", mask)
        cv2.imshow("Webcam", img)
    except Exception as e:
        print(f"Error during processing: {e}")

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video.release()
cv2.destroyAllWindows()
