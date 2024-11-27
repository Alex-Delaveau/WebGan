import numpy as np
import cv2
from tensorflow.keras.models import load_model
from flask import Flask, request, jsonify
import io
import base64
from PIL import Image
from flask_cors import CORS

app = Flask(__name__)

# Load the trained model once at server startup
model = load_model('models/generator_epoch_20.h5')

CORS(app, origins=["https://webgan.talluan.fr", "https://api.webgan.talluan.fr"])

# Configurable variables
MASK_SIZE = (48, 48)  # Size of the mask
IMG_SIZE = (128, 128)  # Size of the resized image for model input


def add_random_noise_hole(image, mask_size=MASK_SIZE):
    """Add a square with random noise to the image."""
    image_with_hole = image.copy()
    h, w, _ = image_with_hole.shape
    mh, mw = mask_size
    x_start = (w - mw) // 2
    y_start = (h - mh) // 2

    # Add noise in the range [0, 255]
    noise = np.random.randint(0, 256, (mh, mw, 3), dtype=np.uint8)
    image_with_hole[y_start:y_start+mh, x_start:x_start+mw, :] = noise

    return image_with_hole


def preprocess_image(image_bytes, img_size=IMG_SIZE, mask_size=MASK_SIZE):
    """Prepare the image for inference."""
    # Load the image as a NumPy array
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data received.")

    # Convert to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Resize and normalize to [0, 1]
    img = cv2.resize(img, img_size) / 255.0

    # Add random noise hole
    image_with_hole = add_random_noise_hole((img * 255).astype(np.uint8), mask_size=mask_size) / 255.0

    return img, image_with_hole


def run_inference(image_with_hole):
    """Run inference on the given image."""
    # Add batch dimension and ensure float32 type
    image_with_hole_batch = np.expand_dims(image_with_hole.astype(np.float32), axis=0)
    prediction = model.predict(image_with_hole_batch)
    prediction = np.squeeze(prediction, axis=0)  # Remove batch dimension
    return (prediction * 255).astype(np.uint8)


def image_to_base64(image):
    """Convert a NumPy array to a Base64 string."""
    image_pil = Image.fromarray(image.astype('uint8'))
    buffer = io.BytesIO()
    image_pil.save(buffer, format="JPEG")
    base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return base64_str


@app.route("/process_image", methods=["POST"])
def process_image():
    """API endpoint to process an image."""
    if 'file' not in request.files:
        return jsonify({"error": "No file received."}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "Invalid file."}), 400

    try:
        # Preprocess the image
        img, image_with_hole = preprocess_image(file.read())

        # Perform inference
        prediction = run_inference(image_with_hole)

        # Convert images to Base64
        base_image_base64 = image_to_base64((img * 255).astype(np.uint8))
        image_with_hole_base64 = image_to_base64((image_with_hole * 255).astype(np.uint8))
        prediction_base64 = image_to_base64(prediction)

        # Return Base64 strings in the response
        return jsonify({
            "base_image": base_image_base64,
            "image_with_hole": image_with_hole_base64,
            "prediction": prediction_base64
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
