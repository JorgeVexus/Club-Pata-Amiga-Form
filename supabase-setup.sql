-- =============================================
-- Supabase Database Setup for Pet Membership
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memberstack_id VARCHAR(255) UNIQUE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    mother_last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(50),
    birth_date DATE,
    curp VARCHAR(18) UNIQUE,
    
    -- Contact Information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Address Information
    postal_code VARCHAR(5),
    state VARCHAR(100),
    city VARCHAR(100),
    colony VARCHAR(150),
    address TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Membership Information
    membership_status VARCHAR(50) DEFAULT 'pending',
    waiting_period_end_date DATE, -- 90 days from registration
    solidarity_fund_available BOOLEAN DEFAULT FALSE,
    
    -- Referral Information
    ambassador_code VARCHAR(50)
);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Document Information
    document_type VARCHAR(50) NOT NULL, -- 'ine_front', 'ine_back', 'proof_of_address'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_users_memberstack_id ON users(memberstack_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_curp ON users(curp);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (auth.uid()::text = memberstack_id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid()::text = memberstack_id);

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE memberstack_id = auth.uid()::text
        )
    );

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to users" ON users
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to documents" ON documents
    FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create storage bucket for documents
-- Run this in the Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('user-documents', 'user-documents', false);

-- Storage policies
-- CREATE POLICY "Users can upload their own documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate waiting period end date (90 days)
CREATE OR REPLACE FUNCTION set_waiting_period()
RETURNS TRIGGER AS $$
BEGIN
    NEW.waiting_period_end_date = NEW.created_at::date + INTERVAL '90 days';
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to set waiting period on user creation
CREATE TRIGGER set_user_waiting_period BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION set_waiting_period();

-- Function to check and update solidarity fund availability
CREATE OR REPLACE FUNCTION check_solidarity_fund_availability()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET solidarity_fund_available = TRUE
    WHERE waiting_period_end_date <= CURRENT_DATE
    AND solidarity_fund_available = FALSE;
END;
$$ language 'plpgsql';

-- You can run this function periodically or create a cron job
-- SELECT check_solidarity_fund_availability();
