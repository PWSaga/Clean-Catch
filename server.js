const express = require('express');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/remove-white', upload.single('image'), async (req, res) => {
  try {
    const tolerance = parseInt(req.query.tolerance) || 70;
    const backgroundColors = [
      { r: 255, g: 255, b: 255 }, // white
      { r: 211, g: 211, b: 211 }  // light gray
    ];

    const img = await loadImage(req.file.buffer);
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
          data[i + 3] = 0; // Make pixel transparent
          break;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');

    res.json({ image: base64 });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error processing image');
  }
});

// ✅ Use dynamic port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});