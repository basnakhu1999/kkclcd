import { supabase } from './supabaseClient.js';

// ฟังก์ชันสำหรับการอัปโหลดไฟล์
async function uploadFileHandler() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    const publicURL = await uploadFile(file);
    if (publicURL) {
        alert('File uploaded successfully! URL: ' + publicURL);
        updateFileList(); // อัปเดตรายการไฟล์
    }
}

// ฟังก์ชันสำหรับอัปโหลดไฟล์ไปที่ Supabase
async function uploadFile(file) {
    const filePath = `uploads/${file.name}`;
    const { data, error } = await supabase.storage
        .from('restaurant-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Error uploading file:', error.message);
        alert('Upload failed: ' + error.message);
        return null;
    }

    const { publicURL } = supabase.storage
        .from('restaurant-files')
        .getPublicUrl(filePath);

    return publicURL;
}

// ฟังก์ชันสำหรับการอ่านไฟล์ save.json
async function readSaveFile() {
    const { data, error } = await supabase.storage
        .from('restaurant-files')
        .download('save.json');

    if (error) {
        console.error('Error reading save.json:', error.message);
        return [];
    }

    const text = await data.text();
    return JSON.parse(text);
}

// ฟังก์ชันสำหรับการเขียนข้อมูลลงใน save.json
async function writeSaveFile(data) {
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const { error } = await supabase.storage
        .from('restaurant-files')
        .upload('save.json', jsonBlob, { upsert: true });

    if (error) {
        console.error('Error writing save.json:', error.message);
        return false;
    }
    console.log('save.json updated successfully');
    return true;
}

// ฟังก์ชันในการแสดงรายการไฟล์
async function updateFileList() {
    const { data, error } = await supabase.storage
        .from('restaurant-files')
        .list('uploads');

    if (error) {
        console.error('Error fetching files:', error.message);
        return;
    }

    const fileListDiv = document.getElementById('file-list');
    fileListDiv.innerHTML = ''; // Clear the list

    data.forEach(file => {
        const fileElement = document.createElement('div');
        const fileURL = supabase.storage
            .from('restaurant-files')
            .getPublicUrl(file.name).publicURL;

        fileElement.innerHTML = `<a href="${fileURL}" target="_blank">${file.name}</a>`;
        fileListDiv.appendChild(fileElement);
    });
}

// เรียกใช้ฟังก์ชันเพื่ออัปเดตรายการไฟล์เมื่อหน้าโหลด
document.addEventListener('DOMContentLoaded', () => {
    updateFileList();
});
