-- =====================================================
-- Tablas para Webflow Forms (Newsletter + Wellness Leads)
-- =====================================================

-- =====================================================
-- NEWSLETTER SUBSCRIBERS
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Datos del formulario
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    source VARCHAR(50) DEFAULT 'webflow', -- 'webflow', 'widget', 'manual'
    page_url TEXT, -- URL donde se llenó el formulario
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    
    -- Metadatos
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscribers(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_source ON newsletter_subscribers(source);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_newsletter_updated_at ON newsletter_subscribers;
CREATE TRIGGER trigger_update_newsletter_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_newsletter_updated_at();

-- Constraint de email único
ALTER TABLE newsletter_subscribers
ADD CONSTRAINT unique_newsletter_email UNIQUE (email);

-- Constraint de status válido
ALTER TABLE newsletter_subscribers
ADD CONSTRAINT check_newsletter_status 
CHECK (status IN ('active', 'unsubscribed', 'bounced'));


-- =====================================================
-- WELLNESS CENTER LEADS (Interesados sin registrar)
-- =====================================================
CREATE TABLE IF NOT EXISTS wellness_center_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información del establecimiento
    establishment_name VARCHAR(255) NOT NULL,
    services TEXT[] DEFAULT '{}',
    contact_name VARCHAR(255),
    contact_role VARCHAR(100), -- 'owner', 'manager', 'admin', etc.
    
    -- Contacto
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    
    -- Ubicación
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'México',
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    
    -- Redes sociales / Web
    website VARCHAR(255),
    instagram VARCHAR(100),
    facebook VARCHAR(100),
    tiktok VARCHAR(100),
    
    -- Información adicional
    description TEXT,
    monthly_pets_estimate INTEGER, -- Estimación de mascotas/mes
    has_vet BOOLEAN DEFAULT false,
    has_grooming BOOLEAN DEFAULT false,
    has_hotel BOOLEAN DEFAULT false,
    has_shop BOOLEAN DEFAULT false,
    
    -- Origen y tracking
    source VARCHAR(50) DEFAULT 'webflow', -- 'webflow', 'landing', 'referral', 'manual'
    page_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    referrer VARCHAR(100), -- 'webflow', 'google', 'social', 'direct'
    
    -- Estado del lead
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost', 'duplicate'
    lead_score INTEGER DEFAULT 0,
    
    -- Seguimiento
    assigned_to VARCHAR(100), -- Admin asignado
    contacted_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    converted_to_wellness_center_id UUID REFERENCES wellness_centers(id),
    notes TEXT,
    
    -- Metadatos
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wellness_leads_email ON wellness_center_leads(email);
CREATE INDEX IF NOT EXISTS idx_wellness_leads_status ON wellness_center_leads(status);
CREATE INDEX IF NOT EXISTS idx_wellness_leads_created_at ON wellness_center_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_leads_source ON wellness_center_leads(source);
CREATE INDEX IF NOT EXISTS idx_wellness_leads_assigned ON wellness_center_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_wellness_leads_city_state ON wellness_center_leads(city, state);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_wellness_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_wellness_leads_updated_at ON wellness_center_leads;
CREATE TRIGGER trigger_update_wellness_leads_updated_at
    BEFORE UPDATE ON wellness_center_leads
    FOR EACH ROW EXECUTE FUNCTION update_wellness_leads_updated_at();

-- Constraint de status válido
ALTER TABLE wellness_center_leads
ADD CONSTRAINT check_wellness_leads_status 
CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost', 'duplicate'));


-- =====================================================
-- VISTAS PARA ADMIN
-- =====================================================

-- Vista: Newsletter activos
CREATE OR REPLACE VIEW admin_newsletter_active AS
SELECT 
    id,
    email,
    first_name,
    source,
    subscribed_at,
    utm_source,
    utm_medium,
    utm_campaign
FROM newsletter_subscribers
WHERE status = 'active'
ORDER BY subscribed_at DESC;

-- Vista: Wellness leads pendientes
CREATE OR REPLACE VIEW admin_wellness_leads_pending AS
SELECT 
    id,
    establishment_name,
    contact_name,
    email,
    phone,
    whatsapp,
    city,
    state,
    services,
    monthly_pets_estimate,
    status,
    lead_score,
    source,
    assigned_to,
    created_at
FROM wellness_center_leads
WHERE status IN ('new', 'contacted', 'qualified')
ORDER BY 
    CASE status 
        WHEN 'new' THEN 1 
        WHEN 'contacted' THEN 2 
        WHEN 'qualified' THEN 3 
    END,
    lead_score DESC,
    created_at DESC;

-- Permisos
GRANT SELECT ON admin_newsletter_active TO authenticated;
GRANT SELECT ON admin_wellness_leads_pending TO authenticated;
GRANT ALL ON newsletter_subscribers TO service_role;
GRANT ALL ON wellness_center_leads TO service_role;

-- =====================================================
-- FIN
-- =====================================================