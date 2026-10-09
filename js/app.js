// Language state controller
let currentLang = 'ar';

const translations = {
    ar: {
        "tagline": "صيانة خطوط الإنتاج والإلكترونيات",
        "location-text": "القاهرة - المنطقة الصناعية | 24/7 طوارئ صيانة",
        "nav-about": "عن Zad Automation",
        "nav-services": "الخدمات والهندسة",
        "nav-3d": "حاسبة القوالب 3D",
        "nav-projects": "مشاريعنا",
        "nav-contact": "التواصل والفرع",
        "btn-request-maint": "طلب صيانة طارئة",
        "btn-request-3d": "طلب تصميم قوالب 3D",
        "hero-badge": "ZAD GROUP | شريك الأتمتة والصيانة المعتمد",
        "hero-title-1": "حلول هندسية متكاملة لـ",
        "hero-title-2": "صيانة خطوط الإنتاج وقوالب 3D",
        "hero-desc": "نضمن استمرارية خطوط إنتاجك بأعلى كفاءة تشغيلية. صيانة طارئة وكروت PLC إلكترونية، مع إمكانية تصميم وتصنيع القوالب ثلاثية الأبعاد بدقة صناعية متناهية.",
        "btn-hero-maint": "طلب صيانة خط إنتاج",
        "btn-hero-3d": "إنتاج وقوالب 3D",
        "stat-1": "نسبة كفاءة التشغيل",
        "stat-2": "خط إنتاج تمت صيانته",
        "stat-3": "زمن استجابة الطوارئ",
        "card-status-title": "حالة نظام Zad Automation",
        "card-plc": "وحدات PLC & Inverters",
        "card-plc-desc": "فحص كروت الإلكترونيات والتشخيص الذكي",
        "card-3d": "معمل قوالب الـ 3D",
        "card-3d-desc": "طباعة SLA / SLS / FDM عالية الدقة",
        "card-response": "فرق الدعم الميداني",
        "card-response-desc": "تغطية كافة المناطق الصناعية",
        "status-ready": "جاهز 100%",
        "status-active": "نشط الآن",
        "status-standby": "جاهزية 24/7",
        "card-cta": "التواصل مع مهندس صيانة مباشرة",
        "services-subtitle": "خدماتنا الهندسية والصناعية",
        "services-title": "حلول متخصصة لصناعة بلا توقف",
        "services-desc": "نقدم خدمات صيانة وهندسة معتمدة تدعم استمرارية الإنتاج وتقليل هدر الطاقة والأعطال لشركة Zad Automation.",
        "tab-all": "جميع الخدمات",
        "tab-maint": "صيانة خطوط الإنتاج",
        "tab-molds": "قوالب ثلاثية الأبعاد 3D",
        "tab-elec": "إلكترونيات & PLC",
        "tab-contracts": "عقود صيانة وقائية",
        "s1-title": "صيانة خطوط الإنتاج والتجميع",
        "s1-desc": "تشخيص ومعالجة الأعطال الميكانيكية والكهربائية والهيدروليكية لخطوط الإنتاج لتقليل ساعات التوقف الفعلي للمصنع.",
        "s1-f1": "إصلاح المحركات والسيرفو درايف",
        "s1-f2": "صيانة الأنظمة الهيدروليكية والنيوماتيكية",
        "s1-f3": "تحديث خطوط الإنتاج القديمة",
        "s2-title": "إنتاج وتصنيع قوالب 3D",
        "s2-desc": "نمذجة هندسية عكسية (Reverse Engineering) وطباعة القوالب ثلاثية الأبعاد ببدائل صناعية مقواة تتحمل الضغط والحرارة.",
        "s2-f1": "قوالب الحقن والنفخ البلاستيكي",
        "s2-f2": "طباعة خامات PETG, ABS, Resin المقواة",
        "s2-f3": "إنتاج نماذج أولية سريعة Prototype",
        "s3-title": "صيانة الكروت الإلكترونية & PLC",
        "s3-desc": "إصلاح كروت التحكم الصناعية، أجهزة الإنفرتر Inverters، وشاشات HMI اللمسية لجميع الماركات العالمية (Siemens, ABB, Schneider).",
        "s3-f1": "برمجة وإصلاح وحدات PLC",
        "s3-f2": "إصلاح أعطال أجهزة Variable Frequency Drive",
        "s3-f3": "صيانة الكروت المحروقة والتالفة",
        "s4-title": "عقود الصيانة الوقائية السنوية",
        "s4-desc": "عقود دورية مخصصة للمصانع والمنشآت تضمن الزيارات المنتظمة وتوفير قطع الغيار وتفادي التوقفات المفاجئة.",
        "s4-f1": "زيارات دورية شهرية أو أسبوعية",
        "s4-f2": "أولوية الاستجابة للبلاغات الطارئة",
        "s4-f3": "تقارير فنية قياسية شاملة",
        "btn-order-now": "طلب الخدمة الآن",
        "calc-subtitle": "أداة التقدير التفاعلية",
        "calc-title": "احسب مواصفات ومتطلبات قالب الـ 3D الخاص بك",
        "calc-desc": "قم بتحديد نوع المادة والتسامح المطلوب وأبعاد الجزء للتطوير الأولي، للحصول على تقدير فني فوري واستجابة هندسية مباشرة من فريق Zad Automation.",
        "calc-guarantee": "ضمان دقة قياسات ودقة تصنيع عالية",
        "calc-guarantee-desc": "يتم مراجعة كافة الملفات بتقنيات CAD/CAM بواسطة مهندسين ميكانيكيين قبل البدء في الطباعة والصب.",
        "calc-mat-label": "نوع الخامة / المادة",
        "calc-precision-label": "دقة الطباعة (Layer Height)",
        "calc-dim-x": "الطول (سم)",
        "calc-dim-y": "العرض (سم)",
        "calc-dim-z": "الارتفاع (سم)",
        "calc-qty": "الكمية المطلوبة (قطع)",
        "calc-btn": "حساب وحفظ المواصفات للطلب",
        "calc-estimated-time": "زمن التنفيذ المقدر:",
        "calc-material-vol": "حجم المادة المقدر:",
        "calc-submit-request": "متابعة إرسال هذا الطلب لفريق المبيعات",
        "footer-about": "المؤسسة المتخصصة في صيانة خطوط الإنتاج والحلول البرمجية والإلكترونية وقوالب الطباعة ثلاثية الأبعاد للمصانع والشركات الصناعية.",
        "footer-links-title": "خدمات سريعة",
        "footer-contact-title": "معلومات التواصل",
        "footer-address": "المنطقة الصناعية - مدينة 6 أكتوبر / العاشر من رمضان",
        "footer-emergency-title": "طوارئ الأعطال",
        "footer-emergency-desc": "فريق الدعم الفني جاهز للاستجابة الميدانية السريعة.",
        "footer-rights": "جميع الحقوق محفوظة.",
        "modal-maint-title": "طلب صيانة خط إنتاج / إلكترونيات",
        "modal-maint-desc": "سيتم تحويل بلاغك فوراً للهندسة الميدانية في Zad Automation",
        "modal-3d-title": "طلب إنتاج وتصنيع قوالب 3D",
        "modal-3d-desc": "تصميم ونمذجة هندسية متطورة في Zad Automation",
        "form-company": "اسم الشركة / المصنع",
        "form-phone": "رقم الهاتف / الواتساب",
        "form-type": "نوع العطل",
        "form-mold-notes": "ملاحظات ومواصفات القالب",
        "form-submit-maint": "تأكيد وإرسال بلاغ الصيانة",
        "form-submit-3d": "إرسال طلب تصميم القالب"
    },
    en: {
        "tagline": "Production Line & Electronics Maintenance",
        "location-text": "Cairo - Industrial Zone | 24/7 Emergency Service",
        "nav-about": "About Zad Automation",
        "nav-services": "Services & Engineering",
        "nav-3d": "3D Mold Calculator",
        "nav-projects": "Projects",
        "nav-contact": "Contact Us",
        "btn-request-maint": "Emergency Maintenance",
        "btn-request-3d": "Request 3D Mold",
        "hero-badge": "ZAD GROUP | Certified Industrial Automation Partner",
        "hero-title-1": "Integrated Engineering Solutions for",
        "hero-title-2": "Production Line Maintenance & 3D Molds",
        "hero-desc": "We keep your production lines running with maximum efficiency. Emergency repairs, electronic PLC boards, and precision 3D mold manufacturing.",
        "btn-hero-maint": "Request Line Maintenance",
        "btn-hero-3d": "3D Molds & Production",
        "stat-1": "Operational Efficiency Rate",
        "stat-2": "Production Lines Maintained",
        "stat-3": "Emergency Response Time",
        "card-status-title": "Zad Automation System Status",
        "card-plc": "PLC & Inverter Units",
        "card-plc-desc": "Electronics diagnostic & board repair",
        "card-3d": "3D Mold Fabrication Lab",
        "card-3d-desc": "High precision SLA / SLS / FDM printing",
        "card-response": "Field Response Teams",
        "card-response-desc": "Full coverage across industrial zones",
        "status-ready": "100% Ready",
        "status-active": "Active Now",
        "status-standby": "24/7 Standby",
        "card-cta": "Speak Directly to a Maintenance Engineer",
        "services-subtitle": "Industrial & Engineering Services",
        "services-title": "Specialized Solutions for Non-stop Manufacturing",
        "services-desc": "We provide certified maintenance and engineering services that support production continuity and reduce energy waste for Zad Automation.",
        "tab-all": "All Services",
        "tab-maint": "Line Maintenance",
        "tab-molds": "3D Molds",
        "tab-elec": "Electronics & PLC",
        "tab-contracts": "Preventive Contracts",
        "s1-title": "Assembly & Production Line Maintenance",
        "s1-desc": "Diagnosis and repair of mechanical, electrical, and hydraulic issues to minimize factory downtime.",
        "s1-f1": "Servo Drive & Motor Repairs",
        "s1-f2": "Hydraulic & Pneumatic Systems Servicing",
        "s1-f3": "Legacy Production Line Retrofitting",
        "s2-title": "3D Mold Fabrication & Manufacturing",
        "s2-desc": "Reverse engineering and 3D mold printing using reinforced industrial materials capable of handling extreme pressure and heat.",
        "s2-f1": "Plastic Injection & Blow Molds",
        "s2-f2": "Reinforced PETG, ABS, & Resin Printing",
        "s2-f3": "Rapid Prototyping Services",
        "s3-title": "Electronic Board & PLC Repair",
        "s3-desc": "Repairing industrial control boards, Inverters, and HMI touchscreens for all major global brands (Siemens, ABB, Schneider).",
        "s3-f1": "PLC Programming & Hardware Repair",
        "s3-f2": "Variable Frequency Drive Troubleshooting",
        "s3-f3": "Burnt & Damaged PCB Board Repair",
        "s4-title": "Annual Preventive Maintenance Contracts",
        "s4-desc": "Customized routine contracts for factories guaranteeing regular inspections, spare parts availability, and prevention of sudden breakdowns.",
        "s4-f1": "Weekly or Monthly Scheduled Visits",
        "s4-f2": "Priority Response for Emergency Calls",
        "s4-f3": "Comprehensive Standard Engineering Reports",
        "btn-order-now": "Order Service Now",
        "calc-subtitle": "Interactive Estimation Tool",
        "calc-title": "Calculate Your 3D Mold Specifications",
        "calc-desc": "Specify your target material, layer tolerance, and part dimensions to get an immediate engineering response from the Zad Automation team.",
        "calc-guarantee": "High Accuracy & Precision Guaranteed",
        "calc-guarantee-desc": "All CAD/CAM files are reviewed by mechanical engineers before printing and molding begins.",
        "calc-mat-label": "Material Type",
        "calc-precision-label": "Layer Precision Height",
        "calc-dim-x": "Length (cm)",
        "calc-dim-y": "Width (cm)",
        "calc-dim-z": "Height (cm)",
        "calc-qty": "Quantity Required",
        "calc-btn": "Calculate Specs for Quote",
        "calc-estimated-time": "Estimated Lead Time:",
        "calc-material-vol": "Estimated Material Volume:",
        "calc-submit-request": "Forward Specifications to Sales",
        "footer-about": "Engineering firm specializing in industrial production line maintenance, software/electronic automation, and 3D mold manufacturing.",
        "footer-links-title": "Quick Services",
        "footer-contact-title": "Contact Information",
        "footer-address": "Industrial Zone - 6th of October City / 10th of Ramadan",
        "footer-emergency-title": "Emergency Dispatch",
        "footer-emergency-desc": "Our technical support engineers are ready for rapid field deployment.",
        "footer-rights": "All rights reserved.",
        "modal-maint-title": "Request Line / Electronics Maintenance",
        "modal-maint-desc": "Your report will be forwarded immediately to Zad Automation field engineering.",
        "modal-3d-title": "Request 3D Mold Manufacturing",
        "modal-3d-desc": "Advanced engineering modeling and 3D fabrication at Zad Automation.",
        "form-company": "Company / Factory Name",
        "form-phone": "Phone / WhatsApp Number",
        "form-type": "Fault Type",
        "form-mold-notes": "Mold Notes & Specifications",
        "form-submit-maint": "Confirm & Submit Dispatch",
        "form-submit-3d": "Submit Mold Design Request"
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    // Update Language Switcher Button Text
    const langText = document.getElementById('langText');
    if (langText) {
        langText.innerText = currentLang === 'ar' ? 'English' : 'عربي';
    }

    // Update all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('menuIcon');
    menu.classList.toggle('hidden');
    icon.className = menu.classList.contains('hidden') ? 'fa-solid fa-bars text-xl' : 'fa-solid fa-xmark text-xl';
}

function filterServices(category, event) {
    const cards = document.querySelectorAll('#servicesGrid .service-card');
    const buttons = document.querySelectorAll('.tab-btn');

    buttons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function calculateMold(e) {
    e.preventDefault();
    const x = parseFloat(document.getElementById('dimX').value) || 10;
    const y = parseFloat(document.getElementById('dimY').value) || 10;
    const z = parseFloat(document.getElementById('dimZ').value) || 5;
    const qty = parseInt(document.getElementById('calcQty').value) || 1;

    const volume = Math.round(x * y * z * qty * 1.2);
    let timeHours = Math.max(12, Math.round((volume / 100) * 4));

    document.getElementById('estVol').innerText = `${volume.toLocaleString()} cm³`;
    document.getElementById('estTime').innerText = `${timeHours} - ${timeHours + 24} ${currentLang === 'ar' ? 'ساعة' : 'Hours'}`;
    document.getElementById('calcResult').classList.remove('hidden');
}

function openMoldModalWithCalc() {
    const x = document.getElementById('dimX').value;
    const y = document.getElementById('dimY').value;
    const z = document.getElementById('dimZ').value;
    const mat = document.getElementById('calcMaterial').value;
    const qty = document.getElementById('calcQty').value;

    document.getElementById('moldNotesInput').value = `Specs: ${mat} - Dimensions: ${x}x${y}x${z} cm - Qty: ${qty}`;
    openModal('moldModal');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('modal-active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('modal-active');
    document.body.style.overflow = 'auto';
}

function handleFormSubmit(e, serviceType) {
    e.preventDefault();
    const msg = currentLang === 'ar'
        ? `تم إرسال الطلب بنجاح (${serviceType})`
        : `Request submitted successfully (${serviceType})`;
    alert(msg);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            service: serviceType,
            company: data['company'] || data['name'] || 'Unknown',
            phone: data['phone'] || data['whatsapp'] || '',
            type: data['type'] || '',
            notes: data['moldNotes'] || data['notes'] || '',
            specs: serviceType === 'قوالب 3D' ? data['moldNotes'] || data['notes'] || '' : '',
            submittedAt: new Date().toISOString(),
            status: 'new'
        })
    })
    .then(response => response.json())
    .then(result => {
        // Refresh admin dashboard by reloading the page
        // The admin can refresh manually or it will update via polling
        e.target.reset();
        closeModal('maintenanceModal');
        closeModal('moldModal');
    })
    .catch(err => {
        console.error('Error submitting request:', err);
        alert(currentLang === 'ar' ? 'حدث خطأ في إرسال الطلب' : 'Error submitting request');
    });
}

// Automatically set current year & Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    const yearElem = document.getElementById('year');
    if (yearElem) {
        yearElem.innerText = new Date().getFullYear();
    }

    // Initialize Scroll Reveal (Intersection Observer)
    initScrollReveal();

    // Initialize Dynamic Header scroll effect
    initHeaderScroll();
});

// Scroll Reveal Observer Setup
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Stop observing once animated to avoid re-triggering
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        reveals.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback for older browsers
        reveals.forEach(el => el.classList.add('active'));
    }
}

// Header Dynamic Scroll Styling
function initHeaderScroll() {
    const header = document.getElementById('mainHeader');
    if (!header) return;

    const handleScroll = () => {
        if (window.scrollY > 25) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on load in case page is refreshed while scrolled down
    handleScroll();
}
