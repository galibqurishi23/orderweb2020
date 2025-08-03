-- Add tikka tenant to allow testing with /tikka URL
INSERT IGNORE INTO `tenants` (id, slug, name, email, phone, address, status, subscription_plan, subscription_status, trial_ends_at) VALUES 
('tikka-tenant-id-123', 'tikka', 'Tikka Restaurant', 'tikka@example.com', '+1234567890', '123 Main Street', 'active', 'starter', 'active', '2025-12-31 23:59:59');
