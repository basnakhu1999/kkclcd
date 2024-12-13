<?php
$dataFile = 'data.json';
$data = json_decode(file_get_contents($dataFile), true);

// จัดการคำขอ
if (isset($_GET['action'])) {
    $action = $_GET['action'];

    // ดึงรายการไฟล์
    if ($action === 'getFiles') {
        echo json_encode($data);
        exit;

    // อัปโหลดไฟล์
    } elseif ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $targetDir = "uploads/";
        $targetFile = $targetDir . basename($_FILES["file"]["name"]);

        if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
            $data[] = ["name" => basename($_FILES["file"]["name"]), "duration" => 5];
            file_put_contents($dataFile, json_encode($data));
            echo "File uploaded successfully!";
        } else {
            echo "Error uploading file.";
        }
        exit;

    // ลบไฟล์
    } elseif ($action === 'delete' && isset($_GET['file'])) {
        $fileName = basename($_GET['file']);
        $filePath = "uploads/" . $fileName;

        if (file_exists($filePath)) {
            unlink($filePath);
            $data = array_filter($data, fn($file) => $file['name'] !== $fileName);
            file_put_contents($dataFile, json_encode(array_values($data)));
            echo "File deleted successfully.";
        } else {
            echo "File not found.";
        }
        exit;

    // อัปเดตระยะเวลา
    } elseif ($action === 'updateDuration' && isset($_GET['index'], $_GET['duration'])) {
        $index = intval($_GET['index']);
        $duration = intval($_GET['duration']);
        if (isset($data[$index])) {
            $data[$index]['duration'] = $duration;
            file_put_contents($dataFile, json_encode($data));
            echo "Duration updated.";
        }
        exit;

    // เลื่อนลำดับขึ้น
    } elseif ($action === 'moveUp' && isset($_GET['index'])) {
        $index = intval($_GET['index']);
        if ($index > 0) {
            $temp = $data[$index - 1];
            $data[$index - 1] = $data[$index];
            $data[$index] = $temp;
            file_put_contents($dataFile, json_encode($data));
            echo "Moved up.";
        }
        exit;

    // เลื่อนลำดับลง
    } elseif ($action === 'moveDown' && isset($_GET['index'])) {
        $index = intval($_GET['index']);
        if ($index < count($data) - 1) {
            $temp = $data[$index + 1];
            $data[$index + 1] = $data[$index];
            $data[$index] = $temp;
            file_put_contents($dataFile, json_encode($data));
            echo "Moved down.";
        }
        exit;
    }
}

// ถ้าคำขอไม่ถูกต้อง
http_response_code(400);
echo "Invalid request.";
