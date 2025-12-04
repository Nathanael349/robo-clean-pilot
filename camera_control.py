# -*- coding: utf-8 -*-
from flask import Flask, Response
import cv2
import numpy as np
import serial
import time

app = Flask(__name__)

# ---- Serial connection to Arduino ----
arduino = serial.Serial('/dev/ttyACM0', 115200, timeout=1)
time.sleep(2)   # Wait for Arduino reset

# ---- Camera setup ----
camera = cv2.VideoCapture("/dev/video0")
camera.set(cv2.CAP_PROP_FPS, 30)
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

last_state = -1    # remember last value sent (to avoid spamming)
last_sent_time = 0 # for periodic updates

def gen_frames():
    global last_state, last_sent_time

    while True:
        success, frame = camera.read()
        if not success:
            break

        # Convert to HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Red HSV mask
        lower1 = np.array([0, 100, 100])
        upper1 = np.array([10, 255, 255])
        lower2 = np.array([160, 100, 100])
        upper2 = np.array([179, 255, 255])

        mask1 = cv2.inRange(hsv, lower1, upper1)
        mask2 = cv2.inRange(hsv, lower2, upper2)
        mask = cv2.bitwise_or(mask1, mask2)

        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        red_found = False
        for c in contours:
            if cv2.contourArea(c) < 500:
                continue
            red_found = True

            x, y, w, h = cv2.boundingRect(c)
            cv2.rectangle(frame, (x,y), (x+w, y+h), (0,0,255), 2)

        # ----- SEND SERIAL UPDATE -----
        state_value = 1 if red_found else 0
        current_time = time.time()
        
        # Send if state changed OR if 1 second has passed (keep-alive/sync)
        if state_value != last_state or (current_time - last_sent_time > 1.0):
            if state_value == 1:
                msg = "K"
                arduino.write(msg.encode())
            # We don't need to send anything for 0, Arduino times out after 500ms
            
            last_state = state_value
            last_sent_time = current_time

        # Encode to JPEG for browser
        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
        frame = buffer.tobytes()

        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' +
               frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return '<h2>Live Stream + Red Detection + Arduino Serial Output</h2><img src="/video_feed" width="640">'

if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, threaded=True)
