-- ============================================================================
-- 008_seed.sql
-- Initial seed data: roles, admin/user accounts, categories, materials,
-- recycling centers with PostGIS coordinates, rewards, and badges.
-- ============================================================================

-- 1. Roles
INSERT INTO roles (role_id, role_name) VALUES
    (1, 'admin'),
    (2, 'user'),
    (3, 'center_representative')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Initial Users
-- Password for all seed users is 'AdminPass123!' (BCrypt hash)
INSERT INTO users (id, email, password_hash, full_name, role_id, phone, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@ewaste.org', '$2b$12$e8Yk2wQO2RkC.jU4rU7.h.rT4a1b0GZ7O8GvPZpZp5vY6nK5G8V2.', 'System Administrator', 1, '+1-555-0100', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'citizen.jane@example.com', '$2b$12$e8Yk2wQO2RkC.jU4rU7.h.rT4a1b0GZ7O8GvPZpZp5vY6nK5G8V2.', 'Jane Citizen', 2, '+1-555-0200', TRUE),
    ('00000000-0000-0000-0000-000000000003', 'center.rep@ecocenter.org', '$2b$12$e8Yk2wQO2RkC.jU4rU7.h.rT4a1b0GZ7O8GvPZpZp5vY6nK5G8V2.', 'Robert Representative', 3, '+1-555-0300', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Device Categories
INSERT INTO device_categories (category_id, code, name, description, handling_priority, base_points, points_per_kg, is_active) VALUES
    ('11111111-1111-1111-1111-111111110001', 'SMARTPHONE', 'Smartphones & Mobile Devices', 'Smartphones, cell phones, and personal handheld digital assistants', 'secure_data_wipe', 50, 20.00, TRUE),
    ('11111111-1111-1111-1111-111111110002', 'LAPTOP', 'Laptops & Notebooks', 'Portable computers, notebooks, and ultrabooks', 'secure_data_wipe', 100, 25.00, TRUE),
    ('11111111-1111-1111-1111-111111110003', 'TABLET', 'Tablets & E-Readers', 'Slates, touchpads, and electronic book readers', 'secure_data_wipe', 60, 20.00, TRUE),
    ('11111111-1111-1111-1111-111111110004', 'BATTERY', 'Lithium-Ion & Secondary Batteries', 'Rechargeable consumer batteries from electronics', 'hazardous', 30, 40.00, TRUE),
    ('11111111-1111-1111-1111-111111110005', 'PCB', 'Printed Circuit Boards & Motherboards', 'Circuit boards containing precious metals', 'hazardous', 40, 50.00, TRUE),
    ('11111111-1111-1111-1111-111111110006', 'SMALL_APPLIANCE', 'Small Household Electronics', 'Toasters, blenders, kettles, power tools', 'standard', 20, 10.00, TRUE)
ON CONFLICT (category_id) DO NOTHING;

-- 4. Materials
INSERT INTO materials (material_id, code, name, unit, default_impact_factor) VALUES
    ('22222222-2222-2222-2222-222222220001', 'COPPER', 'Refined Copper', 'kg', 1.8500),
    ('22222222-2222-2222-2222-222222220002', 'ALUMINUM', 'Recycled Aluminum', 'kg', 1.2000),
    ('22222222-2222-2222-2222-222222220003', 'GOLD', 'Recovered Gold', 'g', 15.0000),
    ('22222222-2222-2222-2222-222222220004', 'LITHIUM', 'Battery Lithium', 'kg', 3.5000),
    ('22222222-2222-2222-2222-222222220005', 'PLASTIC', 'Engineering Polymers', 'kg', 0.8000)
ON CONFLICT (material_id) DO NOTHING;

-- 5. Category Materials Composition
INSERT INTO category_materials (category_id, material_id, estimated_percentage) VALUES
    -- Smartphone: Copper 20%, Gold 0.5%, Lithium 15%, Plastic 40%
    ('11111111-1111-1111-1111-111111110001', '22222222-2222-2222-2222-222222220001', 20.00),
    ('11111111-1111-1111-1111-111111110001', '22222222-2222-2222-2222-222222220004', 15.00),
    ('11111111-1111-1111-1111-111111110001', '22222222-2222-2222-2222-222222220005', 40.00),
    -- Laptop: Aluminum 35%, Copper 15%, Lithium 10%, Plastic 25%
    ('11111111-1111-1111-1111-111111110002', '22222222-2222-2222-2222-222222220002', 35.00),
    ('11111111-1111-1111-1111-111111110002', '22222222-2222-2222-2222-222222220001', 15.00),
    ('11111111-1111-1111-1111-111111110002', '22222222-2222-2222-2222-222222220004', 10.00),
    ('11111111-1111-1111-1111-111111110002', '22222222-2222-2222-2222-222222220005', 25.00)
ON CONFLICT (category_id, material_id) DO NOTHING;

-- 6. Sample Recycling Centers (With PostGIS Coordinates, e.g. Bengaluru tech hub coordinates)
-- SRID 4326: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
INSERT INTO recycling_centers (center_id, name, address, contact_phone, contact_email, location, current_verification_status, created_by) VALUES
    (
        '33333333-3333-3333-3333-333333330001',
        'EcoTech Central Recycling Hub',
        '100 Feet Road, Indiranagar, Bengaluru, KA 560038',
        '+91-80-25251100',
        'contact@ecotechbangalore.org',
        ST_SetSRID(ST_MakePoint(77.6413, 12.9784), 4326),
        'verified',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '33333333-3333-3333-3333-333333330002',
        'GreenBytes E-Waste Depot Koramangala',
        '80 Feet Peripheral Road, 4th Block, Koramangala, Bengaluru, KA 560034',
        '+91-80-25532200',
        'support@greenbytes.org',
        ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326),
        'verified',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '33333333-3333-3333-3333-333333330003',
        'North City Battery & Electronics Drop-off',
        'Bellary Road, Hebbal, Bengaluru, KA 560024',
        '+91-80-23633300',
        'info@northcityewaste.com',
        ST_SetSRID(ST_MakePoint(77.5921, 13.0358), 4326),
        'verified',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '33333333-3333-3333-3333-333333330004',
        'Pending Electronic Salvage Co.',
        'Outer Ring Road, Marathahalli, Bengaluru, KA 560037',
        '+91-80-28474400',
        'admin@pendingsalvage.in',
        ST_SetSRID(ST_MakePoint(77.7011, 12.9569), 4326),
        'pending',
        '00000000-0000-0000-0000-000000000003'
    )
ON CONFLICT (center_id) DO NOTHING;

-- 7. Center Accepted Categories
INSERT INTO center_accepted_categories (center_id, category_id) VALUES
    -- EcoTech Central accepts Smartphone, Laptop, Tablet, Battery, PCB
    ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110001'),
    ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110002'),
    ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110003'),
    ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110004'),
    ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110005'),
    -- GreenBytes Koramangala accepts Smartphone, Laptop, Tablet
    ('33333333-3333-3333-3333-333333330002', '11111111-1111-1111-1111-111111110001'),
    ('33333333-3333-3333-3333-333333330002', '11111111-1111-1111-1111-111111110002'),
    ('33333333-3333-3333-3333-333333330002', '11111111-1111-1111-1111-111111110003'),
    -- North City specializes in Batteries and Small Appliances
    ('33333333-3333-3333-3333-333333330003', '11111111-1111-1111-1111-111111110004'),
    ('33333333-3333-3333-3333-333333330003', '11111111-1111-1111-1111-111111110006')
ON CONFLICT (center_id, category_id) DO NOTHING;

-- 8. Rewards Catalog Seed
INSERT INTO rewards (reward_id, title, description, points_cost, stock_quantity, is_active) VALUES
    ('44444444-4444-4444-4444-444444440001', 'Solar Powered Keychain Charger', 'Eco-friendly mini solar battery pack with USB-C connector', 250, 50, TRUE),
    ('44444444-4444-4444-4444-444444440002', '$15 Sustainable Store Voucher', 'Digital discount code applicable across verified eco-friendly retailers', 300, 100, TRUE),
    ('44444444-4444-4444-4444-444444440003', 'Upcycled Laptop Sleeve (15 inch)', 'Padded protective sleeve manufactured from 100% ocean plastic fabric', 450, 20, TRUE),
    ('44444444-4444-4444-4444-444444440004', 'Tree Plantation Certificate', 'One native tree planted and monitored on your behalf with GPS coordinates', 150, 500, TRUE)
ON CONFLICT (reward_id) DO NOTHING;

-- 9. Badges Seed
INSERT INTO badges (badge_id, code, name, description, icon_name, required_records, required_points) VALUES
    ('55555555-5555-5555-5555-555555550001', 'FIRST_DROP', 'Green Pioneer', 'Completed your very first verified e-waste recycling drop-off', 'eco', 1, 0),
    ('55555555-5555-5555-5555-555555550002', 'CIRCUIT_SAVER', 'Circuit Champion', 'Recycled 5 or more verified electronic devices', 'memory', 5, 250),
    ('55555555-5555-5555-5555-555555550003', 'CENTURION', 'Earth Guardian', 'Earned 1000 points keeping toxic heavy metals out of landfills', 'public', 10, 1000)
ON CONFLICT (badge_id) DO NOTHING;
