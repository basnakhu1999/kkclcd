// script.js
const SUPABASE_URL = 'https://qizejcrlxqailqjrqkeo.supabase.co';  // เปลี่ยนเป็น URL ของโปรเจคคุณ
const SUPABASE_KEY = 'your-anon-key';  // เปลี่ยนเป็น Key ของโปรเจคคุณ

// สร้างตัวเชื่อมต่อกับ Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchImages() {
    try {
        // ดึงรายการไฟล์จาก Supabase Storage
        const { data, error } = await supabase.storage.from('restaurant-files').list('uploads', {
            // เพิ่มตัวเลือกเพื่อดึงข้อมูลไฟล์ที่มีการตั้งค่า public URL
            limit: 10,
            offset: 0
        });

        if (error) {
            throw error;
        }

        if (data.length === 0) {
            document.getElementById('image-container').innerHTML = 'No images found.';
            return;
        }

        // แสดงผลไฟล์ที่ดึงมา
        const imageContainer = document.getElementById('image-container');
        imageContainer.innerHTML = '';  // ล้างคอนเทนต์เก่า

        data.forEach(file => {
            // สร้าง URL ของไฟล์ที่อัปโหลด
            const { publicURL, error } = supabase.storage.from('restaurant-files').getPublicUrl(file.name);

            if (error) {
                console.error('Error generating public URL:', error.message);
                return;
            }

            // สร้าง element เพื่อแสดงรูปภาพ
            const imgElement = document.createElement('img');
            imgElement.src = publicURL;
            imgElement.alt = file.name;
            imgElement.style.maxWidth = '100%'; // จำกัดขนาดรูป
            imgElement.style.marginBottom = '10px';
            
            // เพิ่มภาพที่แสดงลงใน container
            imageContainer.appendChild(imgElement);
        });
    } catch (error) {
        console.error('Error fetching images:', error.message);
    }
}

// เรียกใช้ฟังก์ชันเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    fetchImages();
});
