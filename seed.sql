-- Seed data for demo

-- Insert test user
INSERT INTO users (email, max_budget, min_bedrooms, max_bedrooms, has_pet, pet_type, pet_weight_lbs, dealbreakers)
VALUES (
    'demo@apartmentagent.com',
    3000,
    2,
    3,
    true,
    'dog',
    60,
    '["no_pets", "ground_floor_only"]'::jsonb
);

-- Insert mock listings
INSERT INTO listings (external_id, source, address, city, state, rent, bedrooms, bathrooms, phone, description, is_available)
VALUES 
(
    'zillow-123',
    'zillow',
    '123 Market St, Apt 4B',
    'San Francisco',
    'CA',
    2800,
    2,
    2.0,
    '+14155551234',
    'Beautiful 2BR apartment in SOMA. Pet-friendly building. Quiet neighborhood. Recently renovated kitchen.',
    true
),
(
    'zillow-456',
    'zillow',
    '456 Mission St, Unit 12',
    'San Francisco',
    'CA',
    2500,
    2,
    1.0,
    '+14155555678',
    'Cozy 2BR in downtown. No pets allowed. Great for professionals. Walking distance to BART.',
    true
),
(
    'apartments-789',
    'apartments_com',
    '789 Valencia St, #3',
    'San Francisco',
    'CA',
    3200,
    3,
    2.0,
    '+14155559012',
    'Spacious 3BR in Mission District. Pet-friendly with dog park. Washer/dryer in unit. Parking included.',
    true
);

SELECT 'Seeded ' || COUNT(*) || ' users' FROM users;
SELECT 'Seeded ' || COUNT(*) || ' listings' FROM listings;
