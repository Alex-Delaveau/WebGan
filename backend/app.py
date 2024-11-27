import os
from dotenv import load_dotenv
import numpy as np
import cv2
from tensorflow.keras.models import load_model
from flask import Flask, request, jsonify
import io
import base64
from PIL import Image
from flask_cors import CORS
import tensorflow as tf

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)

# Charger le modèle depuis le fichier spécifié dans l'environnement
model_path = os.getenv("MODEL_PATH", "models/generator_epoch_20.h5")
model = load_model(model_path)

# Configurer CORS
cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
CORS(app, origins=cors_origins)

# Variables configurables
MASK_SIZE = (48, 48)  # Taille du masque
IMG_SIZE = (128, 128)  # Taille de l'image redimensionnée pour le modèle


def add_random_noise_hole(image, img_size=IMG_SIZE, mask_size=MASK_SIZE):
    """Adds a fixed mask at the center with random noise inside."""
    h, w = img_size
    mh, mw = mask_size

    # Calculate the fixed position for the mask
    x_start = (w - mw) // 2
    y_start = (h - mh) // 2

    # Generate random noise for the mask area
    noise = tf.random.uniform((mh, mw, 3), 0, 1)  # Random noise in [0, 1]

    # Apply the noise mask
    image_with_hole = tf.identity(image)
    indices = tf.reshape(
        tf.stack(
            tf.meshgrid(
                tf.range(y_start, y_start + mh),
                tf.range(x_start, x_start + mw),
                indexing='ij'
            ),
            axis=-1
        ),
        [-1, 2]
    )
    updates = tf.reshape(noise, [-1, 3])
    image_with_hole = tf.tensor_scatter_nd_update(image_with_hole, indices, updates)

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

    # Convert to TensorFlow tensor
    img_tensor = tf.convert_to_tensor(img, dtype=tf.float32)

    # Add random noise hole
    image_with_hole_tensor = add_random_noise_hole(img_tensor, img_size=img_size, mask_size=mask_size)

    return img, image_with_hole_tensor.numpy()


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
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    app.run(host=host, port=port)