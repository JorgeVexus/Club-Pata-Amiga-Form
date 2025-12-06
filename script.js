// Memberstack instance
let memberstack = null;

// Initialize Memberstack
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Memberstack to load
    if (window.MemberStack) {
        memberstack = window.MemberStack.onReady;
    }

    // Initialize form handlers
    initializeForm();
    initializePostalCodeLookup();
    initializeFileUploads();
});

// Form Initialization
function initializeForm() {
    const form = document.getElementById('registrationForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        await handleFormSubmit();
    });

    // Cancel button
    const cancelBtn = document.querySelector('.btn-cancel');
    cancelBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cancelar el registro?')) {
            form.reset();
            clearFileUploads();
        }
    });
}

// Postal Code Lookup (API de Códigos Postales de México)
function initializePostalCodeLookup() {
    const postalCodeInput = document.getElementById('postalCode');
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');
    const colonySelect = document.getElementById('colony');

    postalCodeInput.addEventListener('input', async (e) => {
        const postalCode = e.target.value.trim();

        // Reset dependent fields
        stateSelect.innerHTML = '<option value="">Estado</option>';
        citySelect.innerHTML = '<option value="">Ciudad</option>';
        colonySelect.innerHTML = '<option value="">Colonia</option>';
        stateSelect.disabled = true;
        citySelect.disabled = true;
        colonySelect.disabled = true;

        if (postalCode.length === 5) {
            try {
                // Using the free API from sepomex
                const response = await fetch(`https://api.copomex.com/query/info_cp/${postalCode}?type=simplified&token=pruebas`);

                if (!response.ok) {
                    throw new Error('Código postal no encontrado');
                }

                const data = await response.json();

                if (data.error === false && data.response.cp) {
                    const cpData = data.response;

                    // Set state
                    stateSelect.innerHTML = `<option value="${cpData.estado}">${cpData.estado}</option>`;
                    stateSelect.value = cpData.estado;
                    stateSelect.disabled = false;

                    // Set city
                    citySelect.innerHTML = `<option value="${cpData.municipio}">${cpData.municipio}</option>`;
                    citySelect.value = cpData.municipio;
                    citySelect.disabled = false;

                    // Set colonies
                    if (cpData.asentamiento && cpData.asentamiento.length > 0) {
                        colonySelect.innerHTML = '<option value="">Selecciona una colonia</option>';
                        cpData.asentamiento.forEach(colony => {
                            const option = document.createElement('option');
                            option.value = colony;
                            option.textContent = colony;
                            colonySelect.appendChild(option);
                        });
                        colonySelect.disabled = false;
                    }
                } else {
                    showError(postalCodeInput, 'Código postal no encontrado');
                }
            } catch (error) {
                console.error('Error fetching postal code:', error);
                showError(postalCodeInput, 'Error al buscar el código postal. Intenta de nuevo.');
            }
        }
    });
}

// File Upload Handlers
function initializeFileUploads() {
    // INE Upload
    setupFileUpload('ineUploadArea', 'ineFiles', 'ineFilesList', 2);

    // Proof of Address Upload
    setupFileUpload('proofUploadArea', 'proofFile', 'proofFilesList', 1);
}

function setupFileUpload(areaId, inputId, listId, maxFiles) {
    const uploadArea = document.getElementById(areaId);
    const fileInput = document.getElementById(inputId);
    const filesList = document.getElementById(listId);

    // Click to browse
    uploadArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('browse-link') || e.target === uploadArea) {
            fileInput.click();
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files, fileInput, filesList, maxFiles);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files, fileInput, filesList, maxFiles);
    });
}

function handleFiles(files, fileInput, filesList, maxFiles) {
    // Clear previous error
    fileInput.classList.remove('error');

    // Validate number of files
    if (files.length > maxFiles) {
        alert(`Solo puedes subir un máximo de ${maxFiles} archivo(s)`);
        return;
    }

    // Validate each file
    const validFiles = [];
    for (const file of files) {
        if (!validateFile(file)) {
            continue;
        }
        validFiles.push(file);
    }

    if (validFiles.length === 0) {
        return;
    }

    // Display files
    displayFiles(validFiles, filesList, fileInput);
}

function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
        alert(`El archivo "${file.name}" no es un formato válido. Solo se permiten PDF, JPG o PNG.`);
        return false;
    }

    if (file.size > maxSize) {
        alert(`El archivo "${file.name}" excede el tamaño máximo de 5MB.`);
        return false;
    }

    return true;
}

function displayFiles(files, filesList, fileInput) {
    filesList.innerHTML = '';

    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileName = document.createElement('span');
        fileName.className = 'file-item-name';
        fileName.textContent = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-item-remove';
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', () => {
            removeFile(index, fileInput, filesList);
        });

        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        filesList.appendChild(fileItem);
    });
}

function removeFile(index, fileInput, filesList) {
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);

    files.forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });

    fileInput.files = dt.files;
    displayFiles(Array.from(dt.files), filesList, fileInput);
}

function clearFileUploads() {
    document.getElementById('ineFilesList').innerHTML = '';
    document.getElementById('proofFilesList').innerHTML = '';
}

// Form Validation
function validateForm() {
    let isValid = true;
    const form = document.getElementById('registrationForm');

    // Clear previous errors
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error');
    });

    // Validate required fields
    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        if (!input.value.trim() && input.type !== 'file' && input.type !== 'radio') {
            showError(input, 'Este campo es requerido');
            isValid = false;
        }
    });

    // Validate radio buttons
    const genderRadios = form.querySelectorAll('input[name="gender"]');
    const genderChecked = Array.from(genderRadios).some(radio => radio.checked);
    if (!genderChecked) {
        alert('Por favor selecciona cómo te identificas');
        isValid = false;
    }

    // Validate CURP format
    const curpInput = document.getElementById('curp');
    const curpPattern = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$/;
    if (curpInput.value && !curpPattern.test(curpInput.value.toUpperCase())) {
        showError(curpInput, 'CURP inválido');
        isValid = false;
    }

    // Validate email
    const emailInput = document.getElementById('email');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailInput.value && !emailPattern.test(emailInput.value)) {
        showError(emailInput, 'Email inválido');
        isValid = false;
    }

    // Validate phone
    const phoneInput = document.getElementById('phone');
    if (phoneInput.value && phoneInput.value.length !== 10) {
        showError(phoneInput, 'El teléfono debe tener 10 dígitos');
        isValid = false;
    }

    // Validate password
    const passwordInput = document.getElementById('password');
    if (passwordInput.value && passwordInput.value.length < 8) {
        showError(passwordInput, 'La contraseña debe tener al menos 8 caracteres');
        isValid = false;
    }

    // Validate files
    const ineFiles = document.getElementById('ineFiles').files;
    if (ineFiles.length === 0) {
        alert('Por favor sube tu INE por ambos lados');
        isValid = false;
    }

    const proofFile = document.getElementById('proofFile').files;
    if (proofFile.length === 0) {
        alert('Por favor sube tu comprobante de domicilio');
        isValid = false;
    }

    return isValid;
}

function showError(input, message) {
    input.classList.add('error');

    // You can add error message display here if needed
    console.error(`${input.name}: ${message}`);
}

// Form Submission
async function handleFormSubmit() {
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Procesando...';

    try {
        const formData = collectFormData();

        // Create member in Memberstack
        await createMemberstackUser(formData);

        // Upload files to Supabase (if configured)
        // await uploadFilesToSupabase(formData);

        // Save to Supabase database (if configured)
        // await saveToSupabase(formData);

        // Success
        alert('¡Registro exitoso! Bienvenido a la manada 🐾');

        // Redirect or show next step
        // window.location.href = '/siguiente-paso';

    } catch (error) {
        console.error('Error during registration:', error);
        alert('Hubo un error al procesar tu registro. Por favor intenta de nuevo.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Siguiente';
    }
}

function collectFormData() {
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);

    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        motherLastName: formData.get('motherLastName'),
        gender: formData.get('gender'),
        birthDate: formData.get('birthDate'),
        curp: formData.get('curp').toUpperCase(),
        postalCode: formData.get('postalCode'),
        state: formData.get('state'),
        city: formData.get('city'),
        colony: formData.get('colony'),
        address: formData.get('address'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        ineFiles: Array.from(document.getElementById('ineFiles').files),
        proofFile: document.getElementById('proofFile').files[0]
    };

    return data;
}

async function createMemberstackUser(data) {
    try {
        // Memberstack will automatically handle the form submission
        // because we're using data-ms-form="signup" and data-ms-member attributes

        // The form data will be automatically sent to Memberstack
        // You can also use the Memberstack API directly if needed:

        /*
        const member = await memberstack.signupMemberEmailPassword({
            email: data.email,
            password: data.password,
            customFields: {
                'first-name': data.firstName,
                'last-name': data.lastName,
                'apellido-materno': data.motherLastName,
                'genero': data.gender,
                'fecha-nacimiento': data.birthDate,
                'curp': data.curp,
                'codigo-postal': data.postalCode,
                'estado': data.state,
                'ciudad': data.city,
                'colonia': data.colony,
                'direccion': data.address,
                'telefono': data.phone
            }
        });
        
        return member;
        */

        console.log('User data prepared for Memberstack:', data);
        return true;
    } catch (error) {
        console.error('Error creating Memberstack user:', error);
        throw error;
    }
}

// Supabase functions (to be implemented when Supabase is configured)
async function uploadFilesToSupabase(data) {
    // This will be implemented once Supabase credentials are provided
    console.log('Files ready for Supabase upload:', {
        ineFiles: data.ineFiles,
        proofFile: data.proofFile
    });
}

async function saveToSupabase(data) {
    // This will be implemented once Supabase credentials are provided
    console.log('Data ready for Supabase:', data);
}
