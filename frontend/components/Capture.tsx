import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./WebcamCapture.css"; // Import du fichier CSS

const WebcamCapture: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [results, setResults] = useState<{
        baseImage: string;
        imageWithHole: string;
        prediction: string;
    } | null>(null);

    const squareSize = 48 * 2;

    const capture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc || null);
        }
    };

    const uploadImage = async () => {
        if (!capturedImage) return;

        try {
            const blob = await (await fetch(capturedImage)).blob();
            const formData = new FormData();
            formData.append("file", blob, "captured_image.jpg");

            // Utilisation de l'URL dynamique provenant du fichier .env
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
            const response = await axios.post(`${apiUrl}/process_image`, formData);

            setResults({
                baseImage: response.data.base_image,
                imageWithHole: response.data.image_with_hole,
                prediction: response.data.prediction,
            });
        } catch (error) {
            console.error("Error uploading the image:", error);
        }
    };

    return (
        <div className="container">
            <h1 className="title">GAN Inpainting Demo</h1>
            <div className="webcam-section">
                <div className="webcam-wrapper">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            width: 1024,
                            height: 1024,
                            facingMode: "user",
                        }}
                        className="webcam"
                    />
                    <div className="red-square" style={{ width: `${squareSize}px`, height: `${squareSize}px` }}></div>
                </div>
                {capturedImage && (
                    <div className="image-wrapper">
                        <img src={capturedImage} alt="Captured" className="captured-image" />
                        <div className="red-square" style={{ width: `${squareSize}px`, height: `${squareSize}px` }}></div>
                    </div>
                )}
            </div>

            <div className="button-group">
                <button onClick={capture} className="button capture-button">Capture Image</button>
                <button onClick={uploadImage} className="button upload-button">Upload Image</button>
            </div>

            {results && (
                <div className="results">
                    <h2 className="subtitle">Results</h2>
                    <div className="results-grid">
                        <div className="result-item">
                            <h3>Base Image</h3>
                            <img src={`data:image/jpeg;base64,${results.baseImage}`} alt="Base" className="result-image" />
                        </div>
                        <div className="result-item">
                            <h3>Image with Hole</h3>
                            <img src={`data:image/jpeg;base64,${results.imageWithHole}`} alt="With Hole" className="result-image" />
                        </div>
                        <div className="result-item">
                            <h3>Prediction</h3>
                            <img src={`data:image/jpeg;base64,${results.prediction}`} alt="Prediction" className="result-image" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebcamCapture;
