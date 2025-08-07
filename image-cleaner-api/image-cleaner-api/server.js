const express = require('express');
const { createCanvas, loadImage } = require('canvas');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/remove-white', async (req, res) => {
  try {
    const tolerance = req.query.tolerance !== undefined
  ? parseInt(req.query.tolerance)
  : 20;
    const backgroundColors = [
      { r: 255, g: 255, b: 255 },
      { r: 211, g: 211, b: 211 }
    ];

    const base64 = req.body.image;
    if (!base64) return res.status(400).send('Missing image');

    const buffer = Buffer.from(base64, 'base64');
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      for (const bg of backgroundColors) {
        const distance = Math.sqrt(
          Math.pow(r - bg.r, 2) +
          Math.pow(g - bg.g, 2) +
          Math.pow(b - bg.b, 2)
        );

        if (distance < tolerance) {
          data[i + 3] = 0;
          break;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const outputBuffer = canvas.toBuffer('image/png');
    const outputBase64 = outputBuffer.toString('base64');

    res.json({ image: outputBase64 });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error processing image');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});