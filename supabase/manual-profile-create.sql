-- Manually create profile for user
-- Replace the values below with your actual user data
INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    created_at,
    updated_at
)
VALUES (
    'a4e29779-ea55-4f20-aeb2-24d1b39dcc46'::uuid,
    'chanson@barbellsforboobs.org',
    'Chris',
    'Hanson',
    '9492955330',
    'client'::user_role,
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Verify the profile was created
SELECT * FROM public.profiles WHERE id = 'a4e29779-ea55-4f20-aeb2-24d1b39dcc46'::uuid;