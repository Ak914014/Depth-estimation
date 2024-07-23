import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [depthImage, setDepthImage] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('http://localhost:5000/estimate-depth', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { depthData, shape } = response.data;
            const depthImage = createDepthImage(depthData, shape);
            setDepthImage(depthImage);
        } catch (err) {
            console.error('Error estimating depth:', err);
        }
    };

    const createDepthImage = (depthData, shape) => {
        const width = shape[1];
        const height = shape[0];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);

        // Normalize the depth data to the range [0, 255]
        const minDepth = Math.min(...depthData);
        const maxDepth = Math.max(...depthData);

        for (let i = 0; i < depthData.length; i++) {
            const normalizedValue = ((depthData[i] - minDepth) / (maxDepth - minDepth)) * 255;
            const index = i * 4;
            imageData.data[index] = normalizedValue;
            imageData.data[index + 1] = normalizedValue;
            imageData.data[index + 2] = normalizedValue;
            imageData.data[index + 3] = 255; // Alpha channel
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
    };

    return (
        <div>
            <h1>Depth Estimation</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Estimate Depth</button>
            </form>
            {depthImage && (
                <div>
                    <h2>Result:</h2>
                    <img src={depthImage} alt="Depth Estimation" />
                </div>
            )}
        </div>
    );
};

export default App;
