import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

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
            const blob = await (await fetch(capturedImage)).blob(); // Convert base64 to blob
            const formData = new FormData();
            formData.append("file", blob, "captured_image.jpg");
    
            const response = await axios.post("https://api-webgan.talluan.fr/process_image", formData);
            console.log("API Response:", response.data);
            // Correctly map the API response to the `results` state
            setResults({
                baseImage: response.data.base_image,
                imageWithHole: response.data.image_with_hole,
                prediction: response.data.prediction,
            });
        } catch (error) {
            console.error("Error uploading the image:", error);
        }
    };

    useEffect(() => {
        if (results) {
            console.log("Results updated:", results);
        }
    }, [results]);  

    return (
        <div style={{ textAlign: "center" }}>
            <h1>GAN Inpainting Demo</h1>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", alignItems: "center" }}>
                {/* Webcam View */}
                <div style={{ position: "relative", display: "inline-block" }}>
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            width: 1024,
                            height: 1024,
                            facingMode: "user",
                        }}
                        style={{
                            width: 256,
                            height: 256,
                            border: "2px solid #ddd",
                            borderRadius: "8px",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                            transform: "scaleX(-1)", // Flip the image horizontally
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: `${squareSize}px`,
                            height: `${squareSize}px`,
                            border: "2px solid red",
                            transform: "translate(-50%, -50%)",
                        }}
                    ></div>
                </div>

                {/* Captured Image */}
                {capturedImage && (
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <img
                            src={capturedImage}
                            alt="Captured"
                            style={{
                                width: "256px",
                                height: "256px",
                                borderRadius: "8px",
                                border: "2px solid #ddd",
                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: `${squareSize}px`,
                                height: `${squareSize}px`,
                                border: "2px solid red",
                                transform: "translate(-50%, -50%)",
                            }}
                        ></div>
                    </div>
                )}
            </div>

            <button
                onClick={capture}
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    backgroundColor: "#007bff",
                    color: "white",
                    borderRadius: "5px",
                    border: "none",
                }}
            >
                Capture Image
            </button>

            <button
                onClick={uploadImage}
                style={{
                    marginLeft: "10px",
                    marginTop: "20px",
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    backgroundColor: "#28a745",
                    color: "white",
                    borderRadius: "5px",
                    border: "none",
                }}
            >
                Upload Image
            </button>

            {/* Results */}
            {results && (
                <div style={{ marginTop: "20px" }}>
                    <h2>Results</h2>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <div>
                            <h3>Base Image</h3>
                            <img
                                src={`data:image/jpeg;base64,${results.baseImage}`}
                                alt="Base"
                                style={{
                                    width: "200px",
                                    height: "200px",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                                }}
                            />
                        </div>
                        <div>
                            <h3>Image with Hole</h3>
                            <img
                                src={`data:image/jpeg;base64,${results.imageWithHole}`}
                                alt="With Hole"
                                style={{
                                    width: "200px",
                                    height: "200px",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                                }}
                            />
                        </div>
                        <div>
                            <h3>Prediction</h3>
                            <img
                                src={`data:image/jpeg;base64,${results.prediction}`}
                                alt="Prediction"
                                style={{
                                    width: "200px",
                                    height: "200px",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default WebcamCapture;
