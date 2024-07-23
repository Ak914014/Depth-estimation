import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
// import * as tf from '@tensorflow/tfjs-node';
import * as depthEstimation from '@tensorflow-models/depth-estimation';
import * as tf from '@tensorflow/tfjs-node-gpu';
import fs from 'fs';
import sharp from 'sharp';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });
let estimator;

(async () => {
    await tf.setBackend('tensorflow'); // Explicitly set the backend
    await tf.setBackend('cpu'); // Vital to get away with "Kernel Transform Error"
    await tf.ready(); // Ensure the backend is ready
    const model = depthEstimation.SupportedModels.ARPortraitDepth;
    estimator = await depthEstimation.createEstimator(model);
    console.log('Depth estimator model loaded');
})();

app.post('/estimate-depth', upload.single('file'), async (req, res) => {
    if (!estimator) {
        return res.status(500).send('Depth estimator model not loaded');
    }

    try {
        const filePath = path.join(__dirname, req.file.path);
        const imageBuffer = fs.readFileSync(filePath);

        const { data, info } = await sharp(imageBuffer)
            .resize({ width: 256, height: 256 })
            .toColourspace('srgb')
            .raw()
            .toBuffer({ resolveWithObject: true });

        const expectedSize = info.width * info.height * 3; // RGB channels
        if (data.length !== expectedSize) {
            throw new Error(`Data length mismatch: Expected ${expectedSize}, got ${data.length}`);
        }

        const imageTensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);

        const estimationConfig = {
            minDepth: 0,
            maxDepth: 1
        };

        const depthMap = await estimator.estimateDepth(imageTensor, estimationConfig);
        const depthArray = depthMap.depthTensor.dataSync();

        imageTensor.dispose();

        res.json({ depthData: Array.from(depthArray), shape: depthMap.depthTensor.shape });
    } catch (err) {
        console.error('Error estimating depth:', err);
        res.status(500).send('Error estimating depth');
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
