// app.js

// ----------------------------------------------------------------------------
// 0. Global State Management (إدارة الحالة العالمية)
//    In a real app, consider libraries like Redux, Vuex, or React Context API.
// ----------------------------------------------------------------------------
const appState = {
    currentPage: 'home', // 'home', 'create', 'scan', 'history', 'myQRs', 'settings'
    currentUser: null, // { uid: '...', name: '...', email: '...', method: 'google' } or null for guest
    currentQRData: {}, // Data for the QR code being created
    scannedHistory: [],
    createdQRs: [],
    selectedQRType: null,
    qrPreviewDataUrl: '', // Base64 image data for QR preview
    settings: {
        vibrationOnScan: true,
        autoOpenContent: true,
    },
    // Mock data for demonstration
    mockCreatedQRs: [
        { id: "uzTuADHO", name: "WhatsApp Chat", type: "WhatsApp", created: "12.07.2025", url: "https://wa.me/1234567890", isFavorite: false },
        { id: "abcdefgh", name: "My Website", type: "URL", created: "10.07.2025", url: "https://www.example.com", isFavorite: true },
    ],
    mockScannedHistory: [
        { id: "scan001", name: "Product Info", type: "URL", scanned: "13.07.2025", url: "https://product.info/xyz" },
        { id: "scan002", name: "WiFi Network", type: "WiFi", scanned: "13.07.2025", url: "WIFI:S:MyNetwork;T:WPA;P:MyPassword;;" },
    ]
};

// ----------------------------------------------------------------------------
// 1. Utility Functions (وظائف مساعدة)
// ----------------------------------------------------------------------------
const Utils = {
    // DOM Manipulation Helpers
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),
    hideElement: (selector) => Utils.$(selector)?.classList.add('hidden'),
    showElement: (selector) => Utils.$(selector)?.classList.remove('hidden'),
    toggleElement: (selector) => Utils.$(selector)?.classList.toggle('hidden'),

    // Page Navigation
    navigateTo: (pageName) => {
        // Hide all main page sections
        Utils.$$('.app-page').forEach(page => page.classList.add('hidden'));
        // Show the target page
        Utils.$(`#${pageName}-page`)?.classList.remove('hidden');
        appState.currentPage = pageName;
        console.log(`Mapsd to: ${pageName}`);
        // Specific page initialization logic
        if (pageName === 'history') HistoryModule.renderHistory();
        if (pageName === 'myQRs') MyQRsModule.renderMyQRs();
        if (pageName === 'settings') SettingsModule.renderSettings();
        if (pageName === 'create-qr') QRGenerator.resetForm(); // Reset form on navigation
    },

    // UI Feedback
    showToast: (message, type = 'info', duration = 3000) => {
        const toast = Utils.$('#toast-message');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast ${type} show`;
            setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
    },
    showSpinner: (selector = '#main-spinner') => Utils.showElement(selector),
    hideSpinner: (selector = '#main-spinner') => Utils.hideElement(selector),

    // Data Storage (Mock for localStorage - In production, use backend)
    saveToLocalStorage: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving to local storage:", e);
        }
    },
    loadFromLocalStorage: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Error loading from local storage:", e);
            return null;
        }
    },
    uuidv4: () => { // Simple UUID generator
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    // Simple date formatter
    formatDate: (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear().toString().slice(-2)}`;
    }
};

// ----------------------------------------------------------------------------
// 2. Authentication Module (AuthModule)
//    Focus on Google/Apple Sign-in and Guest Mode.
// ----------------------------------------------------------------------------
const AuthModule = {
    init: () => {
        // Initialize Firebase Auth (if using Firebase) or similar SDKs
        // For demonstration, we'll just simulate login/logout.
        AuthModule.checkSession();

        // Event Listeners for login buttons
        Utils.$('#google-login-btn')?.addEventListener('click', AuthModule.signInWithGoogle);
        Utils.$('#apple-login-btn')?.addEventListener('click', AuthModule.signInWithApple);
        Utils.$('#guest-login-btn')?.addEventListener('click', AuthModule.signInAsGuest);
        Utils.$('#logout-btn')?.addEventListener('click', AuthModule.signOut);
    },

    checkSession: () => {
        // In a real app, check for existing user session (e.g., from Firebase or a token)
        const storedUser = Utils.loadFromLocalStorage('seastarqr_user');
        if (storedUser) {
            appState.currentUser = storedUser;
            AuthModule.updateUIForLoggedInUser();
        } else {
            AuthModule.updateUIForLoggedOutUser();
        }
    },

    signInWithGoogle: async () => {
        Utils.showSpinner('#auth-spinner');
        console.log('Attempting Google Sign-in...');
        // Simulate Google sign-in process
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        const user = { uid: Utils.uuidv4(), name: 'Google User', email: 'user@gmail.com', method: 'google' };
        appState.currentUser = user;
        Utils.saveToLocalStorage('seastarqr_user', user);
        AuthModule.updateUIForLoggedInUser();
        Utils.showToast('Signed in with Google!', 'success');
        Utils.hideSpinner('#auth-spinner');
        Utils.navigateTo('home');
    },

    signInWithApple: async () => {
        Utils.showSpinner('#auth-spinner');
        console.log('Attempting Apple Sign-in...');
        // Simulate Apple sign-in process
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        const user = { uid: Utils.uuidv4(), name: 'Apple User', email: 'user@apple.com', method: 'apple' };
        appState.currentUser = user;
        Utils.saveToLocalStorage('seastarqr_user', user);
        AuthModule.updateUIForLoggedInUser();
        Utils.showToast('Signed in with Apple!', 'success');
        Utils.hideSpinner('#auth-spinner');
        Utils.navigateTo('home');
    },

    signInAsGuest: () => {
        appState.currentUser = { uid: 'guest-' + Utils.uuidv4(), name: 'Guest', email: null, method: 'guest' };
        Utils.saveToLocalStorage('seastarqr_user', appState.currentUser);
        AuthModule.updateUIForLoggedInUser();
        Utils.showToast('Welcome, Guest!', 'info');
        Utils.navigateTo('home');
    },

    signOut: async () => {
        Utils.showSpinner();
        console.log('Signing out...');
        // Simulate sign-out process
        await new Promise(resolve => setTimeout(resolve, 1000));
        appState.currentUser = null;
        localStorage.removeItem('seastarqr_user');
        AuthModule.updateUIForLoggedOutUser();
        Utils.showToast('Signed out.', 'info');
        Utils.hideSpinner();
        Utils.navigateTo('login'); // Go back to login screen
    },

    updateUIForLoggedInUser: () => {
        Utils.hideElement('#login-page');
        Utils.showElement('#app-content');
        Utils.showElement('#logout-btn');
        Utils.hideElement('#login-buttons'); // Hide login buttons once logged in
        Utils.$('#welcome-message').textContent = `Welcome, ${appState.currentUser.name}!`;
    },

    updateUIForLoggedOutUser: () => {
        Utils.showElement('#login-page');
        Utils.hideElement('#app-content');
        Utils.hideElement('#logout-btn');
        Utils.showElement('#login-buttons'); // Show login buttons
        Utils.navigateTo('login');
    },

    // Account Management for Settings page
    deleteAccount: async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        Utils.showSpinner();
        console.log('Deleting account...');
        // In a real app: call backend API to delete user data
        await new Promise(resolve => setTimeout(resolve, 2000));
        AuthModule.signOut(); // Sign out after "deletion"
        Utils.showToast('Account deleted successfully.', 'success');
        Utils.hideSpinner();
    }
};

// ----------------------------------------------------------------------------
// 3. QR Code Generator Module (QRGenerator)
//    Handles content type selection, input forms, customization, and generation.
// ----------------------------------------------------------------------------
const QRGenerator = {
    qrCodeInstance: null, // Holds the QR code instance (e.g., from QRCode.js)
    qrTypes: {
        "URL": { icon: "🔗", fields: [{ id: "urlInput", label: "URL", type: "url", required: true, placeholder: "https://example.com" }] },
        "Text": { icon: "📝", fields: [{ id: "textInput", label: "Text", type: "textarea", required: true, maxLength: 500 }] },
        "WhatsApp": { icon: "💬", fields: [{ id: "waPhone", label: "Phone Number", type: "tel", required: true, pattern: "\\+?[0-9]{7,15}" }, { id: "waMessage", label: "Message (Optional)", type: "textarea", maxLength: 200 }] },
        "PDF": { icon: "📄", fields: [{ id: "pdfUpload", label: "Upload PDF", type: "file", accept: ".pdf" }] },
        "Image": { icon: "🖼️", fields: [{ id: "imageUpload", label: "Upload Image", type: "file", accept: ".png,.jpeg,.jpg" }] },
        // ... more types (50+ types would be defined here)
        "WiFi": { icon: "📶", fields: [
            { id: "wifiSsid", label: "SSID", type: "text", required: true },
            { id: "wifiPassword", label: "Password", type: "password", required: false },
            { id: "wifiEncryption", label: "Encryption", type: "select", options: ["None", "WPA/WPA2", "WEP"], required: true }
        ]},
        "Booking": { icon: "📅", fields: [
            { id: "bookingDuration", label: "Duration (minutes)", type: "range", min: 30, max: 120, step: 15 },
            { id: "bookingDays", label: "Available Days", type: "checkbox-group", options: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
            // ... more complex booking fields (time ranges, etc.)
        ]}
    },

    init: () => {
        QRGenerator.renderQRTypeSelection();
        // Event listeners for navigation and form steps
        Utils.$('#create-qr-btn')?.addEventListener('click', () => Utils.navigateTo('create-qr'));
        Utils.$('#back-to-type-selection')?.addEventListener('click', () => QRGenerator.showStep('type-selection'));
        Utils.$('#back-to-content-editor')?.addEventListener('click', () => QRGenerator.showStep('content-editor'));
        Utils.$('#next-to-design')?.addEventListener('click', QRGenerator.handleContentNext);
        Utils.$('#generate-qr-btn')?.addEventListener('click', QRGenerator.generateQR);
        Utils.$('#download-qr-btn')?.addEventListener('click', QRGenerator.downloadQR);
    },

    renderQRTypeSelection: () => {
        const container = Utils.$('#qr-type-selection');
        container.innerHTML = ''; // Clear previous types
        Object.entries(QRGenerator.qrTypes).forEach(([type, details]) => {
            const card = document.createElement('div');
            card.className = 'qr-type-card';
            card.innerHTML = `
                <div class="icon">${details.icon}</div>
                <div class="name">${type}</div>
            `;
            card.addEventListener('click', () => QRGenerator.selectQRType(type));
            container.appendChild(card);
        });
        QRGenerator.showStep('type-selection');
    },

    selectQRType: (type) => {
        appState.selectedQRType = type;
        QRGenerator.renderContentEditor(type);
        QRGenerator.showStep('content-editor');
    },

    renderContentEditor: (type) => {
        const contentEditor = Utils.$('#content-input-fields');
        contentEditor.innerHTML = ''; // Clear previous fields
        const typeDetails = QRGenerator.qrTypes[type];
        if (!typeDetails) {
            contentEditor.innerHTML = '<p>Invalid QR type selected.</p>';
            return;
        }

        Utils.$('#content-editor-title').textContent = `Enter Content for ${type} QR`;

        typeDetails.fields.forEach(field => {
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'form-group';
            let inputElement;

            switch (field.type) {
                case 'url':
                case 'text':
                case 'tel':
                case 'password':
                    inputElement = document.createElement('input');
                    inputElement.type = field.type === 'url' ? 'url' : field.type;
                    inputElement.id = field.id;
                    inputElement.placeholder = field.placeholder || '';
                    if (field.pattern) inputElement.pattern = field.pattern;
                    break;
                case 'textarea':
                    inputElement = document.createElement('textarea');
                    inputElement.id = field.id;
                    inputElement.maxLength = field.maxLength || 500;
                    break;
                case 'file':
                    inputElement = document.createElement('input');
                    inputElement.type = 'file';
                    inputElement.id = field.id;
                    inputElement.accept = field.accept || '*/*';
                    inputElement.addEventListener('change', (e) => QRGenerator.handleFileUpload(e, field.id));
                    break;
                case 'select':
                    inputElement = document.createElement('select');
                    inputElement.id = field.id;
                    field.options.forEach(optionText => {
                        const option = document.createElement('option');
                        option.value = optionText;
                        option.textContent = optionText;
                        inputElement.appendChild(option);
                    });
                    break;
                case 'range':
                    inputElement = document.createElement('input');
                    inputElement.type = 'range';
                    inputElement.id = field.id;
                    inputElement.min = field.min || 0;
                    inputElement.max = field.max || 100;
                    inputElement.step = field.step || 1;
                    const valueDisplay = document.createElement('span');
                    valueDisplay.id = `${field.id}-value`;
                    valueDisplay.textContent = inputElement.value;
                    inputElement.addEventListener('input', () => valueDisplay.textContent = inputElement.value);
                    fieldContainer.appendChild(valueDisplay);
                    break;
                case 'checkbox-group':
                    inputElement = document.createElement('div');
                    inputElement.id = field.id;
                    field.options.forEach(optionText => {
                        const checkboxId = `${field.id}-${optionText.toLowerCase()}`;
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = checkboxId;
                        checkbox.value = optionText;
                        const label = document.createElement('label');
                        label.htmlFor = checkboxId;
                        label.textContent = optionText;
                        inputElement.appendChild(checkbox);
                        inputElement.appendChild(label);
                        inputElement.appendChild(document.createElement('br'));
                    });
                    break;
            }

            if (inputElement) {
                const label = document.createElement('label');
                label.htmlFor = field.id;
                label.textContent = field.label + (field.required ? ' *' : '');
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(inputElement);
                contentEditor.appendChild(fieldContainer);
            }
        });

        // Add dynamic content options for "dynamic QR codes" if applicable
        if (type === "URL" || type === "Text") { // Only specific types can be dynamic
            const dynamicQRSection = document.createElement('div');
            dynamicQRSection.className = 'form-group dynamic-qr-options';
            dynamicQRSection.innerHTML = `
                <h4>Dynamic QR Settings</h4>
                <p>Change content based on conditions (GPS, time, scan count, language)</p>
                <button id="add-dynamic-rule-btn" class="btn secondary-btn">Add Dynamic Rule</button>
                <div id="dynamic-rules-container"></div>
            `;
            contentEditor.appendChild(dynamicQRSection);
            Utils.$('#add-dynamic-rule-btn')?.addEventListener('click', QRGenerator.addDynamicRule);
        }
    },

    addDynamicRule: () => {
        const container = Utils.$('#dynamic-rules-container');
        const ruleIndex = container.children.length;
        const ruleHtml = `
            <div class="dynamic-rule-card" data-rule-index="${ruleIndex}">
                <select id="dynamic-condition-${ruleIndex}">
                    <option value="">Select Condition</option>
                    <option value="location">Location (GPS)</option>
                    <option value="time">Time</option>
                    <option value="scan_count">Scan Count</option>
                    <option value="language">Language</option>
                </select>
                <input type="text" id="dynamic-content-${ruleIndex}" placeholder="Content for this rule" required>
                <div class="condition-details" id="condition-details-${ruleIndex}"></div>
                <button class="btn delete-rule-btn" data-rule-index="${ruleIndex}">Delete</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', ruleHtml);

        Utils.$(`#dynamic-condition-${ruleIndex}`)?.addEventListener('change', (event) => {
            QRGenerator.renderDynamicConditionDetails(event.target.value, ruleIndex);
        });
        Utils.$(`.delete-rule-btn[data-rule-index="${ruleIndex}"]`)?.addEventListener('click', (event) => {
            event.target.closest('.dynamic-rule-card').remove();
        });
    },

    renderDynamicConditionDetails: (conditionType, index) => {
        const detailsContainer = Utils.$(`#condition-details-${index}`);
        detailsContainer.innerHTML = '';
        switch (conditionType) {
            case 'location':
                detailsContainer.innerHTML = `<input type="text" id="loc-country-${index}" placeholder="Country Code (e.g., US, DE)">`;
                break;
            case 'time':
                detailsContainer.innerHTML = `
                    <input type="time" id="time-start-${index}">
                    <input type="time" id="time-end-${index}">
                `;
                break;
            case 'scan_count':
                detailsContainer.innerHTML = `<input type="number" id="scan-count-${index}" placeholder="Min Scans" min="1">`;
                break;
            case 'language':
                detailsContainer.innerHTML = `<input type="text" id="lang-code-${index}" placeholder="Language Code (e.g., en, ar)">`;
                break;
        }
    },

    handleContentNext: () => {
        if (!QRGenerator.validateContentForm()) {
            Utils.showToast('Please fill all required fields.', 'error');
            return;
        }
        QRGenerator.collectContentData();
        QRGenerator.renderDesignEditor();
        QRGenerator.showStep('design-editor');
    },

    validateContentForm: () => {
        const typeDetails = QRGenerator.qrTypes[appState.selectedQRType];
        if (!typeDetails) return false;

        let isValid = true;
        typeDetails.fields.forEach(field => {
            const input = Utils.$(`#${field.id}`);
            if (field.required && (!input || input.value.trim() === '')) {
                input?.classList.add('error');
                isValid = false;
            } else {
                input?.classList.remove('error');
            }
            if (field.type === 'file' && field.accept) {
                const file = input?.files[0];
                if (file) {
                    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                    if (!field.accept.includes(fileExtension)) {
                        Utils.showToast(`Unsupported file type for ${field.label}. Supported: ${field.accept}`, 'error');
                        input?.classList.add('error');
                        isValid = false;
                    } else {
                        input?.classList.remove('error');
                    }
                }
            }
        });
        return isValid;
    },

    collectContentData: () => {
        const type = appState.selectedQRType;
        const typeDetails = QRGenerator.qrTypes[type];
        const contentData = { type: type, values: {} };

        typeDetails.fields.forEach(field => {
            const input = Utils.$(`#${field.id}`);
            if (input) {
                if (field.type === 'file') {
                    // For files, we store a temporary URL or base64 (for small files)
                    // In a real app, files would be uploaded to cloud storage
                    const file = input.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            contentData.values[field.id] = reader.result; // Base64
                            appState.currentQRData.content = contentData;
                            QRGenerator.updateQRPreview(); // Update preview after file loaded
                        };
                        reader.readAsDataURL(file);
                    } else {
                        contentData.values[field.id] = null;
                    }
                } else if (field.type === 'checkbox-group') {
                    contentData.values[field.id] = Array.from(input.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                }
                else {
                    contentData.values[field.id] = input.value;
                }
            }
        });

        // Collect dynamic rules
        const dynamicRules = [];
        Utils.$$('#dynamic-rules-container .dynamic-rule-card').forEach((card, index) => {
            const conditionType = Utils.$(`#dynamic-condition-${index}`)?.value;
            const dynamicContent = Utils.$(`#dynamic-content-${index}`)?.value;
            if (conditionType && dynamicContent) {
                const rule = { condition: conditionType, content: dynamicContent };
                switch (conditionType) {
                    case 'location':
                        rule.country = Utils.$(`#loc-country-${index}`)?.value;
                        break;
                    case 'time':
                        rule.start = Utils.$(`#time-start-${index}`)?.value;
                        rule.end = Utils.$(`#time-end-${index}`)?.value;
                        break;
                    case 'scan_count':
                        rule.minScans = Utils.$(`#scan-count-${index}`)?.value;
                        break;
                    case 'language':
                        rule.langCode = Utils.$(`#lang-code-${index}`)?.value;
                        break;
                }
                dynamicRules.push(rule);
            }
        });

        appState.currentQRData.content = { ...contentData, dynamicRules };
    },

    renderDesignEditor: () => {
        const designEditor = Utils.$('#design-editor-controls');
        designEditor.innerHTML = `
            <h3>Customize QR Design</h3>
            <div class="form-group">
                <label for="header-image-upload">Header Image</label>
                <input type="file" id="header-image-upload" accept=".png,.jpeg,.jpg">
                <label><input type="checkbox" id="make-header-round"> Make it Round</label>
            </div>
            <div class="form-group">
                <label for="qr-title">QR Title</label>
                <input type="text" id="qr-title" placeholder="Optional title">
            </div>
            <div class="form-group">
                <label for="qr-description">QR Description</label>
                <textarea id="qr-description" placeholder="Optional description"></textarea>
            </div>
            <div class="form-group">
                <label for="primary-color">Primary Color</label>
                <input type="color" id="primary-color" value="#2F6BFF">
                <input type="text" id="primary-color-hex" value="#2F6BFF" pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$">
            </div>
            <div class="form-group">
                <label for="background-color">Background Color</label>
                <input type="color" id="background-color" value="#FFFFFF">
            </div>
            <div class="form-group">
                <label for="qr-label">QR Label (Internal)</label>
                <input type="text" id="qr-label" placeholder="e.g., My Business Card QR">
            </div>
            <div class="form-group">
                <label for="qr-tag">QR Category (for filtering)</label>
                <input type="text" id="qr-tag" placeholder="e.g., Marketing, Personal">
            </div>
        `;

        // Event listeners for design changes to update preview
        Utils.$('#header-image-upload')?.addEventListener('change', QRGenerator.handleHeaderImageUpload);
        Utils.$('#make-header-round')?.addEventListener('change', QRGenerator.updateQRPreview);
        Utils.$('#qr-title')?.addEventListener('input', QRGenerator.updateQRPreview);
        Utils.$('#qr-description')?.addEventListener('input', QRGenerator.updateQRPreview);
        Utils.$('#primary-color')?.addEventListener('input', (e) => {
            Utils.$('#primary-color-hex').value = e.target.value.toUpperCase();
            QRGenerator.updateQRPreview();
        });
        Utils.$('#primary-color-hex')?.addEventListener('input', (e) => {
            const hex = e.target.value;
            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
                Utils.$('#primary-color').value = hex;
                QRGenerator.updateQRPreview();
            }
        });
        Utils.$('#background-color')?.addEventListener('input', QRGenerator.updateQRPreview);

        // Initialize design data
        appState.currentQRData.design = {
            primaryColor: '#2F6BFF',
            backgroundColor: '#FFFFFF',
            logo: null, // base64 encoded
            isLogoRound: false,
            title: '',
            description: ''
        };
        appState.currentQRData.metadata = {
            name: '',
            tag: '',
            created: Utils.formatDate(new Date())
        };

        QRGenerator.updateQRPreview(); // Initial preview render
    },

    handleHeaderImageUpload: (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                appState.currentQRData.design.logo = reader.result; // Base64
                QRGenerator.updateQRPreview();
            };
            reader.readAsDataURL(file);
        } else {
            appState.currentQRData.design.logo = null;
            QRGenerator.updateQRPreview();
        }
    },

    updateQRPreview: () => {
        const qrContent = QRGenerator.buildQRContentString();
        const design = appState.currentQRData.design;
        design.primaryColor = Utils.$('#primary-color')?.value || '#2F6BFF';
        design.backgroundColor = Utils.$('#background-color')?.value || '#FFFFFF';
        design.isLogoRound = Utils.$('#make-header-round')?.checked || false;
        design.title = Utils.$('#qr-title')?.value || '';
        design.description = Utils.$('#qr-description')?.value || '';

        const qrCodeElement = Utils.$('#qr-code-preview');
        if (qrCodeElement) {
            // Clear previous QR
            qrCodeElement.innerHTML = '';
            
            // Use a QR code library (e.g., QRCode.js or qr-code-styling)
            // For simplicity, let's assume QRCode.js is available globally
            // Or you would import it: import QRCode from 'qrcode.js';
            if (typeof QRCode !== 'undefined') {
                QRGenerator.qrCodeInstance = new QRCode(qrCodeElement, {
                    text: qrContent,
                    width: 256,
                    height: 256,
                    colorDark: design.primaryColor,
                    colorLight: design.backgroundColor,
                    correctLevel: QRCode.CorrectLevel.H
                });

                // Add custom logo and text directly to the canvas/SVG if the library supports it
                // QRCode.js doesn't natively support logo directly. For logos, you'd typically overlay an image
                // or use a more advanced library like 'qr-code-styling'
                // This is a simplified visual representation.
                if (design.logo) {
                    const img = document.createElement('img');
                    img.src = design.logo;
                    img.style.width = '50px';
                    img.style.height = '50px';
                    img.style.position = 'absolute';
                    img.style.top = 'calc(50% - 25px)';
                    img.style.left = 'calc(50% - 25px)';
                    img.style.borderRadius = design.isLogoRound ? '50%' : '0';
                    img.style.border = `2px solid ${design.backgroundColor}`;
                    qrCodeElement.style.position = 'relative'; // Ensure positioning context
                    qrCodeElement.appendChild(img);
                }
                 // Add title and description below QR
                const infoDiv = document.createElement('div');
                infoDiv.className = 'qr-preview-info';
                if (design.title) {
                    const titleElem = document.createElement('h4');
                    titleElem.textContent = design.title;
                    infoDiv.appendChild(titleElem);
                }
                if (design.description) {
                    const descElem = document.createElement('p');
                    descElem.textContent = design.description;
                    infoDiv.appendChild(descElem);
                }
                if (design.title || design.description) {
                    qrCodeElement.appendChild(infoDiv);
                }

            } else {
                qrCodeElement.textContent = 'QR Code library not loaded.';
            }
        }
    },

    buildQRContentString: () => {
        // This function would construct the actual string that the QR code encodes
        // based on the selected type and entered data.
        // For dynamic QRs, this would encode a URL to a backend service that
        // redirects based on the dynamic rules.
        const content = appState.currentQRData.content;
        if (!content) return "No content yet";

        let qrString = '';

        switch (content.type) {
            case 'URL':
                qrString = content.values.urlInput || 'https://default.com';
                break;
            case 'Text':
                qrString = content.values.textInput || 'Empty Text';
                break;
            case 'WhatsApp':
                const phone = content.values.waPhone;
                const message = content.values.waMessage;
                qrString = `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
                break;
            case 'WiFi':
                const ssid = content.values.wifiSsid;
                const pass = content.values.wifiPassword;
                const encryption = content.values.wifiEncryption;
                qrString = `WIFI:S:${ssid};T:${encryption === 'None' ? 'nopass' : encryption};P:${pass};;`;
                break;
            case 'PDF': // For files, the QR would point to a hosted URL
            case 'Image':
                qrString = "https://your-backend.com/file_host/some_id"; // Placeholder
                break;
            case 'Booking':
                const duration = content.values.bookingDuration;
                const days = content.values.bookingDays?.join(',');
                qrString = `BOOKING:DURATION=${duration};DAYS=${days};URL=https://your-backend.com/book/${Utils.uuidv4()}`;
                break;
            default:
                qrString = "Unsupported QR Type";
        }

        // Handle dynamic rules - this would typically involve encoding a *single* URL
        // that points to your backend, and the backend resolves the dynamic content.
        if (content.dynamicRules && content.dynamicRules.length > 0) {
            // For demo, we'll just append a marker, but in reality, this is complex.
            const dynamicHash = btoa(JSON.stringify(content.dynamicRules)); // Base64 encode rules
            qrString = `https://your-backend.com/dynamic_qr/${Utils.uuidv4()}?rules=${dynamicHash}`;
        }

        return qrString;
    },

    generateQR: () => {
        Utils.showSpinner();
        // Simulate API call to backend to truly generate/store the QR code and get its permanent URL
        const finalQRContent = QRGenerator.buildQRContentString();
        const designData = appState.currentQRData.design;
        const metadata = appState.currentQRData.metadata;

        metadata.name = Utils.$('#qr-label')?.value || 'Unnamed QR';
        metadata.tag = Utils.$('#qr-tag')?.value || 'General';

        const newQR = {
            id: Utils.uuidv4(),
            name: metadata.name,
            type: appState.selectedQRType,
            created: Utils.formatDate(new Date()),
            url: finalQRContent, // This would be the short URL from backend
            isFavorite: false,
            design: designData,
            content: appState.currentQRData.content
        };

        // In a real app, send newQR to backend to save
        // Then add to local createdQRs array if successful
        appState.createdQRs.push(newQR);
        Utils.saveToLocalStorage('seastarqr_createdQRs', appState.createdQRs);

        Utils.showToast('QR Code generated successfully!', 'success');
        Utils.hideSpinner();
        Utils.navigateTo('myQRs'); // Navigate to My QRs to see the new code
    },

    downloadQR: () => {
        const qrCanvas = Utils.$('#qr-code-preview canvas');
        if (qrCanvas) {
            const link = document.createElement('a');
            link.href = qrCanvas.toDataURL('image/png');
            link.download = `${appState.currentQRData.metadata?.name || 'seastarqr'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Utils.showToast('QR Code downloaded!', 'info');
        } else {
            Utils.showToast('QR Code not ready for download.', 'error');
        }
    },

    showStep: (stepId) => {
        Utils.$$('.qr-creation-step').forEach(step => step.classList.add('hidden'));
        Utils.showElement(`#${stepId}-step`);
    },

    resetForm: () => {
        appState.currentQRData = {};
        appState.selectedQRType = null;
        Utils.$('#content-input-fields').innerHTML = '';
        Utils.$('#design-editor-controls').innerHTML = '';
        Utils.$('#qr-code-preview').innerHTML = '';
        QRGenerator.renderQRTypeSelection(); // Go back to step 1
    }
};

// ----------------------------------------------------------------------------
// 4. QR Code Scanner Module (ScannerModule)
// ----------------------------------------------------------------------------
const ScannerModule = {
    html5QrCode: null,

    init: () => {
        Utils.$('#scan-qr-btn')?.addEventListener('click', () => {
            Utils.navigateTo('scan');
            ScannerModule.startScanner();
        });
        Utils.$('#stop-scan-btn')?.addEventListener('click', ScannerModule.stopScanner);
        Utils.$('#upload-image-scan-btn')?.addEventListener('click', () => Utils.$('#qr-image-input').click());
        Utils.$('#qr-image-input')?.addEventListener('change', ScannerModule.scanFromFile);
    },

    startScanner: () => {
        const qrboxFunction = function(viewfinderWidth, viewfinderHeight) {
            let minEdgePercentage = 0.6; // 60% of width or height edge
            let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
                width: qrboxSize,
                height: qrboxSize
            };
        };

        ScannerModule.html5QrCode = new Html5Qrcode("reader");
        ScannerModule.html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: qrboxFunction
            },
            ScannerModule.onScanSuccess,
            ScannerModule.onScanError
        ).then(() => {
            console.log("QR Scanner started.");
            Utils.showToast("Scanner ready!", "info");
        }).catch(err => {
            console.error(`Unable to start scanning: ${err}`);
            Utils.showToast(`Error starting scanner: ${err}`, "error");
        });
    },

    stopScanner: () => {
        if (ScannerModule.html5QrCode) {
            ScannerModule.html5QrCode.stop().then(() => {
                console.log("QR Scanner stopped.");
                Utils.showToast("Scanner stopped.", "info");
            }).catch(err => {
                console.error("Error stopping scanner:", err);
            });
            ScannerModule.html5QrCode.clear();
            ScannerModule.html5QrCode = null;
        }
    },

    onScanSuccess: (decodedText, decodedResult) => {
        console.log(`Scan result: ${decodedText}`, decodedResult);
        Utils.showToast(`Scanned: ${decodedText.substring(0, 30)}...`, 'success');

        if (appState.settings.vibrationOnScan) {
            navigator.vibrate(200); // Vibrate for 200ms
        }

        const scannedQR = {
            id: Utils.uuidv4(),
            type: 'Unknown', // Try to infer type from content
            name: decodedText.substring(0, 50),
            scanned: Utils.formatDate(new Date()),
            url: decodedText, // Use 'url' for consistency in history
            isFavorite: false
        };

        // Basic type inference
        if (decodedText.startsWith('http')) scannedQR.type = 'URL';
        else if (decodedText.startsWith('WIFI:')) scannedQR.type = 'WiFi';
        else if (decodedText.length < 100) scannedQR.type = 'Text';

        appState.scannedHistory.unshift(scannedQR); // Add to the beginning
        Utils.saveToLocalStorage('seastarqr_scannedHistory', appState.scannedHistory);
        HistoryModule.renderHistory(); // Update history view

        if (appState.settings.autoOpenContent) {
            // Attempt to open URL or display content
            if (scannedQR.type === 'URL') {
                window.open(decodedText, '_blank');
            } else {
                alert(`Scanned Content:\n${decodedText}`);
            }
        }
        ScannerModule.stopScanner(); // Stop scanner after successful scan
    },

    onScanError: (errorMessage) => {
        // console.warn(`QR Scan Error: ${errorMessage}`);
        // Often, errors are just no QR detected yet, so no toast here.
    },

    scanFromFile: (event) => {
        const file = event.target.files[0];
        if (file) {
            ScannerModule.html5QrCode = new Html5Qrcode("reader"); // Re-initialize for file scan
            ScannerModule.html5QrCode.scanFile(file, true)
                .then(decodedText => {
                    ScannerModule.onScanSuccess(decodedText, { /* no detailed result for file scan */ });
                })
                .catch(err => {
                    Utils.showToast(`Error scanning file: ${err}`, 'error');
                    console.error(`Error scanning file: ${err}`);
                });
        }
    }
};

// ----------------------------------------------------------------------------
// 5. History and My QRs Module (HistoryModule, MyQRsModule)
// ----------------------------------------------------------------------------
const HistoryModule = {
    init: () => {
        Utils.$('#history-tab-scanned')?.addEventListener('click', () => HistoryModule.showHistoryTab('scanned'));
        Utils.$('#history-tab-favorites')?.addEventListener('click', () => HistoryModule.showHistoryTab('favorites'));
    },

    renderHistory: () => {
        // Load data on init or when navigating to page
        appState.scannedHistory = Utils.loadFromLocalStorage('seastarqr_scannedHistory') || appState.mockScannedHistory;
        HistoryModule.showHistoryTab('scanned'); // Default to scanned tab
    },

    showHistoryTab: (tabName) => {
        // Update tab active state
        Utils.$$('#history-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
        Utils.$(`#history-tab-${tabName}`).classList.add('active');

        const container = Utils.$('#history-list-container');
        container.innerHTML = ''; // Clear previous list

        let itemsToShow = [];
        if (tabName === 'scanned') {
            itemsToShow = appState.scannedHistory;
        } else if (tabName === 'favorites') {
            const allItems = [...appState.scannedHistory, ...appState.createdQRs];
            itemsToShow = allItems.filter(item => item.isFavorite);
        }

        if (itemsToShow.length === 0) {
            container.innerHTML = `<p class="empty-state">No ${tabName} items yet.</p>`;
            return;
        }

        itemsToShow.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';
            itemDiv.innerHTML = `
                <div>
                    <h4>${item.name || item.url.substring(0, 40) + '...'}</h4>
                    <p class="type">${item.type}</p>
                    <p class="date">${item.created || item.scanned}</p>
                </div>
                <div class="actions">
                    <button class="btn icon-btn view-btn" data-id="${item.id}" data-url="${item.url}" data-type="${item.type}">👁️</button>
                    <button class="btn icon-btn favorite-btn ${item.isFavorite ? 'active' : ''}" data-id="${item.id}" data-is-favorite="${item.isFavorite}">⭐</button>
                    <button class="btn icon-btn delete-btn" data-id="${item.id}">🗑️</button>
                </div>
            `;
            container.appendChild(itemDiv);
        });

        // Add event listeners for item actions
        Utils.$$('#history-list-container .view-btn').forEach(btn => btn.addEventListener('click', HistoryModule.handleViewItem));
        Utils.$$('#history-list-container .favorite-btn').forEach(btn => btn.addEventListener('click', HistoryModule.handleFavoriteToggle));
        Utils.$$('#history-list-container .delete-btn').forEach(btn => btn.addEventListener('click', HistoryModule.handleDeleteItem));
    },

    handleViewItem: (event) => {
        const id = event.target.dataset.id;
        const url = event.target.dataset.url;
        const type = event.target.dataset.type;
        if (type === 'URL' && url) {
            window.open(url, '_blank');
        } else {
            alert(`Viewing Item:\nID: ${id}\nType: ${type}\nContent: ${url}`);
        }
    },

    handleFavoriteToggle: (event) => {
        const id = event.target.dataset.id;
        const isFavorite = event.target.dataset.isFavorite === 'true';

        // Update in scanned history
        const scannedIndex = appState.scannedHistory.findIndex(item => item.id === id);
        if (scannedIndex !== -1) {
            appState.scannedHistory[scannedIndex].isFavorite = !isFavorite;
            Utils.saveToLocalStorage('seastarqr_scannedHistory', appState.scannedHistory);
        }

        // Update in created QRs
        const createdIndex = appState.createdQRs.findIndex(item => item.id === id);
        if (createdIndex !== -1) {
            appState.createdQRs[createdIndex].isFavorite = !isFavorite;
            Utils.saveToLocalStorage('seastarqr_createdQRs', appState.createdQRs);
        }

        Utils.showToast(`Item ${!isFavorite ? 'added to' : 'removed from'} favorites.`, 'info');
        HistoryModule.renderHistory(); // Re-render to reflect change
        MyQRsModule.renderMyQRs();
    },

    handleDeleteItem: (event) => {
        const id = event.target.dataset.id;
        if (!confirm('Are you sure you want to delete this item?')) return;

        appState.scannedHistory = appState.scannedHistory.filter(item => item.id !== id);
        Utils.saveToLocalStorage('seastarqr_scannedHistory', appState.scannedHistory);

        appState.createdQRs = appState.createdQRs.filter(item => item.id !== id);
        Utils.saveToLocalStorage('seastarqr_createdQRs', appState.createdQRs);

        Utils.showToast('Item deleted.', 'info');
        HistoryModule.renderHistory(); // Re-render to reflect change
        MyQRsModule.renderMyQRs();
    }
};

const MyQRsModule = {
    init: () => {
        Utils.$('#my-qrs-btn')?.addEventListener('click', () => Utils.navigateTo('myQRs'));
        Utils.$('#my-qrs-filter-type')?.addEventListener('change', MyQRsModule.renderMyQRs);
        Utils.$('#my-qrs-search-input')?.addEventListener('input', MyQRsModule.renderMyQRs);
    },

    renderMyQRs: () => {
        appState.createdQRs = Utils.loadFromLocalStorage('seastarqr_createdQRs') || appState.mockCreatedQRs;
        const container = Utils.$('#my-qrs-list-container');
        container.innerHTML = ''; // Clear previous list

        let filteredQRs = appState.createdQRs;

        // Apply filter
        const filterType = Utils.$('#my-qrs-filter-type')?.value;
        if (filterType && filterType !== 'All') {
            filteredQRs = filteredQRs.filter(qr => qr.type === filterType);
        }

        // Apply search
        const searchText = Utils.$('#my-qrs-search-input')?.value.toLowerCase();
        if (searchText) {
            filteredQRs = filteredQRs.filter(qr =>
                qr.name.toLowerCase().includes(searchText) ||
                qr.type.toLowerCase().includes(searchText)
            );
        }

        if (filteredQRs.length === 0) {
            container.innerHTML = `<p class="empty-state">No QRs matching your criteria.</p>`;
            return;
        }

        filteredQRs.forEach(qr => {
            const qrItem = document.createElement('div');
            qrItem.className = 'my-qr-item';
            qrItem.innerHTML = `
                <div>
                    <h4>${qr.name}</h4>
                    <p class="type">${qr.type}</p>
                    <p class="date">Created: ${qr.created}</p>
                </div>
                <div class="actions">
                    <button class="btn icon-btn view-btn" data-id="${qr.id}" data-url="${qr.url}" data-type="${qr.type}">👁️</button>
                    <button class="btn icon-btn download-btn" data-id="${qr.id}" data-url="${qr.url}" data-name="${qr.name}">⬇️</button>
                    <button class="btn icon-btn delete-btn" data-id="${qr.id}">🗑️</button>
                </div>
            `;
            container.appendChild(qrItem);
        });

        // Add event listeners for item actions
        Utils.$$('#my-qrs-list-container .view-btn').forEach(btn => btn.addEventListener('click', HistoryModule.handleViewItem)); // Re-use history view
        Utils.$$('#my-qrs-list-container .download-btn').forEach(btn => btn.addEventListener('click', MyQRsModule.downloadCreatedQR));
        Utils.$$('#my-qrs-list-container .delete-btn').forEach(btn => btn.addEventListener('click', MyQRsModule.handleDeleteCreatedQR));
    },

    downloadCreatedQR: async (event) => {
        const id = event.target.dataset.id;
        const name = event.target.dataset.name;
        const qr = appState.createdQRs.find(q => q.id === id);

        if (qr) {
            Utils.showSpinner();
            // In a real app, you'd fetch the generated QR image from your backend
            // For this demo, we'll quickly generate it on the fly using qr.url and qr.design
            const tempDiv = document.createElement('div');
            tempDiv.style.display = 'none'; // Hide it
            document.body.appendChild(tempDiv);
            
            const qrCodeTemp = new QRCode(tempDiv, {
                text: qr.url,
                width: 512, // Higher resolution for download
                height: 512,
                colorDark: qr.design.primaryColor,
                colorLight: qr.design.backgroundColor,
                correctLevel: QRCode.CorrectLevel.H
            });

            // Wait a moment for QR code to render (if sync is an issue)
            await new Promise(resolve => setTimeout(resolve, 100));

            const qrCanvas = tempDiv.querySelector('canvas');
            if (qrCanvas) {
                const link = document.createElement('a');
                link.href = qrCanvas.toDataURL('image/png');
                link.download = `${name.replace(/\s+/g, '_')}_QR.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                Utils.showToast('QR Code downloaded!', 'success');
            } else {
                Utils.showToast('Could not generate QR for download.', 'error');
            }
            document.body.removeChild(tempDiv);
            Utils.hideSpinner();
        } else {
            Utils.showToast('QR Code not found.', 'error');
        }
    },

    handleDeleteCreatedQR: (event) => {
        const id = event.target.dataset.id;
        if (!confirm('Are you sure you want to delete this created QR code?')) return;

        appState.createdQRs = appState.createdQRs.filter(qr => qr.id !== id);
        Utils.saveToLocalStorage('seastarqr_createdQRs', appState.createdQRs);
        Utils.showToast('Created QR code deleted.', 'info');
        MyQRsModule.renderMyQRs();
    }
};

// ----------------------------------------------------------------------------
// 6. Settings Module (SettingsModule)
// ----------------------------------------------------------------------------
const SettingsModule = {
    init: () => {
        Utils.$('#settings-btn')?.addEventListener('click', () => Utils.navigateTo('settings'));
        Utils.$('#toggle-vibration')?.addEventListener('change', SettingsModule.toggleVibration);
        Utils.$('#toggle-auto-open')?.addEventListener('change', SettingsModule.toggleAutoOpen);
        Utils.$('#delete-account-btn')?.addEventListener('click', AuthModule.deleteAccount);
        Utils.$('#send-feedback-btn')?.addEventListener('click', SettingsModule.sendFeedback);
        Utils.$('#view-pricing-btn')?.addEventListener('click', SettingsModule.viewPricing);
    },

    renderSettings: () => {
        // Load current settings from appState and update UI
        Utils.$('#toggle-vibration').checked = appState.settings.vibrationOnScan;
        Utils.$('#toggle-auto-open').checked = appState.settings.autoOpenContent;

        const userNameElement = Utils.$('#current-user-name');
        if (userNameElement && appState.currentUser) {
            userNameElement.textContent = appState.currentUser.name;
        } else if (userNameElement) {
            userNameElement.textContent = 'Not logged in';
        }

        // Hide/show account management based on login status
        if (appState.currentUser && appState.currentUser.method !== 'guest') {
            Utils.showElement('#account-management-section');
        } else {
            Utils.hideElement('#account-management-section');
        }
    },

    toggleVibration: (event) => {
        appState.settings.vibrationOnScan = event.target.checked;
        Utils.saveToLocalStorage('seastarqr_settings', appState.settings);
        Utils.showToast(`Vibration on scan: ${event.target.checked ? 'Enabled' : 'Disabled'}`, 'info', 1500);
    },

    toggleAutoOpen: (event) => {
        appState.settings.autoOpenContent = event.target.checked;
        Utils.saveToLocalStorage('seastarqr_settings', appState.settings);
        Utils.showToast(`Auto-open content: ${event.target.checked ? 'Enabled' : 'Disabled'}`, 'info', 1500);
    },

    sendFeedback: () => {
        alert('Thank you for your feedback! (This would open a feedback form or email client)');
    },

    viewPricing: () => {
        alert('Pricing plans would be displayed here! (Redirect to a pricing page)');
    }
};

// ----------------------------------------------------------------------------
// 7. Initial Application Setup (Initialization)
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings and data
    const savedSettings = Utils.loadFromLocalStorage('seastarqr_settings');
    if (savedSettings) {
        Object.assign(appState.settings, savedSettings);
    }
    appState.scannedHistory = Utils.loadFromLocalStorage('seastarqr_scannedHistory') || [];
    appState.createdQRs = Utils.loadFromLocalStorage('seastarqr_createdQRs') || [];

    // Initialize Modules
    AuthModule.init();
    QRGenerator.init();
    ScannerModule.init();
    HistoryModule.init();
    MyQRsModule.init();
    SettingsModule.init();

    // Set up main navigation
    Utils.$('#home-btn')?.addEventListener('click', () => Utils.navigateTo('home'));

    // Check if user is already logged in or needs to see login page
    AuthModule.checkSession();
});



