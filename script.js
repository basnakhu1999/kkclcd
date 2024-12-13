const SUPABASE_URL = 'https://qizejcrlxqailqjrqkeo.supabase.co'; // ใส่ URL โปรเจ็กต์ของคุณ
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpemVqY3JseHFhaWxxanJxa2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzU2MjksImV4cCI6MjA0OTY1MTYyOX0.wN-5phYnElhU7IPQQ6B8jehoJGD89POzJjXMWg511cg'; // ใส่ Anonymous Key ของคุณ
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const bucketName = 'kkclcd'; // ชื่อ Bucket ที่คุณสร้าง

// อัปโหลดไฟล์ไปยัง Supabase
async function uploadFile(file) {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`uploads/${file.name}`, file, { upsert: true });
    if (error) {
        console.error('Error uploading file:', error.message);
        return null;
    }
    return data.path;
}

// ลบไฟล์จาก Supabase
async function deleteFile(filename) {
    const { error } = await supabase.storage
        .from(bucketName)
        .remove([`uploads/${filename}`]);
    if (error) {
        console.error('Error deleting file:', error.message);
        return false;
    }
    return true;
}

// อ่านไฟล์ save.json จาก Supabase
async function readSaveFile() {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .download('save.json');
    if (error) {
        console.error('Error reading save.json:', error.message);
        return [];
    }
    const text = await data.text();
    return JSON.parse(text);
}

// เขียนข้อมูลลงใน save.json บน Supabase
async function writeSaveFile(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const { error } = await supabase.storage
        .from(bucketName)
        .upload('save.json', blob, { upsert: true });
    if (error) {
        console.error('Error writing save.json:', error.message);
        return false;
    }
    return true;
}
