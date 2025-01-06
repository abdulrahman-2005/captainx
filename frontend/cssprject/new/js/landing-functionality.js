document.addEventListener('DOMContentLoaded', initializeApp);

const API_BASE_URL = window.location.origin;
let stream = null;

function initializeApp() {
    setupLoginButton();
    setupEventListeners();
    animateOnScroll();
    initializeCounters();
    checkUserStatus();
    updateNavigation();
    
    checkPaymentStatus();
}

function setupLoginButton() {
    const loginButton = document.querySelector('.cta-buttons .cta-button');
    if (loginButton) {
        loginButton.href = `${window.location.origin}/auth/google`;
    }
}

function setupEventListeners() {
    document.getElementById('authBtn')?.addEventListener('click', () => window.location.href = '/auth/google');
    document.getElementById('openCamera')?.addEventListener('click', cameraHandler.openCamera);
    document.getElementById('capturePhoto')?.addEventListener('click', cameraHandler.capturePhoto);
    document.getElementById('registerForm')?.addEventListener('submit', verificationHandler.submitForm);
    
    setupIdCameraHandlers();
}

function animateOnScroll() {
    const elements = document.querySelectorAll('.fade-in, .slide-in');
    const windowHeight = window.innerHeight;

    function checkVisibility() {
        elements.forEach((element) => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < windowHeight - 100) {
                element.classList.add('visible');
            }
        });
    }

    window.addEventListener('scroll', checkVisibility);
    checkVisibility();
}

function initializeCounters() {
    const counters = document.querySelectorAll('.counter');
    const statBoxes = document.querySelectorAll('.stat-box');
    let started = false;

    function checkVisibility() {
        const rect = document.querySelector('.statistics').getBoundingClientRect();
        if (rect.top < window.innerHeight && !started) {
            started = true;
            statBoxes.forEach((box, index) => setTimeout(() => box.classList.add('visible'), index * 200));
            counters.forEach(updateCounter);
        }
    }

    function updateCounter(counter) {
        const target = +counter.getAttribute('data-target');
        const increment = target / 200;
        let count = 0;

        function animate() {
            if (count < target) {
                count = Math.min(count + increment, target);
                counter.innerText = Math.floor(count);
                requestAnimationFrame(animate);
            } else {
                counter.innerText = target;
            }
        }

        animate();
    }

    window.addEventListener('scroll', checkVisibility);
    checkVisibility();
}

const modalHandler = {
    showModal() {
        document.getElementById('registerModal').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    },
    hideModal() {
        document.getElementById('registerModal').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }
};

const cameraHandler = {
    async openCamera() {
        try {
            if (stream) stream.getTracks().forEach(track => track.stop());
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            const preview = document.getElementById('cameraPreview');
            preview.srcObject = stream;
            await preview.play();
            preview.style.display = 'block';
            document.getElementById('capturePhoto').style.display = 'inline-block';
            document.getElementById('openCamera').style.display = 'none';
        } catch (error) {
            console.error('Camera error:', error);
            alert('Error accessing camera. Please make sure you have granted camera permissions.');
        }
    },
    capturePhoto() {
        const preview = document.getElementById('cameraPreview');
        const canvas = document.getElementById('snapshotCanvas');
        canvas.width = preview.videoWidth;
        canvas.height = preview.videoHeight;
        canvas.getContext('2d').drawImage(preview, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        document.getElementById('selfieData').value = imageData;
        document.querySelector('.camera-group .image-preview').innerHTML = `<img src="${imageData}" alt="Selfie Preview" />`;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        preview.style.display = 'none';
        document.getElementById('capturePhoto').style.display = 'none';
        const openButton = document.getElementById('openCamera');
        openButton.style.display = 'inline-block';
        openButton.textContent = 'Retake Photo';
    }
};

const verificationHandler = {
    async submitForm(e) {
        e.preventDefault();
        try {
            const formData = new FormData();
            const userData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                accountNumber: document.getElementById('accountNumber').value,
                phoneNumber: document.getElementById('whatsappNumber').value
            };
            formData.append('data', JSON.stringify(userData));

            const selfieData = document.getElementById('selfieData').value;
            const idImageData = document.getElementById('idImageData').value;
            if (!selfieData || !idImageData) throw new Error('Both profile and ID photos are required');

            const selfieBlob = await fetch(selfieData).then(r => r.blob());
            formData.append('image', selfieBlob, 'selfie.jpg');

            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('email');
            if (!token || !userEmail) throw new Error('Please login first');

            const response = await fetch(`/api/v1/verifid/${userEmail}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.errors?.[0] || data.error || 'Registration failed');

            alert(getMessage('registrationSuccess'));
            modalHandler.hideModal();
            window.location.reload();
        } catch (error) {
            console.error('Form Submission Error:', error);
            alert(error.message || getMessage("registrationFailed"));
        }
    }
};

async function checkUserStatus() {
    const userEmail = localStorage.getItem('email');
    const token = localStorage.getItem('token');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const complaintBtn = document.getElementById('complaintBtn');

    if (!userEmail || !token) {
        loginBtn.style.display = 'inline-flex';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        complaintBtn.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/verfiy/${userEmail}`, {
            headers: {
                authorization: token,
                'content-type': 'application/json',
            },
            method: 'GET',
        });

        if (response.status === 404) {
            localStorage.removeItem('email');
            localStorage.removeItem('token');
            loginBtn.style.display = 'inline-flex';
            registerBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
            return;
        }

        const result = await response.json();
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-flex';

        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('email');
            localStorage.removeItem('token');
            window.location.reload();
        });

        if (result.message && result.message.includes('unverified')) {
            registerBtn.style.display = 'inline-flex';
            complaintBtn.style.display = 'none';
            registerBtn.onclick = modalHandler.showModal;
        } else if (result.message === 'Invalid Authorization' || result.message === 'User not found') {
            localStorage.removeItem('email');
            localStorage.removeItem('token');
            loginBtn.style.display = 'inline-flex';
            registerBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
            complaintBtn.style.display = 'none';
        } else {
            registerBtn.style.display = 'none';
            if (result.admin) {
                document.querySelector('a[href="admin.html"]').style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        localStorage.removeItem('email');
        localStorage.removeItem('token');
        loginBtn.style.display = 'inline-flex';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

async function handleApprovedPurchase(plan) {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    try {
        const checkResponse = await fetch('/api/v1/check-payment', {
            headers: { 'Authorization': token }
        });
        const checkData = await checkResponse.json();
        if (checkData.hasPaid && checkData.currentPlan === plan) {
            alert(getMessage('errors.purchaseExists'));
            return;
        }

        const response = await fetch('/api/v1/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ email, plan })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            window.location.href = data.url;
        } else {
            alert(data.error || getMessage('errors.default'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert(getMessage('errors.paymentError'));
    }
}

async function checkApprovedPurchases() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (!token || !email) return;

    try {
        const response = await fetch('/api/v1/check-approved-purchases', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok && data.approvedPurchases && data.approvedPurchases.length > 0) {
            const purchase = data.approvedPurchases[0];
            if (confirm('Your purchase request has been approved! Would you like to proceed to checkout?')) {
                handleApprovedPurchase(purchase.plan);
            }
        }
    } catch (error) {
        console.error('Error checking approved purchases:', error);
    }
}

async function checkPaymentStatus() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (!token || !email) return;

    try {
        const response = await fetch('/api/v1/check-payment', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok) {
            if (data.currentPlan && data.hasPaid) {
                console.log('User has active paid plan:', data.currentPlan);
                return true;
            } else if (data.currentPlan && !data.hasPaid) {
                console.log('User needs to pay for plan:', data.currentPlan);
                alert(getMessage('errors.paymentRequired'));
                // redirect to payment page if needed
                const userResponse = confirm('Would you like to proceed to payment?');
                if (userResponse) {
                    window.location.href = '/payment.html';
                }

                return false;
            }
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
    }
}

const idCameraHandler = {
    async openCamera() {
        try {
            const preview = document.getElementById('idCameraPreview');
            const captureBtn = document.getElementById('captureIdPhoto');
            const openBtn = document.getElementById('openIdCamera');
            const fileInput = document.getElementById('idFile');

            if (window.idStream) {
                window.idStream.getTracks().forEach(track => track.stop());
            }

            window.idStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            preview.srcObject = window.idStream;
            await preview.play();

            preview.style.display = "block";
            captureBtn.style.display = "inline-block";
            openBtn.style.display = "none";
            fileInput.style.display = "none";
        } catch (error) {
            console.error('ID Camera error:', error);
            alert(getMessage('errors.cameraError'));
        }
    },
    capturePhoto() {
        try {
            const preview = document.getElementById('idCameraPreview');
            const canvas = document.getElementById('idSnapshotCanvas');
            const idImageInput = document.getElementById('idImageData');
            const captureBtn = document.getElementById('captureIdPhoto');
            const openBtn = document.getElementById('openIdCamera');
            const fileInput = document.getElementById('idFile');
            const previewDiv = document.getElementById('idPreview');

            canvas.width = preview.videoWidth;
            canvas.height = preview.videoHeight;
            canvas.getContext('2d').drawImage(preview, 0, 0, canvas.width, canvas.height);

            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            idImageInput.value = imageData;

            previewDiv.innerHTML = `<img src="${imageData}" alt="ID Preview" />`;

            if (window.idStream) {
                window.idStream.getTracks().forEach(track => track.stop());
            }

            preview.style.display = 'none';
            captureBtn.style.display = 'none';
            openBtn.style.display = 'inline-block';
            fileInput.style.display = 'inline-block';
            openBtn.textContent = 'Retake Photo';
        } catch (error) {
            console.error('Error capturing ID photo:', error);
            alert(getMessage('errors.captureError'));
        }
    }
};

function setupIdCameraHandlers() {
    const openIdCameraBtn = document.getElementById('openIdCamera');
    const captureIdPhotoBtn = document.getElementById('captureIdPhoto');
    const idFileInput = document.getElementById('idFile');

    if (openIdCameraBtn) {
        openIdCameraBtn.addEventListener('click', idCameraHandler.openCamera);
    }

    if (captureIdPhotoBtn) {
        captureIdPhotoBtn.addEventListener('click', idCameraHandler.capturePhoto);
    }

    if (idFileInput) {
        idFileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const idImageInput = document.getElementById('idImageData');
                    const previewDiv = document.getElementById('idPreview');

                    if (idImageInput) {
                        idImageInput.value = event.target.result;
                    }

                    if (previewDiv) {
                        previewDiv.innerHTML = `<img src="${event.target.result}" alt="ID Preview" />`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function hideAdminLinks() {
    document.querySelectorAll('.admin-only').forEach(link => link.style.display = 'none');
}

function showAdminLinks() {
    document.querySelectorAll('.admin-only').forEach(link => link.style.display = 'block');
}

async function updateNavigation() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    await checkUserStatus();
    if (!token || !email) {
        hideAdminLinks();
        hideCoursesLink();
        return;
    }

    try {
        const adminResponse = await fetch(`/api/admin/check-access?email=${email}`, {
            headers: { 'Authorization': token }
        });

        const adminData = await adminResponse.json();
        if (adminData.isAdmin) {
            showAdminLinks();
        } else {
            hideAdminLinks();
        }

        const paymentResponse = await fetch('/api/v1/check-payment', {
            headers: { 'Authorization': token }
        });

        if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            if (paymentData.hasPaid) {
                showCoursesLink();
            } else {
                hideCoursesLink();
            }
        } else {
            hideCoursesLink();
        }

        await fetch(`/api/v1/verfiy/${email}`, {
            headers: { 'Authorization': token }
        });

    } catch (error) {
        console.error('Error checking status:', error);
        hideAdminLinks();
        hideCoursesLink();
    }
}

function hideCoursesLink() {
    const coursesLink = document.getElementById('coursesLink');
    if (coursesLink) coursesLink.style.display = 'none';
}

function showCoursesLink() {
    const coursesLink = document.getElementById('coursesLink');
    if (coursesLink) coursesLink.style.display = 'block';
}

function onLoginSuccess() {
    updateNavigation();
    checkApprovedPurchases();
    checkPaymentStatus();
}

function logout() {
    localStorage.clear();
    hideAdminLinks();
    hideCoursesLink();
    window.location.href = '/';
}

// Update the plan buttons event listeners
document.querySelectorAll('.plan-btn').forEach(button => {
    button.addEventListener('click', async () => {
        const plan = button.getAttribute('data-plan');
        const planNumber = {
            'basic': 1,
            'pro': 2,
            'elite': 3
        }[plan];

        if (!planNumber) {
            alert(getMessage('errors.invalidPlan'));
            return;
        }

        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');

        if (!token || !email) {
            alert(getMessage('loginFirst'));
            window.location.href = '/';
            return;
        }

        try {
            // Check user status first
            const statusResponse = await fetch(`/api/v1/verfiy/${email}`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!statusResponse.ok) {
                const statusError = await statusResponse.json();
                console.log(statusError);
                throw new Error(statusError.error || getMessage('verifyError'));
            }

            const statusData = await statusResponse.json();

            if (!statusData.approved) {
                alert(getMessage('approvalNeeded'));
                return;
            }

            // Submit purchase request
            const response = await fetch('/api/v1/purchase-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ email, plan: planNumber })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.updated ? getMessage('updateSuccess') : getMessage('submitSuccess'));
            } else {
                // Handle specific error cases
                switch (data.error) {
                    case 'User not found':
                        throw new Error(getMessage('errors.userNotFound'));
                    case 'Invalid plan':
                        throw new Error(getMessage('errors.invalidPlan'));
                    case 'Purchase already exists':
                        throw new Error(getMessage('errors.purchaseExists'));
                    case 'Not authorized':
                        throw new Error(getMessage('errors.notAuthorized'));
                    case 'Registration not approved':
                        throw new Error(getMessage('errors.notApproved'));
                    default:
                        throw new Error(data.error || getMessage('errors.default'));
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || getMessage('errors.default'));
            
        }
    });
});


// generate the messages object with all translations

const messages = {
    en: {
        loginFirst: 'Please login first',
        approvalNeeded: 'Your registration request is pending approval',
        registrationSuccess: 'Registration successful! You can now access the platform',
        registrationFailed: 'Registration failed. Please try again',
        submitSuccess: 'Purchase request submitted successfully',
        updateSuccess: 'Purchase request updated successfully',
        errors: {
            default: 'An error occurred. Please try again',
            cameraError: 'Error accessing camera. Please make sure you have granted camera permissions',
            captureError: 'Error capturing photo. Please try again',
            purchaseExists: 'You already have an active subscription',
            paymentError: 'Error processing payment. Please try again',
            paymentRequired: 'You need to pay for your current plan',
            invalidPlan: 'Invalid plan selected',
            userNotFound: 'User not found. Please login again',
            notAuthorized: 'You are not authorized to perform this action',
            notApproved: 'Your registration has not been approved yet'
        }
    },
    ar: {
        loginFirst: 'الرجاء تسجيل الدخول أولاً',
        approvalNeeded: 'طلب التسجيل الخاص بك قيد الموافقة',
        registrationSuccess: 'تم التسجيل بنجاح! يمكنك الآن الوصول إلى المنصة',
        registrationFailed: 'فشل التسجيل. يرجى المحاولة مرة أخرى',
        submitSuccess: 'تم إرسال طلب الشراء بنجاح',
        updateSuccess: 'تم تحديث طلب الشراء بنجاح',
        errors: {
            default: 'حدث خطأ. يرجى المحاولة مرة أخرى',
            cameraError: 'خطأ في الوصول إلى الكاميرا. يرجى التأكد من منح صلاحيات الكاميرا',
            captureError: 'خطأ في التقاط الصورة. يرجى المحاولة مرة أخرى',
            purchaseExists: 'لديك بالفعل اشتراك نشط',
            paymentError: 'خطأ في معالجة الدفع. يرجى المحاولة مرة أخرى',
            paymentRequired: 'يجب عليك دفع رسوم اشتراكك الحالي',
            invalidPlan: 'الخطة المحددة غير صالحة',
            userNotFound: 'المستخدم غير موجود. الرجاء تسجيل الدخول مرة أخرى',
            notAuthorized: 'ليس لديك صلاحية لأداء هذا الإجراء',
            notApproved: 'لم يتم الموافقة على تسجيلك بعد'
        }
    }
};



function getMessage(key) {
    const language = window.location.pathname.includes('arabind') ? 'ar' : 'en';

    if (key.includes('.')) {
        const [section, subKey] = key.split('.');
        return messages[language][section][subKey];
    }
    return messages[language][key];
}