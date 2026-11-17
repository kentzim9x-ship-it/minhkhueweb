/* ================= 1. OVERLAY MENU CONTROLS ================= */
const menuOverlay = document.getElementById('menuOverlay');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const menuCloseBtn = document.getElementById('menuCloseBtn');

menuToggleBtn.addEventListener('click', () => {
    menuOverlay.classList.add('open');
});

menuCloseBtn.addEventListener('click', closeMenu);

function closeMenu() {
    menuOverlay.classList.remove('open');
}

/* ================= 2. HIỆU ỨNG MÁI CHE 3D CHỐNG CHỚP NHÁY TRÊN SAFARI ================= */
const deckTrack = document.getElementById('productsDeckTrack');
const stackCards = Array.from(document.querySelectorAll('#stackWrapper .stack-card'));

// Khóa cứng thứ tự lớp bằng JS để không bao giờ bị đảo lộn
stackCards.forEach((card, i) => {
    card.style.zIndex = String((stackCards.length - i) * 10);
});

let targetDeckRatio = 0;
let smoothDeckRatio = 0;
let lastRenderedRatio = -1;

function syncDeckScrollTarget() {
    if (!deckTrack) return;
    const rect = deckTrack.getBoundingClientRect();
    const scrollable = deckTrack.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    targetDeckRatio = Math.max(0, Math.min(1, -rect.top / scrollable));
}

function renderDeckCardsLoop() {
    if (deckTrack && stackCards.length) {
        smoothDeckRatio += (targetDeckRatio - smoothDeckRatio) * 0.16;

        if (Math.abs(targetDeckRatio - smoothDeckRatio) < 0.0004) {
            smoothDeckRatio = targetDeckRatio;
        }

        if (smoothDeckRatio !== lastRenderedRatio) {
            lastRenderedRatio = smoothDeckRatio;

            const isMobile = window.innerWidth <= 960;
            const totalTransitions = stackCards.length - 1;
            const rawProgress = smoothDeckRatio * totalTransitions;

            for (let idx = 0; idx < stackCards.length; idx++) {
                const card = stackCards[idx];

                if (idx < totalTransitions && rawProgress > idx) {
                    const t = Math.min(1, rawProgress - idx);
                    const tiltX = Math.sin(t * Math.PI * 0.7) * 30;
                    const liftY = -Math.pow(t, 1.25) * 112;
                    const scale = 1 + Math.sin(t * Math.PI) * 0.015;
                    const opacity = t > 0.88 ? Math.max(0, 1 - (t - 0.88) / 0.12) : 1;

                    card.style.opacity = opacity.toFixed(3);
                    // Dùng perspective(2400px) nội bộ trong transform để tránh lỗi Z-fighting của Safari
                    card.style.transform = `perspective(2400px) translateY(${liftY.toFixed(2)}vh) rotateX(${tiltX.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
                } else {
                    const depth = Math.max(0, idx - rawProgress);
                    let restY = 0;
                    let restScale = 1;

                    if (depth <= 1) {
                        restY = depth * 74;
                        restScale = 1 - depth * 0.042;
                    } else if (depth <= 2) {
                        restY = 74 + (depth - 1) * 38;
                        restScale = 0.958 - (depth - 1) * 0.042;
                    } else {
                        restY = 112 + (depth - 2) * 32;
                        restScale = 0.916 - (depth - 2) * 0.042;
                    }

                    if (isMobile) restY *= 0.6;

                    card.style.opacity = '1';
                    card.style.transform = `perspective(2400px) translateY(${restY.toFixed(2)}px) rotateX(0deg) scale(${restScale.toFixed(4)})`;
                }
            }
        }
    }
    requestAnimationFrame(renderDeckCardsLoop);
}

syncDeckScrollTarget();
requestAnimationFrame(renderDeckCardsLoop);

/* ================= NÚT CUỘN LÊN ĐẦU TRANG ================= */
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('is-visible', window.scrollY > 360);
    }, { passive: true });
}

// Bắt buộc gắn syncDeckScrollTarget() vào sự kiện cuộn và chạy ngay khi tải trang
window.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
        syncDeckScrollTarget();
        calcPartnersTargetX();
        updateActiveDock();
    });
}, { passive: true });

window.addEventListener('resize', syncDeckScrollTarget);
syncDeckScrollTarget();

/* ================= 3A. SCROLL REVEAL CHO MỤC "VỀ CHÚNG TÔI" ================= */
const revealItems = document.querySelectorAll('.reveal-item');

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Chỉ chạy 1 lần khi cuộn tới
        }
    });
}, {
    threshold: 0.14,
    rootMargin: '0px 0px -50px 0px'
});

revealItems.forEach((el) => revealObserver.observe(el));

/* ================= 3B. HIỆU ỨNG ĐỐI TÁC & KHÁCH HÀNG SIÊU MƯỢT + HOVER LỤA ================= */
const partnersSection = document.getElementById('partners');
const partnersHeader = document.getElementById('partnersHeader');
const partnerCards = Array.from(document.querySelectorAll('#partnersCardsStage .review-card'));

// Lưu trạng thái hover mượt riêng cho từng card
const cardStates = partnerCards.map((card, idx) => {
    card.style.zIndex = String(idx + 1);
    const state = { el: card, isHovered: false, hoverT: 0 };

    card.addEventListener('mouseenter', () => {
        state.isHovered = true;
    });
    card.addEventListener('mouseleave', () => {
        state.isHovered = false;
    });

    return state;
});

// Nhịp độ cao thấp & góc nghiêng đan xen lặp lại theo chu kỳ 5 card/dòng
const rowPattern = [
    { y: 14, rot: -2.2 },
    { y: -10, rot: 1.8 },
    { y: 12, rot: -2.4 },
    { y: -8, rot: 2.0 },
    { y: 10, rot: -1.8 }
];

const mobilePattern = [
    { y: 6, rot: -1.8 },
    { y: -6, rot: 1.8 }
];

let smoothProgress = 0;
let rawScrollProgress = 0;

function calcPartnersTargetX() {
    if (!partnersSection) return;
    const rect = partnersSection.getBoundingClientRect();
    const scrollable = partnersSection.offsetHeight - window.innerHeight;

    if (partnersHeader) {
        partnersHeader.classList.toggle('is-active', rect.top < window.innerHeight * 0.78);
    }

    if (scrollable <= 0) return;
    const progress = (-rect.top + window.innerHeight * 0.14) / (scrollable + window.innerHeight * 0.14);
    rawScrollProgress = Math.max(0, Math.min(1, progress));
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function animatePartnersTrack() {
    if (cardStates.length) {
        // Quán tính cuộn êm (0.14)
        smoothProgress += (rawScrollProgress - smoothProgress) * 0.14;
        if (Math.abs(rawScrollProgress - smoothProgress) < 0.0002) {
            smoothProgress = rawScrollProgress;
        }

        const isMobile = window.innerWidth <= 960;
        const cols = isMobile ? 2 : 5;
        const total = cardStates.length;
        const duration = 0.42; // Kéo dài nhịp bay vào để chuyển động đầm và mềm hơn
        const staggerSpan = 1 - duration;

        for (let idx = 0; idx < total; idx++) {
            const state = cardStates[idx];
            const card = state.el;

            // Nội suy hiệu ứng hover riêng cho từng thẻ (0 -> 1)
            const targetHover = state.isHovered ? 1 : 0;
            state.hoverT += (targetHover - state.hoverT) * 0.16;
            if (Math.abs(targetHover - state.hoverT) < 0.001) {
                state.hoverT = targetHover;
            }

            const start = total > 1 ? (idx / (total - 1)) * staggerSpan : 0;
            const localT = Math.max(0, Math.min(1, (smoothProgress - start) / duration));
            const eased = easeOutQuart(localT);

            const pattern = isMobile ? mobilePattern[idx % cols] : rowPattern[idx % cols];
            const startOffsetX = isMobile ? 80 : 240;
            const startOffsetY = isMobile ? 100 : 170;

            const baseX = (1 - eased) * startOffsetX;
            const baseY = pattern.y + (1 - eased) * startOffsetY;
            const baseRot = pattern.rot + (1 - eased) * (isMobile ? 6 : 9);

            // Cộng hưởng chuyển động hover: nhấc lên -18px, xoay thẳng về 0deg, phóng nhẹ 1.035
            const h = state.hoverT;
            const finalY = baseY - h * 18;
            const finalRot = baseRot * (1 - h);
            const finalScale = 1 + h * 0.035;
            const currentOpacity = Math.min(1, localT * 2.8);

            card.style.opacity = currentOpacity.toFixed(3);
            card.style.transform = `translate3d(${baseX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) rotate(${finalRot.toFixed(2)}deg) scale3d(${finalScale.toFixed(4)}, ${finalScale.toFixed(4)}, 1)`;
        }
    }
    requestAnimationFrame(animatePartnersTrack);
}

requestAnimationFrame(animatePartnersTrack);

/* ================= 4. ACTIVE SECTION DOCK HIGHLIGHT ================= */
const sections = document.querySelectorAll('header[id], section[id]');
const dockItems = document.querySelectorAll('.dock-item');

function updateActiveDock() {
    let currentId = 'hero';
    sections.forEach((sec) => {
        const top = sec.offsetTop - 240;
        if (window.scrollY >= top) {
            currentId = sec.getAttribute('id');
        }
    });
    dockItems.forEach((item) => {
        item.classList.toggle('active', item.dataset.section === currentId);
    });
}

window.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
        syncDeckScrollTarget();
        calcPartnersTargetX();
        updateActiveDock();
    });
}, { passive: true });

window.addEventListener('resize', () => {
    syncDeckScrollTarget();
    calcPartnersTargetX();
});

syncDeckScrollTarget();
calcPartnersTargetX();

/* ================= 5. PRODUCT DETAILS & B2B QUOTE MODAL ================= */
const productCatalogData = [
    {
        title: 'Bảng quy cách: Trái cây nhiệt đới đặc sản VN',
        subtitle: 'Thu hoạch & đóng gói tại kho Tiền Giang / Đắk Lắk — Giao toàn quốc',
        rows: [
            { name: 'Xoài Cát Hòa Lộc VIP', size: '450g – 550g / trái', pack: 'Thùng carton 10kg (lót xốp lưới)', moq: '100 kg' },
            { name: 'Sầu riêng Ri6 Cơm Vàng', size: '2.5kg – 3.8kg / trái', pack: 'Thùng 18kg (6 trái)', moq: '150 kg' },
            { name: 'Thanh long Ruột Đỏ L1', size: '450g – 600g / trái', pack: 'Thùng 9kg / 10kg xuất khẩu', moq: '200 kg' },
            { name: 'Bưởi Da Xanh Bến Tre', size: '1.2kg – 1.6kg / trái', pack: 'Bao lưới từng trái / Thùng 12kg', moq: '150 kg' }
        ]
    },
    {
        title: 'Bảng quy cách: Trái cây cao nguyên Đà Lạt',
        subtitle: 'Bảo quản lạnh 4°C liên tục từ nhà kính Lâm Đồng',
        rows: [
            { name: 'Dâu tây giống Nhật Hana', size: 'Size VIP 18–22 trái/hộp', pack: 'Hộp 250g (Thùng 16 hộp)', moq: '40 kg' },
            { name: 'Bơ sáp 034 Đầu Dòng', size: '350g – 500g / trái', pack: 'Sọt nhựa thoáng khí 15kg', moq: '100 kg' },
            { name: 'Hồng giòn Đà Lạt L1', size: '180g – 240g / trái', pack: 'Thùng carton 10kg', moq: '100 kg' },
            { name: 'Chanh dây tím xuất khẩu', size: '80g – 110g / trái', pack: 'Thùng 5kg / 10kg', moq: '100 kg' }
        ]
    },
    {
        title: 'Bảng quy cách: Trái cây nhập khẩu chính ngạch',
        subtitle: 'Đầy đủ chứng từ CO, CQ, kiểm dịch thực vật & hóa đơn VAT',
        rows: [
            { name: 'Cherry Đỏ Mỹ / Úc / Chile', size: 'Size 28–30mm & 30–32mm', pack: 'Thùng nguyên đai 5kg', moq: '5 thùng (25kg)' },
            { name: 'Nho Mẫu Đơn Hàn Quốc', size: 'Chùm 650g – 800g', pack: 'Thùng 2kg (3 chùm) / 4kg', moq: '10 thùng' },
            { name: 'Táo Envy New Zealand', size: 'Size 24 / 30 / 70', pack: 'Thùng 9kg / 18kg', moq: '5 thùng' },
            { name: 'Kiwi Vàng Zespri SunGold', size: 'Size 22 / 25 / 27', pack: 'Khay 3.3kg nguyên seal', moq: '10 khay' }
        ]
    },
    {
        title: 'Gói cung ứng B2B & Quà tặng doanh nghiệp',
        subtitle: 'Thiết kế riêng theo ngân sách & lịch trình của từng doanh nghiệp',
        rows: [
            { name: 'Gói Pantry Văn Phòng Tuần', size: '5–7 loại trái cây cắt sẵn / nguyên trái', pack: 'Giao thứ 2 & thứ 5 hàng tuần', moq: 'Từ 15 nhân sự' },
            { name: 'Gói Nguyên Liệu Chuỗi F&B', size: 'Xoài, chanh dây, dâu, bơ, cam sành', pack: 'Sơ chế hoặc nguyên trái theo yêu cầu', moq: 'Từ 50kg/tuần' },
            { name: 'Giỏ Quà Doanh Nghiệp OEM', size: 'Mix trái cây nhập khẩu & đặc sản', pack: 'Hộp gỗ / giỏ mây in logo ép kim', moq: 'Từ 20 phần quà' }
        ]
    }
];

const quoteModal = document.getElementById('quoteModal');
const modalDynamicContent = document.getElementById('modalDynamicContent');

function openProductDetail(index) {
    const item = productCatalogData[index];
    const rowsHtml = item.rows.map(r => `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td>${r.size}</td>
      <td>${r.pack}</td>
      <td><strong>${r.moq}</strong></td>
    </tr>
  `).join('');

    modalDynamicContent.innerHTML = `
    <h3 class="modal-title">${item.title}</h3>
    <p class="modal-sub">${item.subtitle}</p>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Mặt hàng</th>
          <th>Kích thước</th>
          <th>Quy cách đóng gói</th>
          <th>Đơn tối thiểu</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <button class="btn-primary-dark" style="width:100%; justify-content:center;" onclick="openQuoteModal('${item.title}')">
      Nhận báo giá sỉ cho danh mục này →
    </button>
  `;
    quoteModal.classList.add('active');
}

function openQuoteModal(subject) {
    modalDynamicContent.innerHTML = `
    <h3 class="modal-title">Yêu cầu báo giá & Tư vấn nguồn hàng</h3>
    <p class="modal-sub">Chủ đề: <strong>${subject}</strong> — Chuyên viên B2B phản hồi trong 30 phút.</p>
    <form onsubmit="submitQuoteForm(event)">
      <div class="form-group">
        <label>Tên doanh nghiệp / Cửa hàng *</label>
        <input type="text" required placeholder="VD: Công ty TNHH Thực phẩm Xanh / Chuỗi F&B..." />
      </div>
      <div class="form-group">
        <label>Họ tên người liên hệ & Số điện thoại (Zalo) *</label>
        <input type="text" required placeholder="VD: Anh Minh — 0912 345 678" />
      </div>
      <div class="form-group">
        <label>Mô hình kinh doanh</label>
        <select>
          <option>Hệ thống siêu thị / Cửa hàng trái cây sạch</option>
          <option>Chuỗi Cà phê / Trà sữa / Nhà hàng / Khách sạn</option>
          <option>Đại lý phân phối sỉ / Chợ đầu mối</option>
          <option>Doanh nghiệp đặt quà tặng / Pantry văn phòng</option>
          <option>Đối tác xuất khẩu</option>
        </select>
      </div>
      <div class="form-group">
        <label>Danh mục mặt hàng & Sản lượng dự kiến</label>
        <textarea rows="3" placeholder="VD: Cần nhập Sầu riêng Ri6, Xoài Cát Hòa Lộc và Táo Envy khoảng 300kg/tuần tại Hà Nội..."></textarea>
      </div>
      <button type="submit" class="btn-primary-dark" style="width:100%; justify-content:center; margin-top:6px;">
        Gửi yêu cầu nhận bảng giá ngay
      </button>
    </form>
  `;
    quoteModal.classList.add('active');
}

function submitQuoteForm(e) {
    e.preventDefault();
    modalDynamicContent.innerHTML = `
    <div style="text-align:center; padding: 24px 10px;">
      <div style="width:56px; height:56px; border-radius:50%; background:#DCFCE7; color:#16A34A; font-size:26px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-weight:800;">✓</div>
      <h3 class="modal-title">Đã tiếp nhận yêu cầu báo giá!</h3>
      <p class="modal-sub" style="margin-bottom:22px;">
        Bộ phận Kinh doanh B2B của <strong>MINH KHUE Co., Ltd.</strong> đã nhận được thông tin và sẽ gửi bảng giá kèm Catalogue qua Zalo/Email trong vòng 30 phút.
      </p>
      <button class="btn-primary-dark" onclick="closeQuoteModal()">Hoàn tất</button>
    </div>
  `;
}

function closeQuoteModal() {
    quoteModal.classList.remove('active');
}

quoteModal.addEventListener('click', (e) => {
    if (e.target === quoteModal) closeQuoteModal();
});