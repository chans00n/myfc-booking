-- Update user to admin role
-- Replace the email with the user you want to make admin

UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'chanson@barbellsforboobs.org';

-- Also update the user metadata in auth.users table
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
)
WHERE email = 'chanson@barbellsforboobs.org';

-- Verify the update
SELECT id, email, role, first_name, last_name 
FROM public.profiles 
WHERE email = 'chanson@barbellsforboobs.org';