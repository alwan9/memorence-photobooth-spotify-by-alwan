// dark mode langsung
document.documentElement.classList.add("dark");
// camera
let video = document.getElementById("video");
let timerDisplay = document.getElementById("timer");
const timeSelect = document.getElementById("timeSelect");
const cameraSelect = document.getElementById("cameraSelect");
let currentStream = null;
let isMirrored = true;
let countdown; // supaya bisa clearInterval kalau pilih baru
let selectedTime = 1; // default 1 detik, seperti awal

function toggleMirrorVideo() {
    isMirrored = !isMirrored;
    if (video) {
        video.style.transform = isMirrored ? "scaleX(-1)" : "scaleX(1)";
    }
}

//  agar format nama download menggunakan tanggah hari ini
let d = new Date();
let dateStr = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;


// foto menjadi full screen
const canvases = document.querySelectorAll('#template1 canvas');
const overlay = document.getElementById('fullscreenOverlay');
const fullscreenCanvas = document.getElementById('fullscreenCanvas');
const ctx = fullscreenCanvas.getContext('2d');

canvases.forEach(canvas => {
    canvas.addEventListener('click', () => {
        // Sesuaikan ukuran canvas overlay
        fullscreenCanvas.width = canvas.width;
        fullscreenCanvas.height = canvas.height;

        // Gambar ulang isi canvas ke fullscreenCanvas
        ctx.clearRect(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        overlay.classList.remove('hidden');
    });
});

// Klik overlay untuk keluar
overlay.addEventListener('click', () => {
    overlay.classList.add('hidden');
});



// ambil elemen
const colorStart = document.getElementById('colorStart');
const colorEnd = document.getElementById('colorEnd');
const photoArea1 = document.getElementById('template1');
const photoArea2 = document.getElementById('template2');
const photoArea3 = document.getElementById('template3');
const photoArea4 = document.getElementById('template4');

// warna default
const defaultStart = '#474747';
const defaultEnd = '#1d1c1d';

// fungsi update gradasi
function updateGradient() {
    const start = colorStart.value;
    const end = colorEnd.value;
    photoArea1.style.backgroundImage = `linear-gradient(to right, ${start}, ${end})`;
    photoArea2.style.backgroundImage = `linear-gradient(to right, ${start}, ${end})`;
    photoArea3.style.backgroundImage = `linear-gradient(to right, ${start}, ${end})`;
    photoArea4.style.backgroundImage = `linear-gradient(to right, ${start}, ${end})`;
}

// fungsi reset gradasi
function resetGradient() {
    colorStart.value = defaultStart;
    colorEnd.value = defaultEnd;
    photoArea1.style.backgroundImage = `linear-gradient(to right, ${defaultStart}, ${defaultEnd})`;
    photoArea2.style.backgroundImage = `linear-gradient(to right, ${defaultStart}, ${defaultEnd})`;
    photoArea3.style.backgroundImage = `linear-gradient(to right, ${defaultStart}, ${defaultEnd})`;
    photoArea4.style.backgroundImage = `linear-gradient(to right, ${defaultStart}, ${defaultEnd})`;
}

// pas input warna berubah, update gradasi
colorStart.addEventListener('input', updateGradient);
colorEnd.addEventListener('input', updateGradient);

// set default gradasi saat halaman load
window.addEventListener('DOMContentLoaded', resetGradient);


let canvasList = [
    document.getElementById("canvas1"),
    document.getElementById("canvas2"),
    document.getElementById("canvas3"),
    document.getElementById("canvas4"),
    document.getElementById("canvas5"),
    document.getElementById("canvas6"),
    document.getElementById("canvas7"), // canvas tambahan untuk template 4
    document.getElementById("canvas8")
];
let retakeButtons = document.querySelectorAll(".retake-btn");
let photoTaken = Array(8).fill(false);
let photoCount = 0;

document.addEventListener("DOMContentLoaded", () => {
    startCamera();
});

function toggleDslrHelp() {
    const modal = document.getElementById("dslrHelpModal");
    if (modal) {
        modal.classList.toggle("hidden");
    }
}

function toggleDebugModal() {
    const modal = document.getElementById("debugModal");
    if (modal) {
        modal.classList.toggle("hidden");
        if (!modal.classList.contains("hidden")) {
            runCameraDiagnostics();
        }
    }
}

function copyDebugLog() {
    const debugOutput = document.getElementById("debugLogOutput");
    if (!debugOutput) return;
    const text = debugOutput.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert("Hasil log diagnosa berhasil disalin!");
        }).catch(() => {
            alert("Gagal menyalin log.");
        });
    } else {
        alert("Clipboard tidak didukung di browser ini.");
    }
}

async function runCameraDiagnostics() {
    const debugOutput = document.getElementById("debugLogOutput");
    if (!debugOutput) return;

    debugOutput.innerHTML = "<div>Memeriksa sistem kamera dan koneksi perangkat...</div>";
    let logs = [];

    const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iPhone/.test(navigator.userAgent);

    logs.push(`📱 <strong>Perangkat:</strong> ${isIPad ? "iPad" : isIPhone ? "iPhone" : "Komputer / Android"}`);
    logs.push(`🌐 <strong>Browser:</strong> ${navigator.userAgent.slice(0, 100)}...`);
    logs.push(`🔒 <strong>Protokol:</strong> ${window.location.protocol} (Kamera wajib diakses via HTTPS)`);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logs.push(`<div class="text-red-500 font-bold">❌ FATAL: Browser Anda tidak mendukung WebRTC navigator.mediaDevices.</div>`);
        debugOutput.innerHTML = logs.map(l => `<div class="mb-1">${l}</div>`).join("");
        return;
    }

    try {
        logs.push(`⏳ Menguji izin akses kamera...`);
        // Buka stream awal untuk memastikan permission aktif
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
        logs.push(`✅ Izin kamera di Safari/Browser: <span class="text-green-500 font-bold">DIIZINKAN</span>`);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");

        logs.push(`📷 Total kamera terdeteksi di iPad: <strong>${videoDevices.length} kamera</strong>`);

        videoDevices.forEach((d, i) => {
            let label = d.label || `(Label kamera disembunyikan browser)`;
            logs.push(`   [Kamera ${i + 1}] Nama: <strong>"${label}"</strong>`);
        });

        if (videoDevices.length <= 2) {
            logs.push(`<div class="mt-2 p-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded border border-red-500/30">
                <strong>⚠️ MASALAH UTAMA:</strong><br>
                iPad hanya mendeteksi <strong>${videoDevices.length} kamera</strong> (Hanya kamera depan & belakang bawaan iPad).<br>
                <strong>Capture Card / Sony A6400 sama sekali BELUM TERBACA oleh sistem iPadOS.</strong><br><br>
                <strong>Penyebab & Solusi:</strong><br>
                1. <strong>Salah Lubang Colokan:</strong> Kamera Sony A6400 memiliki 2 lubang di samping. Lubang atas adalah <em>Micro-USB</em> (charger), lubang bawah adalah <em>Micro-HDMI</em>. Kabel WAJIB dicolok ke <strong>lubang bawah (Micro-HDMI)</strong>.<br>
                2. <strong>Adapter Type-C iPad:</strong> Jika Anda memakai adapter USB-A ke Type-C, pastikan adapter tersebut mendukung <strong>jalur data OTG</strong> (bukan kabel charger biasa).<br>
                3. <strong>Versi iPadOS:</strong> Pastikan iPad Anda sudah menjalankan <strong>iPadOS 17 ke atas</strong> di <em>Pengaturan > Umum > Mengenai</em>.<br>
                4. <strong>Resolusi Sony:</strong> Di menu Sony A6400, buka <em>Setup > HDMI Settings</em>, ubah <em>HDMI Resolution</em> ke <strong>1080p</strong> (jangan 4K/2160p).
            </div>`);
        } else {
            logs.push(`<div class="mt-2 p-2 bg-green-500/20 text-green-600 dark:text-green-400 rounded border border-green-500/30">
                <strong>✅ Capture Card / Kamera Eksternal TERDETEKSI (Kamera ke-3)!</strong><br>
                Mencoba menguji koneksi langsung ke kamera eksternal...
            </div>`);

            // Cari kamera eksternal
            const extDev = videoDevices.find((d, idx) => {
                const l = (d.label || "").toLowerCase();
                return l.includes("usb") || l.includes("capture") || l.includes("hdmi") || l.includes("cam") || l.includes("external") || idx >= 2;
            }) || videoDevices[videoDevices.length - 1];

            try {
                const extStream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: extDev.deviceId } }
                });
                const track = extStream.getVideoTracks()[0];
                const settings = track.getSettings ? track.getSettings() : {};
                logs.push(`<div class="p-2 bg-green-600 text-white rounded font-bold">
                    🎉 SUKSES! Kamera Sony A6400 berhasil dibuka!<br>
                    Resolusi: ${settings.width || 1920} x ${settings.height || 1080}
                </div>`);

                // Alihkan langsung ke video utama
                if (currentStream) {
                    currentStream.getTracks().forEach(t => t.stop());
                }
                currentStream = extStream;
                video.srcObject = extStream;
                safePlayVideo(video);
                testStream.getTracks().forEach(t => t.stop());

                const statusEl = document.getElementById("cameraStatus");
                if (statusEl) {
                    statusEl.innerHTML = `<span class="text-green-600 dark:text-green-400 font-bold">Aktif: ${track.label || "Sony A6400 (Capture Card)"}</span>`;
                }
            } catch (extErr) {
                logs.push(`<div class="mt-2 p-2 bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 rounded border border-yellow-500/30">
                    <strong>⚠️ Capture Card terdeteksi tapi gagal dibuka:</strong><br>
                    Error: <code>${extErr.name} - ${extErr.message}</code><br><br>
                    <strong>Solusi:</strong><br>
                    ${extErr.name === "NotReadableError" || extErr.name === "TrackStartError" 
                        ? "• Kamera eksternal sedang dipakai/terkunci oleh aplikasi lain (seperti FaceTime, Photo Booth, atau Camo). <strong>Buka App Switcher iPad lalu tutup semua aplikasi lain!</strong>" 
                        : "• Pastikan kamera Sony dalam keadaan ON dan Live View aktif di mode Movie/Manual."}
                </div>`);
            }
        }
    } catch (err) {
        logs.push(`<div class="mt-2 p-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded border border-red-500/30">
            <strong>❌ Gagal meminta izin kamera:</strong> <code>${err.name} - ${err.message}</code><br>
            ${err.name === "NotAllowedError" ? "Izin kamera ditolak di Safari. Buka Pengaturan iPad > Safari > Kamera > Izinkan." : ""}
        </div>`);
    }

    debugOutput.innerHTML = logs.map(l => `<div class="mb-1">${l}</div>`).join("");
}

function safePlayVideo(el) {
    if (!el) return;
    try {
        const p = el.play();
        if (p !== undefined && typeof p.catch === "function") {
            p.catch(err => {
                if (err.name !== "AbortError") {
                    console.warn("Video play error:", err);
                }
            });
        }
    } catch (e) {
        if (e.name !== "AbortError") {
            console.warn("Video play sync error:", e);
        }
    }
}

async function refreshCameras() {
    const scanBtn = document.getElementById("scanCameraBtn");
    const statusEl = document.getElementById("cameraStatus");
    if (scanBtn) {
        scanBtn.disabled = true;
        scanBtn.classList.add("opacity-50");
    }
    if (statusEl) {
        statusEl.innerText = "Memindai ulang perangkat kamera...";
    }

    await loadCameraDevices(true);

    if (scanBtn) {
        scanBtn.disabled = false;
        scanBtn.classList.remove("opacity-50");
    }
}

async function loadCameraDevices(forceRequest = false) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn("enumerateDevices tidak didukung pada browser ini.");
        return;
    }

    try {
        if (forceRequest) {
            // Minta akses kamera secara umum untuk memastikan permission UVC/USB terbuka di browser
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "external" } }
                });
                if (currentStream) {
                    currentStream.getTracks().forEach(t => t.stop());
                }
                currentStream = tempStream;
                video.srcObject = tempStream;
                safePlayVideo(video);
            } catch (err) {
                console.log("Percobaan buka external camera saat scan:", err);
            }
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");

        if (cameraSelect) {
            const previousSelected = cameraSelect.value;
            cameraSelect.innerHTML = "";

            // Opsi khusus deteksi paksa eksternal
            const extOpt = document.createElement("option");
            extOpt.value = "__external__";
            extOpt.text = "[Eksternal] Hubungkan Kamera (OTG / USB / DSLR)";
            cameraSelect.appendChild(extOpt);

            if (videoDevices.length === 0) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.text = "Tidak ada kamera terdeteksi";
                cameraSelect.appendChild(opt);
                return;
            }

            let externalFound = false;

            videoDevices.forEach((device, index) => {
                const opt = document.createElement("option");
                opt.value = device.deviceId;

                let rawLabel = (device.label || "").toLowerCase();
                let displayLabel = device.label;

                // Pada iPad / mobile: index >= 2 adalah perangkat kamera eksternal (karena bawaan hanya ada 2 kamera: depan dan belakang)
                if (rawLabel.includes("external") || rawLabel.includes("usb") || rawLabel.includes("uvc") || rawLabel.includes("capture") || rawLabel.includes("cam link") || rawLabel.includes("hdmi") || index >= 2) {
                    displayLabel = `[DSLR / Eksternal] ${device.label || `Kamera Eksternal ${index - 1}`}`;
                    externalFound = true;
                } else if (rawLabel.includes("front") || rawLabel.includes("depan") || index === 0) {
                    displayLabel = `[Kamera Depan] ${device.label || "Kamera Depan"}`;
                } else if (rawLabel.includes("back") || rawLabel.includes("belakang") || rawLabel.includes("0, facing back") || index === 1) {
                    displayLabel = `[Kamera Belakang] ${device.label || "Kamera Belakang"}`;
                } else if (!displayLabel) {
                    displayLabel = `Kamera ${index + 1} (Klik untuk Mencoba)`;
                }

                opt.text = displayLabel;
                cameraSelect.appendChild(opt);
            });

            // Status info kamera
            const cameraStatusEl = document.getElementById("cameraStatus");
            if (cameraStatusEl && !cameraStatusEl.innerText.includes("Aktif:")) {
                if (externalFound) {
                    cameraStatusEl.innerText = `Kamera Eksternal / Capture Card terdeteksi! (${videoDevices.length} kamera tersedia)`;
                } else {
                    cameraStatusEl.innerText = `Hanya ${videoDevices.length} kamera internal terdeteksi. Hubungkan capture card lalu klik Scan.`;
                }
            }

            // Pertahankan pilihan jika masih ada di daftar perangkat
            if (previousSelected && (previousSelected === "__external__" || videoDevices.some(d => d.deviceId === previousSelected))) {
                cameraSelect.value = previousSelected;
            } else if (currentStream) {
                const videoTrack = currentStream.getVideoTracks()[0];
                if (videoTrack && videoTrack.getSettings) {
                    const settings = videoTrack.getSettings();
                    if (settings && settings.deviceId) {
                        cameraSelect.value = settings.deviceId;
                    }
                }
            }
        }
    } catch (error) {
        console.error("Gagal mendapatkan daftar kamera:", error);
    }
}

async function startCamera(deviceId = null) {
    const statusEl = document.getElementById("cameraStatus");
    let targetDeviceId = deviceId !== null ? deviceId : (cameraSelect && cameraSelect.value ? cameraSelect.value : null);

    // Jika user memilih opsi "[Eksternal]", otomatis cari deviceId dari kamera eksternal di daftar
    if (targetDeviceId === "__external__") {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const vDevs = devices.filter(d => d.kind === "videoinput");
            const extCandidate = vDevs.find((d, idx) => {
                const l = (d.label || "").toLowerCase();
                return l.includes("external") || l.includes("usb") || l.includes("uvc") || l.includes("capture") || l.includes("cam") || l.includes("hdmi") || idx >= 2;
            }) || (vDevs.length > 2 ? vDevs[vDevs.length - 1] : null);

            if (extCandidate && extCandidate.deviceId) {
                targetDeviceId = extCandidate.deviceId;
                if (cameraSelect) cameraSelect.value = targetDeviceId;
            }
        } catch (e) {
            console.log("Error mencari kamera eksternal:", e);
        }
    }

    const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    let constraints = {};

    if (targetDeviceId && targetDeviceId !== "__external__") {
        // Pada iPad / Safari dan external capture cards, gunakan constraint fleksibel agar tidak OverconstrainedError
        constraints = {
            video: isAppleDevice
                ? { deviceId: { exact: targetDeviceId } }
                : {
                    deviceId: { exact: targetDeviceId },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
        };
    } else if (targetDeviceId === "__external__") {
        constraints = {
            video: isAppleDevice
                ? { facingMode: "environment" }
                : { facingMode: { ideal: "external" } }
        };
    } else {
        constraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // Hentikan stream lama HANYA setelah stream baru berhasil dibuka
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        currentStream = stream;
        video.srcObject = stream;
        safePlayVideo(video);
        await loadCameraDevices();
        if (statusEl) {
            const activeTrack = stream.getVideoTracks()[0];
            const trackLabel = activeTrack && activeTrack.label ? activeTrack.label : "Kamera Aktif";
            statusEl.innerHTML = `<span class="text-green-600 dark:text-green-400 font-semibold">Aktif: ${trackLabel}</span>`;
        }
    } catch (error) {
        console.warn("Gagal membuka kamera dengan constraint ideal, mencoba fallback:", error);
        try {
            let fallbackConstraints;
            if (targetDeviceId && targetDeviceId !== "__external__") {
                fallbackConstraints = { video: { deviceId: targetDeviceId } };
            } else {
                fallbackConstraints = { video: true };
            }
            const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            currentStream = stream;
            video.srcObject = stream;
            safePlayVideo(video);
            await loadCameraDevices();
            if (statusEl) {
                const activeTrack = stream.getVideoTracks()[0];
                const trackLabel = activeTrack && activeTrack.label ? activeTrack.label : "Kamera Aktif";
                statusEl.innerHTML = `<span class="text-green-600 dark:text-green-400 font-semibold">Aktif: ${trackLabel}</span>`;
            }
        } catch (err) {
            console.error("Gagal total mengakses kamera:", err);
            let userMsg = "Gagal mengakses kamera pilihan.";
            if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                userMsg = "Kamera eksternal sedang dipakai aplikasi lain di iPad (FaceTime/Photo Booth/Camo). Tutup aplikasi tersebut dari App Switcher!";
            } else if (err.name === "OverconstrainedError") {
                userMsg = "Resolusi kamera tidak cocok dengan Capture Card.";
            } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                userMsg = "Izin kamera ditolak di Safari. Buka Pengaturan iPad > Safari > Kamera > Izinkan.";
            }
            if (statusEl) {
                statusEl.innerHTML = `<span class="text-red-500 font-semibold">${userMsg}</span>`;
            }
            alert(`${userMsg}\n(Detail: ${err.name})`);
        }
    }
}

// Upload foto langsung dari DSLR (kabel OTG / file manager / galeri)
function handleDSLRPhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (photoCount >= 8) {
        alert("Semua slot foto sudah terisi!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            let canvas = canvasList[photoCount];
            let context = canvas.getContext("2d");

            // Set resolusi UHD/2K tetap
            canvas.width = 2560;
            canvas.height = 1440;

            drawImageWithCoverStyle(img, context, canvas);

            retakeButtons[photoCount].classList.remove("hidden");
            photoTaken[photoCount] = true;
            photoCount++;

            if (photoTaken.every(taken => taken)) {
                document.getElementById("downloadAll").classList.remove("hidden");
                document.getElementById("downloadMerged").classList.remove("hidden");
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
}

function drawImageWithCoverStyle(img, context, canvas) {
    const canvasAspect = canvas.width / canvas.height;
    const imgAspect = img.width / img.height;

    let sx, sy, sWidth, sHeight;

    if (imgAspect > canvasAspect) {
        sHeight = img.height;
        sWidth = sHeight * canvasAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = img.width;
        sHeight = sWidth / canvasAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }

    // Foto DSLR tidak perlu di-mirror
    context.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
}

if (cameraSelect) {
    cameraSelect.addEventListener("change", function () {
        if (this.value) {
            startCamera(this.value);
        }
    });
}

// Perbarui daftar saat ada perangkat kamera baru dicolokkan (misal DSLR via capture card / USB OTG)
if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", () => {
        loadCameraDevices();
    });
}


timeSelect.addEventListener("change", function () {
    let value = parseInt(this.value);
    if (!isNaN(value)) {
        selectedTime = value;
    }
});

function startCountdown() {
    if (photoCount >= 8) return;

    let count = selectedTime; // pakai waktu yang dipilih
    timerDisplay.innerText = count;
    let countdown = setInterval(() => {
        count--;
        timerDisplay.innerText = count;
        if (count === 0) {
            clearInterval(countdown);
            timerDisplay.innerText = "";
            takeSnapshot();
        }
    }, 1000);

} function takeSnapshot() {
    if (photoCount >= 8) return;

    let canvas = canvasList[photoCount];
    let context = canvas.getContext("2d");

    // Set resolusi UHD/2K tetap
    canvas.width = 2560;
    canvas.height = 1440;

    drawVideoWithCoverStyle(video, context, canvas);

    retakeButtons[photoCount].classList.remove("hidden");
    photoTaken[photoCount] = true;
    photoCount++;

    if (photoTaken.every(taken => taken)) {
        document.getElementById("downloadAll").classList.remove("hidden");
        document.getElementById("downloadMerged").classList.remove("hidden");
    }
}

function retakePhoto(index) {
    let canvas = canvasList[index];
    let context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    photoTaken[index] = false;

    let count = selectedTime;
    timerDisplay.innerText = count;

    countdown = setInterval(() => {
        count--;
        timerDisplay.innerText = count;
        if (count === 0) {
            clearInterval(countdown);
            timerDisplay.innerText = "";

            canvas.width = 2560;
            canvas.height = 1440;

            drawVideoWithCoverStyle(video, context, canvas);

            retakeButtons[index].classList.remove("hidden");
            photoTaken[index] = true;

            if (photoTaken.every(taken => taken)) {
                document.getElementById("downloadAll").classList.remove("hidden");
                document.getElementById("downloadMerged").classList.remove("hidden");
            }
        }
    }, 1000);
}
function drawVideoWithCoverStyle(video, context, canvas) {
    const canvasAspect = canvas.width / canvas.height;
    const videoAspect = video.videoWidth / video.videoHeight;

    let sx, sy, sWidth, sHeight;

    if (videoAspect > canvasAspect) {
        // Video terlalu lebar → crop kiri/kanan
        sHeight = video.videoHeight;
        sWidth = sHeight * canvasAspect;
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
    } else {
        // Video terlalu tinggi → crop atas/bawah
        sWidth = video.videoWidth;
        sHeight = sWidth / canvasAspect;
        sx = 0;
        sy = (video.videoHeight - sHeight) / 2;
    }

    context.save();
    if (isMirrored) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
    }
    context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    context.restore();
}


function downloadMergedPhoto() {
    let canvases = document.querySelectorAll("#photo-container canvas");

    if (canvases.length === 0) {
        alert("Tidak ada foto yang bisa didownload!");
        return;
    }

    let canvasWidth = canvases[0].width;
    let canvasHeight = canvases[0].height;
    let cols = Math.ceil(Math.sqrt(canvases.length));
    let rows = Math.ceil(canvases.length / cols);
    let mergedCanvas = document.createElement("canvas");
    let ctx = mergedCanvas.getContext("2d");

    mergedCanvas.width = cols * canvasWidth;
    mergedCanvas.height = rows * canvasHeight;

    canvases.forEach((canvas, i) => {
        let x = (i % cols) * canvasWidth;
        let y = Math.floor(i / cols) * canvasHeight;
        ctx.drawImage(canvas, x, y, canvasWidth, canvasHeight);
    });

    let dateStr = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    let link = document.createElement("a");
    link.href = mergedCanvas.toDataURL("image/png");
    link.download = `foto_gabungan-${dateStr}.png`;
    link.click();
}


document.getElementById("templateSelector").addEventListener("change", function () {
    let selectedTemplate = this.value;

    // Sembunyikan semua elemen yang terkait dengan photobooth
    document.querySelectorAll(".template").forEach(template => {
        template.classList.add("hidden");
    });

    // Jika opsi "1" dipilih, sembunyikan semua elemen
    // Jika opsi "1" dipilih, sembunyikan semua elemen
    if (selectedTemplate === "1") {
        document.getElementById("photo-container").classList.add("hidden");
    } else if (selectedTemplate === "template3") {
        // Jika template3 dipilih, sinkronkan konten kanvas
        syncCanvasContent("canvas1", "canvas1_copy");
        syncCanvasContent("canvas2", "canvas2_copy");
        syncCanvasContent("canvas3", "canvas3_copy");
        syncCanvasContent("canvas4", "canvas4_copy");
        syncCanvasContent("canvas5", "canvas5_copy");
        syncCanvasContent("canvas6", "canvas6_copy");
    } else {
        // Jika opsi lain dipilih, tampilkan template sesuai pilihan
        document.getElementById(selectedTemplate).classList.remove("hidden");
        document.getElementById("photo-container").classList.remove("hidden");
    }


});


function downloadSelectedTemplate() {
    const selectedTemplateId = document.getElementById("templateSelector").value;
    const selectedTemplate = document.getElementById(selectedTemplateId);

    if (!selectedTemplate) {
        alert("Template tidak ditemukan!");
        return;
    }

    // Sembunyikan elemen yang tidak perlu terlihat
    const excludedElements = selectedTemplate.querySelectorAll(".no-capture, .upload-btn, label[for]");
    excludedElements.forEach(el => el.style.display = "none");

    // Tangani canvas agar tidak membesar berlebihan → batasi max-width
    const canvases = selectedTemplate.querySelectorAll("canvas");
    const originalCanvasStyles = [];

  canvases.forEach((canvas, i) => {
    originalCanvasStyles[i] = {
        width: canvas.style.width,
        height: canvas.style.height,
        maxWidth: canvas.style.maxWidth
    };

    // Hanya ubah ukuran jika template bukan 2 atau 4
    if (selectedTemplateId !== "template2" && selectedTemplateId !== "template4") {
        canvas.style.width = "512px";
        canvas.style.height = "300px";
        canvas.style.maxWidth = "600px";
    }
});

    

    html2canvas(selectedTemplate, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
        scrollX: 0,
        scrollY: -window.scrollY
    }).then(canvas => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `template_${selectedTemplateId}-${dateStr}.png`;
        link.click();

        // Kembalikan style canvas seperti semula
        canvases.forEach((canvas, i) => {
            canvas.style.width = originalCanvasStyles[i].width;
            canvas.style.height = originalCanvasStyles[i].height;
            canvas.style.maxWidth = originalCanvasStyles[i].maxWidth;
        });

        excludedElements.forEach(el => el.style.display = "");
    });
}




function syncCanvasContent(sourceId, targetId) {
    const sourceCanvas = document.getElementById(sourceId);
    const targetCanvas = document.getElementById(targetId);

    if (!sourceCanvas || !targetCanvas) return;

    targetCanvas.width = sourceCanvas.width;
    targetCanvas.height = sourceCanvas.height;

    const sourceCtx = sourceCanvas.getContext('2d');
    const targetCtx = targetCanvas.getContext('2d');

    const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    targetCtx.putImageData(imageData, 0, 0);
}

document.getElementById("templateSelector").addEventListener("change", function () {
    let selectedTemplate = this.value;

    // Sembunyikan semua template
    document.querySelectorAll(".template").forEach(template => {
        template.classList.add("hidden");
    });

    // Sinkronisasi canvas jika pindah template
    if (selectedTemplate === "template1") {
        syncCanvasContent("canvas1_copy", "canvas1");
        syncCanvasContent("canvas2_copy", "canvas2");
        syncCanvasContent("canvas3_copy", "canvas3");
        syncCanvasContent("canvas4_copy", "canvas4");
    } else if (selectedTemplate === "template2") {
        syncCanvasContent("canvas1", "canvas1_copy");
        syncCanvasContent("canvas2", "canvas2_copy");
        syncCanvasContent("canvas3", "canvas3_copy");
        syncCanvasContent("canvas4", "canvas4_copy");
    } else if (selectedTemplate === "template3") {
        syncCanvasContent("canvas1", "canvas3_only");
    } else if (selectedTemplate === "template4") {
        syncCanvasContent("canvas1", "canvas5_copy");
        syncCanvasContent("canvas2", "canvas6_copy");
        syncCanvasContent("canvas3", "canvas7_copy");
        syncCanvasContent("canvas4", "canvas8_copy");
        // Tambahkan sesuai jumlah
    }
    // Tampilkan template yang dipilih
    document.getElementById(selectedTemplate).classList.remove("hidden");
});



// tanggalan otomatis di template
const tanggalElemen = document.getElementById("tanggal");

const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const sekarang = new Date();
const hari = namaHari[sekarang.getDay()];
const tanggal = sekarang.getDate();
const bulan = namaBulan[sekarang.getMonth()];
const tahun = sekarang.getFullYear();

tanggalElemen.innerText = `${hari}, ${tanggal} ${bulan} ${tahun}`;


// fitur tambah file dari internal
function uploadToCanvas(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const canvas = canvasList[index];
    const context = canvas.getContext("2d");

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            canvas.width = 2560;
            canvas.height = 1440;

            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;

            let sx, sy, sWidth, sHeight;

            if (imgAspect > canvasAspect) {
                sHeight = img.height;
                sWidth = sHeight * canvasAspect;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = img.width;
                sHeight = sWidth / canvasAspect;
                sx = 0;
                sy = (img.height - sHeight) / 2;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

            retakeButtons[index].classList.remove("hidden");
            photoTaken[index] = true;

            if (photoTaken.every(taken => taken)) {
                document.getElementById("downloadAll")?.classList.remove("hidden");
                document.getElementById("downloadMerged")?.classList.remove("hidden");
            }

            // Sinkronisasi ke canvas template lain
            if (document.getElementById("templateSelector").value === "template1") {
                syncCanvasContent(`canvas${index + 1}`, `canvas${index + 1}_copy`);
            } else {
                syncCanvasContent(`canvas${index + 1}_copy`, `canvas${index + 1}`);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}



// fitur cetak 
function printTemplate() {
    const selectedTemplateId = document.getElementById("templateSelector").value;
    const selectedTemplate = document.getElementById(selectedTemplateId);

    // Sembunyikan elemen no-capture sementara
    const hiddenEls = selectedTemplate.querySelectorAll(".no-capture");
    hiddenEls.forEach(el => el.style.display = "none");

    html2canvas(selectedTemplate, {
        useCORS: true,
        backgroundColor: null,
        scale: 1
    }).then(canvas => {
        const dataURL = canvas.toDataURL("image/png");

        // Buat jendela print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Cetak Template</title>
                <style>
                    body {
                        margin: 0;
                        padding-top: 0 ;
                        padding-left: 15%;
                        padding-right: 15%;
                        text-align: center;
                        background: #fff;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    .container {
                        display: grid;
                        grid-template-columns: repeat(4, 30%); /* Dua gambar per baris */
                        grid-template-rows: repeat(4, auto); /* Dua baris */
                        gap: 10px;
                        justify-content: center;
                        align-items: center;
                        margin-top: 10px;
                         
                    }
                    img {
                     rotate: 90%;
                        width: 100%;
                        height: auto;
                   
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="${dataURL}" />
                    <img src="${dataURL}" />
                    <img src="${dataURL}" />
                    <img src="${dataURL}" />
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);

        // Tampilkan kembali elemen tersembunyi
        hiddenEls.forEach(el => el.style.display = "");
    });
}

// fitur darkmode
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
}

//   fungsi uploadToCanvasById 
function uploadToCanvasById(event, canvasId) {
    if (!event || !event.target || !event.target.files) return;
    const file = event.target.files[0];
    if (!file) return;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const context = canvas.getContext("2d");

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // canvas.width = 2560;
            // canvas.height = 1440;

            canvas.width = 1080;    // potret
            canvas.height = 1440;


            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;

            let sx, sy, sWidth, sHeight;

            if (imgAspect > canvasAspect) {
                sHeight = img.height;
                sWidth = sHeight * canvasAspect;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = img.width;
                sHeight = sWidth / canvasAspect;
                sx = 0;
                sy = (img.height - sHeight) / 2;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}


