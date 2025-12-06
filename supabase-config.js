// Supabase Configuration
// Replace these values with your actual Supabase project credentials

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
let supabase = null;

// Load Supabase client library
function loadSupabase() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize Supabase
async function initSupabase() {
    try {
        await loadSupabase();

        if (SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL') {
            console.warn('Supabase not configured. Please update supabase-config.js with your credentials.');
            return null;
        }

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return supabase;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return null;
    }
}

// Upload file to Supabase Storage
async function uploadFileToSupabase(file, userId, documentType) {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return null;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;
        const filePath = `user-documents/${fileName}`;

        const { data, error } = await supabase.storage
            .from('user-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('user-documents')
            .getPublicUrl(filePath);

        return {
            path: filePath,
            publicUrl: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Save user data to Supabase
async function saveUserToSupabase(userData, memberstackId) {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    memberstack_id: memberstackId,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    mother_last_name: userData.motherLastName,
                    gender: userData.gender,
                    birth_date: userData.birthDate,
                    curp: userData.curp,
                    email: userData.email,
                    phone: userData.phone,
                    postal_code: userData.postalCode,
                    state: userData.state,
                    city: userData.city,
                    colony: userData.colony,
                    address: userData.address,
                    membership_status: 'active'
                }
            ])
            .select();

        if (error) {
            throw error;
        }

        return data[0];
    } catch (error) {
        console.error('Error saving user to Supabase:', error);
        throw error;
    }
}

// Save document metadata to Supabase
async function saveDocumentToSupabase(userId, documentData, documentType) {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('documents')
            .insert([
                {
                    user_id: userId,
                    document_type: documentType,
                    file_name: documentData.fileName,
                    file_path: documentData.path,
                    file_size: documentData.fileSize,
                    mime_type: documentData.mimeType
                }
            ])
            .select();

        if (error) {
            throw error;
        }

        return data[0];
    } catch (error) {
        console.error('Error saving document metadata:', error);
        throw error;
    }
}

// Complete upload process for all files
async function uploadAllFiles(userData, userId) {
    if (!supabase) {
        console.warn('Supabase not initialized. Files will not be uploaded.');
        return;
    }

    try {
        const uploadPromises = [];

        // Upload INE files
        if (userData.ineFiles && userData.ineFiles.length > 0) {
            userData.ineFiles.forEach((file, index) => {
                const documentType = index === 0 ? 'ine_front' : 'ine_back';
                uploadPromises.push(
                    uploadFileToSupabase(file, userId, documentType)
                        .then(fileData => saveDocumentToSupabase(userId, fileData, documentType))
                );
            });
        }

        // Upload proof of address
        if (userData.proofFile) {
            uploadPromises.push(
                uploadFileToSupabase(userData.proofFile, userId, 'proof_of_address')
                    .then(fileData => saveDocumentToSupabase(userId, fileData, 'proof_of_address'))
            );
        }

        await Promise.all(uploadPromises);
        console.log('All files uploaded successfully');
    } catch (error) {
        console.error('Error uploading files:', error);
        throw error;
    }
}

// Get user data from Supabase
async function getUserFromSupabase(memberstackId) {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('memberstack_id', memberstackId)
            .single();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Get user documents from Supabase
async function getUserDocuments(userId) {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

// Check if solidarity fund is available
async function checkSolidarityFundAvailability(userId) {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('solidarity_fund_available, waiting_period_end_date')
            .eq('id', userId)
            .single();

        if (error) {
            throw error;
        }

        return {
            available: data.solidarity_fund_available,
            endDate: data.waiting_period_end_date
        };
    } catch (error) {
        console.error('Error checking solidarity fund:', error);
        return false;
    }
}

// Export functions for use in script.js
window.SupabaseConfig = {
    init: initSupabase,
    uploadFile: uploadFileToSupabase,
    saveUser: saveUserToSupabase,
    saveDocument: saveDocumentToSupabase,
    uploadAllFiles: uploadAllFiles,
    getUser: getUserFromSupabase,
    getUserDocuments: getUserDocuments,
    checkSolidarityFund: checkSolidarityFundAvailability
};
