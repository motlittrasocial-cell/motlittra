// ==========================================
// CẤU HÌNH CƠ BẢN
// ==========================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzleMfwBDcPgClIIZ4eeOPuS0p9qdW2fphUGexZb6PUvroyMp-aD0usHEjsvJoqNf43tQ/exec"; // Nhớ thay link mới nếu bạn đã Deploy lại
const TEA_PRICE = 145000;
const SHIPPING_RATES = {
    "Thành phố Hồ Chí Minh": 0,
    "Thành phố Hà Nội": 0,
    "default": 0
};

// ==========================================
// 1. GIAO DIỆN & CHUYỂN TAB
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
        if(item.getAttribute('onclick').includes(tabId)) item.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tabId === 'upload') checkAutoFill();
}

function copyText(text, label) {
    navigator.clipboard.writeText(text).then(() => showToast(`Đã sao chép ${label}!`, 'success'));
}

function updateFileName(input, textId, defaultText) {
    const textDisplay = document.getElementById(textId);
    if (input.files && input.files[0]) {
        textDisplay.innerText = "Đã chọn: " + input.files[0].name;
        textDisplay.style.color = "#8d6e63"; 
    } else {
        textDisplay.innerText = defaultText;
        textDisplay.style.color = "#5d6d3e"; 
    }
}

let currentSlideIndex = 0;
function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide');
    const track = document.getElementById('slider-track');
    currentSlideIndex += direction;
    if (currentSlideIndex >= slides.length) currentSlideIndex = 0;
    else if (currentSlideIndex < 0) currentSlideIndex = slides.length - 1;
    track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
}

// ==========================================
// 2. LOGIC ĐẶT HÀNG & TÍNH TIỀN
// ==========================================
function changeQty(amount) {
    let qtyInput = document.getElementById('order-qty');
    let currentQty = parseInt(qtyInput.value);
    let newQty = currentQty + amount;
    if (newQty >= 1) {
        qtyInput.value = newQty;
        calculateTotal();
    }
}

document.getElementById('order-sender-name').addEventListener('input', function() {
    if(document.querySelector('input[name="order-purpose"]:checked').value === 'self') {
        document.getElementById('order-receiver-name').value = this.value;
    }
});
document.getElementById('order-sender-phone').addEventListener('input', function() {
    if(document.querySelector('input[name="order-purpose"]:checked').value === 'self') {
        document.getElementById('order-receiver-phone').value = this.value;
    }
    calculateTotal(); 
});

function handlePurposeChange() {
    const purpose = document.querySelector('input[name="order-purpose"]:checked').value;
    const recName = document.getElementById('order-receiver-name');
    const recPhone = document.getElementById('order-receiver-phone');
    const optCod = document.getElementById('opt-cod');
    const audioBox = document.getElementById('audio-option-box');

    if (purpose === 'self') {
        recName.readOnly = true; recPhone.readOnly = true;
        recName.value = document.getElementById('order-sender-name').value;
        recPhone.value = document.getElementById('order-sender-phone').value;
        optCod.style.display = 'block'; 
        audioBox.style.display = 'none'; 
    } else {
        recName.readOnly = false; recPhone.readOnly = false;
        recName.value = ''; recPhone.value = '';
        optCod.style.display = 'none'; 
        document.querySelector('input[name="payment-method"][value="ck"]').checked = true; 
        handlePaymentChange();
        audioBox.style.display = 'block'; 
    }
}

function handlePaymentChange() {
    const method = document.querySelector('input[name="payment-method"]:checked').value;
    document.getElementById('bank-transfer-box').style.display = (method === 'ck') ? 'block' : 'none';
}

function calculateTotal() {
    let qty = parseInt(document.getElementById('order-qty').value);
    let teaTotal = qty * TEA_PRICE;
    let provinceName = document.getElementById('order-province').value;
    let shippingFee = 0;
    
    if (provinceName) {
        let matchedFee = SHIPPING_RATES["default"];
        for (let key in SHIPPING_RATES) {
            if (provinceName.includes(key)) {
                matchedFee = SHIPPING_RATES[key];
                break;
            }
        }
        shippingFee = matchedFee;
        document.getElementById('calc-ship-price').innerText = shippingFee.toLocaleString() + ' đ';
    } else {
        document.getElementById('calc-ship-price').innerText = 'Đang tính...';
    }

    let finalTotal = teaTotal + shippingFee;
    document.getElementById('calc-tea-price').innerText = teaTotal.toLocaleString() + ' đ';
    
    if (provinceName) {
        document.getElementById('calc-total-price').innerText = finalTotal.toLocaleString() + ' VNĐ';
        updateQRCode(finalTotal);
    } else {
        document.getElementById('calc-total-price').innerText = '...';
    }
}

function updateQRCode(amount) {
    const sdt = document.getElementById('order-sender-phone').value || "SDT";
    const ndck = `${sdt}`; 
    document.getElementById('ck-content').innerText = ndck;
    document.getElementById('ck-amount').innerText = amount.toLocaleString();
    const bankBin = "vietcombank"; const stk = "123456789"; const accountName = "TIEM TRA CHAN THANH"; 
    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${stk}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(ndck)}&accountName=${encodeURIComponent(accountName)}`;
    document.getElementById('qr-image').src = qrUrl;
    document.getElementById('download-qr').href = qrUrl;
}

// ==========================================
// 3. CUSTOM DROPDOWN ĐỊA CHỈ & RENDER DATA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const listProv = document.getElementById('list-province');
    if (typeof LOCAL_ADDRESS_DATA !== 'undefined' && listProv) {
        Object.keys(LOCAL_ADDRESS_DATA).forEach(prov => {
            let li = document.createElement('li');
            li.innerText = prov;
            li.onclick = () => selectOption('province', prov);
            listProv.appendChild(li);
        });
    }

    // Gọi hàm nhúng dữ liệu Chính sách vào Modal
    renderPolicy();
});

// Hàm tự động vẽ Chính sách từ file data.js vào Popup
function renderPolicy() {
    const container = document.getElementById('policy-content-container');
    if (!container || typeof POLICY_DATA === 'undefined') return;

    let html = '';
    POLICY_DATA.forEach(item => {
        html += `
            <div style="margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div onclick="togglePolicyContent('${item.id}')" style="background: #f9fbe7; padding: 12px 15px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-weight: bold; color: var(--primary-color);">
                    <span>${item.icon} ${item.title}</span>
                    <span class="policy-arrow" style="transition: transform 0.3s; display: inline-block;">▶</span>
                </div>
                <div id="${item.id}" class="policy-content" style="display: none; padding: 15px; background: #fff; border-top: 1px solid #e0e0e0; font-size: 0.95rem; line-height: 1.6;">
                    <p style="margin-top: 0; color: #757575; font-style: italic; margin-bottom: 10px; font-size: 0.85rem;">${item.shortDesc}</p>
                    ${item.content}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function toggleDropdown(type, event) {
    if (event) event.stopPropagation(); 
    if(type === 'ward' && document.getElementById('box-ward').classList.contains('disabled')) return;
    const menu = document.getElementById(`menu-${type}`);
    const isShowing = menu.style.display === 'block';
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
    if (!isShowing) {
        menu.style.display = 'block';
        const searchInput = menu.querySelector('.dropdown-search');
        if (searchInput) { searchInput.value = ""; filterDropdown(type); searchInput.focus(); }
    }
}

function filterDropdown(type) {
    const input = document.querySelector(`#menu-${type} .dropdown-search`).value.toLowerCase();
    const items = document.querySelectorAll(`#list-${type} li`);
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(input) ? "block" : "none";
    });
}

function selectOption(type, value) {
    document.getElementById(`order-${type}`).value = value;
    document.querySelector(`#box-${type} .dropdown-selected`).innerText = value;
    document.getElementById(`menu-${type}`).style.display = 'none';
    if (type === 'province') loadWards(value);
    updateFinalAddress();
    calculateTotal();
}

function loadWards(provName) {
    const boxWard = document.getElementById('box-ward');
    const listWard = document.getElementById('list-ward');
    const inputWard = document.getElementById('order-ward');
    const selectedWard = document.querySelector('#box-ward .dropdown-selected');
    inputWard.value = ""; selectedWard.innerText = "-- Chọn Phường/Xã --"; listWard.innerHTML = "";

    if (provName && LOCAL_ADDRESS_DATA[provName]) {
        boxWard.classList.remove('disabled');
        LOCAL_ADDRESS_DATA[provName].forEach(ward => {
            let li = document.createElement('li');
            li.innerText = ward;
            li.onclick = () => selectOption('ward', ward);
            listWard.appendChild(li);
        });
    } else { boxWard.classList.add('disabled'); }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-dropdown')) { document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none'); }
});

function updateFinalAddress() {
    let p = document.getElementById('order-province').value;
    let w = document.getElementById('order-ward').value;
    let s = document.getElementById('order-street').value.trim();
    let box = document.getElementById('address-preview-box');
    let text = document.getElementById('address-preview-text');

    if (p && p !== '') {
        text.innerText = [s, w, p].filter(x => x && x !== '').join(', ');
        box.style.display = 'block';
    } else { box.style.display = 'none'; }
}

// ==========================================
// 4. XỬ LÝ ĐẶT HÀNG
// ==========================================
async function handleOrderSubmit() {
    const btn = document.querySelector('#tab-order .confirm-button');
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const fileInput = document.getElementById('receipt-file');

    if (!document.getElementById('agree-policy').checked) return showToast("Vui lòng tick chọn đồng ý với Chính sách của Tiệm nhé!");
    if (!document.getElementById('order-sender-name').value || !document.getElementById('order-sender-phone').value || !document.getElementById('order-receiver-name').value || !document.getElementById('order-receiver-phone').value || !document.getElementById('order-province').value || !document.getElementById('order-ward').value) return showToast("Vui lòng điền đủ thông tin giao hàng!");

    const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/g;
    const senderPhone = document.getElementById('order-sender-phone').value.trim();
    const receiverPhone = document.getElementById('order-receiver-phone').value.trim();

    if (!senderPhone.match(phoneRegex) || !receiverPhone.match(phoneRegex)) return showToast("Số điện thoại không đúng định dạng!");
    if (paymentMethod === 'ck' && fileInput.files.length === 0) return showToast("Vui lòng tải ảnh chuyển khoản lên!");

    btn.innerText = "Đang xử lý..."; btn.disabled = true;

    let base64Image = "";
    if (paymentMethod === 'ck') {
        const file = fileInput.files[0];
        base64Image = await new Promise((resolve) => {
            const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file);
        });
    }

    const data = {
        action: "createOrder",
        phan_loai: document.querySelector('input[name="order-purpose"]:checked').value,
        qty: document.getElementById('order-qty').value,
        ten_nguoi_dat: document.getElementById('order-sender-name').value,
        sdt_nguoi_dat: senderPhone,
        ten_nguoi_nhan: document.getElementById('order-receiver-name').value,
        sdt_nguoi_nhan: receiverPhone,
        dia_chi_giao_hang: document.getElementById('address-preview-text').innerText,
        hinh_thuc_thanh_toan: paymentMethod,
        phi_van_chuyen: document.getElementById('calc-ship-price').innerText.replace(/\D/g,''),
        tien_tra: document.getElementById('calc-tea-price').innerText.replace(/\D/g,''),
        tong_thanh_toan: document.getElementById('calc-total-price').innerText.replace(/\D/g,''),
        ghi_chu: document.getElementById('order-note') ? document.getElementById('order-note').value.trim() : "", 
        imageBtn64: base64Image
    };

    try {
        const response = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        const result = await response.json();
        if (result.success) {
            document.getElementById('main-order-form').style.display = 'none';
            document.getElementById('order-success-box').style.display = 'block';
            document.getElementById('final-id').innerText = result.id_don_hang;
            localStorage.setItem('tempID', result.id_don_hang);
            localStorage.setItem('tempPhone', senderPhone);
            localStorage.setItem('fromTab2', 'true');

            const audioBox = document.getElementById('audio-option-box');
            const btnUpload = document.getElementById('btn-go-to-upload');
            if (audioBox.style.display !== 'none') {
                const audioChoice = document.querySelector('input[name="audio-choice"]:checked');
                if (audioChoice && audioChoice.value === 'now') {
                    btnUpload.style.display = 'inline-block';
                    btnUpload.onclick = () => switchTab('upload');
                }
            }
        } else showToast("Lỗi: " + (result.message || "Không thể tạo đơn"), "error");
    } catch (e) { showToast("Lỗi kết nối: " + e.message, "error"); } 
    finally { btn.innerText = "Xác nhận đặt hàng"; btn.disabled = false; }
}

function checkAutoFill() {
    if (localStorage.getItem('fromTab2') === 'true') {
        document.getElementById('upload-id').value = localStorage.getItem('tempID');
        document.getElementById('upload-phone').value = localStorage.getItem('tempPhone');
        document.getElementById('info-check-msg').style.display = 'block';
        localStorage.removeItem('fromTab2');
    }
}

// ==========================================
// 5. TẢI AUDIO
// ==========================================
async function handleAudioUpload() {
    const id = document.getElementById('upload-id').value.trim();
    const phone = document.getElementById('upload-phone').value.trim();
    const file = document.getElementById('audio-file').files[0];
    
    if(!id || !phone || !file) return showToast("Vui lòng nhập đủ thông tin và chọn file!", "error");
    if(file.size > 5 * 1024 * 1024) return showToast("File quá lớn, tối đa 5MB!", "error");

    const btn = document.getElementById('btn-upload-audio');
    btn.innerText = "Đang tải lên (Xin chờ vài giây)..."; btn.disabled = true;

    const base64Audio = await new Promise(r => { let reader = new FileReader(); reader.onload = e => r(e.target.result); reader.readAsDataURL(file); });

    try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: "uploadAudio", id_don_hang: id, sdt_nguoi_dat: phone, audioBase64: base64Audio }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        const result = await res.json();
        if(result.success) {
            showToast(result.message, 'success'); 
            document.getElementById('audio-file').value = "";
            document.getElementById('audio-text').innerText = "Nhấn để tải file ghi âm lên";
            setTimeout(() => { switchTab('tracking'); }, 2000);
        } else showToast(result.message, 'error'); 
    } catch(e) { showToast("Lỗi hệ thống: " + e.message, 'error'); } 
    finally { btn.innerText = "Gửi Audio cho Tiệm"; btn.disabled = false; }
}

// ==========================================
// 6. LOGIC PHÒNG LƯU TRỮ NỖI NHỚ (CASSETTE UI)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playStampSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playWoodSlideSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * 0.5; 
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.5);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noiseSource.start();
}

async function checkGift() {
    const id = document.getElementById('receive-code').value.trim().toUpperCase();
    const phone = document.getElementById('receive-phone').value.trim();
    const emailInput = document.getElementById('receive-email');
    const emailBox = document.getElementById('email-request-box');
    const emailValue = emailInput.value.trim();

    if(!id || !phone) return showToast("Vui lòng nhập Mã đơn hàng và Số điện thoại!", 'warning');

    const btn = document.getElementById('btn-check-gift');
    const statusNote = document.getElementById('receive-note');
    const indexCard = document.getElementById('index-card-form');
    const memoryBox = document.getElementById('memory-box');
    const audioPlayer = document.getElementById('hidden-audio-player');
    const tapeOrderId = document.getElementById('tape-order-id');

    playStampSound();
    btn.innerText = "ĐANG TÌM KIẾM..."; btn.disabled = true;
    statusNote.innerText = "Trạng thái: Đang truy xuất dữ liệu...";

    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "recipientCheck", id_don_hang: id, sdt_nguoi_nhan: phone, email: emailValue }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await res.json();

        if (result.success) {
            if (result.is_first_time && !emailValue) {
                playStampSound();
                showToast("Vui lòng bổ sung Hòm thư (Email) để nhận bản sao lưu trữ!", "warning");
                emailBox.style.display = 'block';
                statusNote.innerText = "Trạng thái: Cần bổ sung Email.";
            } else {
                emailBox.style.display = 'none';
                statusNote.innerText = "Trạng thái: Đã tìm thấy!";
                statusNote.style.color = "#2e7d32";
                
                tapeOrderId.innerText = id;
                indexCard.style.opacity = '0';
                indexCard.style.pointerEvents = 'none';

                setTimeout(() => {
                    indexCard.style.display = 'none'; 
                    playWoodSlideSound(); 
                    memoryBox.style.display = 'block';
                    
                    // BẬT LỚP MỜ BACKGROUND
                    document.querySelector('.cassette-room-container').classList.add('blur-mode');
                    
                    if (result.audio_base64) {
                        audioPlayer.src = result.audio_base64;
                        audioPlayer.load();
                    } else {
                        showToast("Cuộn băng trống: Không có bản ghi âm nào.", "error");
                    }
                }, 400);
            }
        } else {
            playStampSound();
            showToast(result.msg, 'warning');
            statusNote.innerText = "Trạng thái: Kỷ vật không tồn tại hoặc chưa giao.";
            statusNote.style.color = "#c62828";
        }
    } catch(e) {
        showToast("Lỗi kết nối: " + e.message, 'error');
        statusNote.innerText = "Trạng thái: Lỗi kết nối hệ thống.";
    } finally {
        if (btn.innerText === "ĐANG TÌM KIẾM...") { btn.innerText = "TÌM CUỘN BĂNG"; }
        btn.disabled = false;
    }
}

function toggleAudio() {
    const audio = document.getElementById("hidden-audio-player");
    playStampSound();
    if (audio.paused) {
        audio.play().catch(e => showToast("Trình duyệt đang chặn phát âm thanh!", "error"));
    } else {
        audio.pause();
    }
}

function stopAudio() {
    const audio = document.getElementById("hidden-audio-player");
    playStampSound();
    if (!audio.paused) {
        audio.pause(); 
    }
}

function ejectTape() {
    const audio = document.getElementById("hidden-audio-player");
    playStampSound();
    audio.pause(); 
    audio.currentTime = 0;
    resetArchive(); 
}

function updateProgress() {}

function resetArchive() {
    const memoryBox = document.getElementById('memory-box');
    const indexCard = document.getElementById('index-card-form');
    const statusNote = document.getElementById('receive-note');
    
    playWoodSlideSound(); 
    memoryBox.style.display = 'none';
    
    // TẮT LỚP MỜ BACKGROUND
    document.querySelector('.cassette-room-container').classList.remove('blur-mode');
    
    indexCard.style.display = 'flex';
    setTimeout(() => {
        indexCard.style.opacity = '1';
        indexCard.style.pointerEvents = 'auto';
    }, 50);
    
    statusNote.innerText = "Trạng thái: Sẵn sàng tra cứu...";
    statusNote.style.color = "#3e2723";
}

// ==========================================
// 7. TRA CỨU & 8. POPUP & 9. TOAST
// ==========================================
async function handleTracking() {
    const id = document.getElementById('track-id').value.trim().toUpperCase();
    const phone = document.getElementById('track-phone').value.trim();
    if(!id || !phone) return showToast("Vui lòng nhập đủ mã đơn và SĐT người nhận!");
    const btn = document.querySelector('#tab-tracking .confirm-button');
    btn.innerText = "Đang tra cứu..."; btn.disabled = true;

    try {
        const response = await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: "trackOrder", id_don_hang: id, sdt_nguoi_nhan: phone }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        const result = await response.json();
        if (result.success) {
            document.getElementById('tracking-result-box').style.display = 'block';
            document.getElementById('res-id').innerText = result.data.id_don_hang;
            document.getElementById('res-status').innerText = result.data.trang_thai_don;
            const linkBtn = document.getElementById('res-link');
            if(result.data.link_theo_doi && result.data.link_theo_doi.trim() !== "") { linkBtn.href = result.data.link_theo_doi; linkBtn.style.display = 'inline-block'; } else linkBtn.style.display = 'none';
        } else showToast(result.message || "Không tìm thấy đơn hàng!", "warning");
    } catch (e) { showToast("Lỗi kết nối.", "error"); } finally { btn.innerText = "Kiểm tra tình trạng"; btn.disabled = false; }
}

function openPolicyModal(e) { e.preventDefault(); document.getElementById('policy-modal').style.display = 'flex'; }
function closePolicyModal() { document.getElementById('policy-modal').style.display = 'none'; }
function togglePolicyContent(id) {
    const c = document.getElementById(id); const h = c.parentElement.querySelector('.policy-arrow');
    const s = c.style.display === 'block';
    document.querySelectorAll('.policy-content').forEach(x => x.style.display = 'none');
    document.querySelectorAll('.policy-arrow').forEach(x => x.style.transform = 'rotate(0deg)');
    if (!s) { c.style.display = 'block'; h.style.transform = 'rotate(90deg)'; }
}

function showToast(message, type = 'warning') {
    const t = document.getElementById("custom-toast"), m = document.getElementById("toast-msg"), i = document.getElementById("toast-icon");
    if (type === 'success') { i.innerText = "✅"; t.style.borderLeftColor = "#4caf50"; } else if (type === 'error') { i.innerText = "❌"; t.style.borderLeftColor = "#f44336"; } else { i.innerText = "🔔"; t.style.borderLeftColor = "#d84315"; }
    m.innerText = message; t.style.visibility = "visible"; t.style.opacity = "1"; t.style.top = "40px";
    setTimeout(() => { t.style.opacity = "0"; t.style.top = "30px"; setTimeout(() => { t.style.visibility = "hidden"; }, 300); }, 3500);
}


