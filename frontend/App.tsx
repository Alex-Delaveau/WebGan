import React from "react";
import WebcamCapture from "./components/Capture";
import dotenv from "dotenv";

dotenv.config();

const App: React.FC = () => {
  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <WebcamCapture />
    </div>
  );
};

export default App;
