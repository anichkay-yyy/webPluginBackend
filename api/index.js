const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

let images = [];

// Роут для загрузки изображения
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Изображение обязательно!' });
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Можно загружать только изображения!' });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    images.push({
      id: Date.now().toString(),
      data: base64Image,
      createdAt: new Date().toLocaleString(),
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    res.status(201).json({ 
      success: true, 
      id: images[images.length - 1].id
    });

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление одного изображения
app.delete('/image/:id', (req, res) => {
  images = images.filter(img => img.id !== req.params.id);
  res.json({ success: true });
});

// Удаление всех изображений
app.delete('/images', (req, res) => {
  images = [];
  res.json({ success: true });
});

// Главная страница с галереей
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Галерея изображений</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .controls { margin-bottom: 20px; display: flex; gap: 10px; }
          button { padding: 8px 12px; cursor: pointer; }
          .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
          .image-card { 
            border: 1px solid #ddd; 
            padding: 10px;
            border-radius: 5px;
            background: #f9f9f9;
            position: relative;
          }
          .image-container { height: 200px; overflow: hidden; }
          .image-card img { 
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: zoom-in;
            transition: transform 0.3s;
          }
          .image-card img:hover {
            transform: scale(1.05);
          }
          .meta { 
            margin-top: 8px;
            color: #666;
            font-size: 13px;
          }
          .delete-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            justify-content: center;
            align-items: center;
          }
          .modal-content {
            max-width: 90%;
            max-height: 90%;
          }
          .modal-content img {
            width: 100%;
            height: auto;
          }
          .close-modal {
            position: absolute;
            top: 20px;
            right: 20px;
            color: white;
            font-size: 30px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>Галерея изображений</h1>
        
        <div class="controls">
          <button id="deleteAll">Удалить все</button>
        </div>

        <div class="gallery">
          ${images.map(img => `
            <div class="image-card">
              <button class="delete-btn" data-id="${img.id}">×</button>
              <div class="image-container">
                <img src="${img.data}" alt="${img.originalName}" data-full="${img.data}">
              </div>
              <div class="meta">
                <div><strong>${img.originalName}</strong></div>
                <div>${Math.round(img.size/1024)} KB</div>
                <div>${img.createdAt}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="modal" id="imageModal">
          <span class="close-modal">&times;</span>
          <div class="modal-content">
            <img id="modalImage" src="" alt="">
          </div>
        </div>

        <script>
          // Удаление одной картинки
          document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const id = e.target.getAttribute('data-id');
              try {
                await fetch('/image/' + id, { method: 'DELETE' });
                location.reload();
              } catch (err) {
                console.error('Ошибка удаления:', err);
              }
            });
          });

          // Удаление всех картинок
          document.getElementById('deleteAll').addEventListener('click', async () => {
            if (confirm('Удалить все изображения?')) {
              try {
                await fetch('/images', { method: 'DELETE' });
                location.reload();
              } catch (err) {
                console.error('Ошибка удаления:', err);
              }
            }
          });

          // Просмотр в полном размере
          const modal = document.getElementById('imageModal');
          const modalImg = document.getElementById('modalImage');
          
          document.querySelectorAll('.image-card img').forEach(img => {
            img.addEventListener('click', () => {
              modal.style.display = 'flex';
              modalImg.src = img.getAttribute('data-full');
            });
          });

          document.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
          });

          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.style.display = 'none';
            }
          });
        </script>
      </body>
    </html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
