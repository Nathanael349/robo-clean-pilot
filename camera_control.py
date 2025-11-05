from flask import Flask, Response
import cv2

app = Flask(__name__)

# Open the webcam (Logitech C310)
camera = cv2.VideoCapture("/dev/video0")
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

def gen_frames():
    """Generator function to stream frames as MJPEG."""
    while True:
        success, frame = camera.read()
        if not success:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    """Main video stream endpoint."""
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    """Simple test page."""
    return '<h2>Raspberry Pi Live Stream</h2><img src="/video_feed" width="640">'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)