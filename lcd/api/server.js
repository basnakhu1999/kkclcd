const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// ใช้ JSON ไฟล์เก็บข้อมูลไฟล์
const dataFile = './api/data.json';
let fileData = JSON.parse(fs.readFileSync(dataFile));

// ตั้งค่าโฟลเดอร์อัปโหลด
const uploadDir = './uploads/';
const upload = multer({ dest: uploadDir });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadDir)); // ให้โหลดไฟล์ในโฟลเดอร์ uploads ได้

// API: ดึงรายการไฟล์
app.get('/api/getFiles', (req, res) => {
    res.json(fileData);
});

// API: อัปโหลดไฟล์
app.post('/api/upload', upload.single('file'), (req, res) => {
    const { originalname, filename } = req.file;
    const filePath = `${uploadDir}${originalname}`;
    fs.renameSync(`${uploadDir}${filename}`, filePath); // เปลี่ยนชื่อไฟล์ให้เหมือนต้นฉบับ
    fileData.push({ name: originalname, duration: 5 });
    fs.writeFileSync(dataFile, JSON.stringify(fileData));
    res.send('File uploaded successfully!');
});

// API: ลบไฟล์
app.delete('/api/delete/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = `${uploadDir}${fileName}`;
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // ลบไฟล์ในระบบ
        fileData = fileData.filter(file => file.name !== fileName); // ลบจาก JSON
        fs.writeFileSync(dataFile, JSON.stringify(fileData));
        res.send('File deleted successfully.');
    } else {
        res.status(404).send('File not found.');
    }
});

// API: อัปเดตระยะเวลา
app.put('/api/updateDuration', (req, res) => {
    const { index, duration } = req.body;
    if (fileData[index]) {
        fileData[index].duration = duration;
        fs.writeFileSync(dataFile, JSON.stringify(fileData));
        res.send('Duration updated.');
    } else {
        res.status(400).send('Invalid index.');
    }
});

// API: เปลี่ยนลำดับไฟล์
app.put('/api/move', (req, res) => {
    const { index, direction } = req.body;
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < fileData.length - 1)) {
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [fileData[index], fileData[swapIndex]] = [fileData[swapIndex], fileData[index]]; // สลับตำแหน่ง
        fs.writeFileSync(dataFile, JSON.stringify(fileData));
        res.send('File reordered.');
    } else {
        res.status(400).send('Invalid move.');
    }
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
