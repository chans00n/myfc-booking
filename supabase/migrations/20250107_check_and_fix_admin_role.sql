-- Check and fix admin role access

-- 1. First, check all users and their roles
SELECT 
    u.id,
    u.email,
    p.role,
    p.first_name,
    p.last_name,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. To make a specific user an admin, update their role
-- Replace 'your-email@example.com' with your actual admin email
UPDATE profiles 
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- 3. Alternative: Make the first user (oldest account) an admin
UPDATE profiles 
SET role = 'admin'
WHERE id = (
    SELECT u.id 
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    ORDER BY u.created_at ASC 
    LIMIT 1
);

-- 4. Check that the role column is using the correct type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'role';

-- 5. If you need to convert role to text type (in case it's still using enum)
DO $$
BEGIN
    -- Check if role is still an enum type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Convert to text
        ALTER TABLE profiles 
        ALTER COLUMN role TYPE text 
        USING role::text;
        
        RAISE NOTICE 'Converted role column to text type';
    END IF;
END $$;

-- 6. Verify admin users exist
SELECT 
    'Admin users:' as info,
    COUNT(*) as admin_count
FROM profiles 
WHERE role = 'admin';

SELECT 
    id,
    email,
    role,
    first_name || ' ' || last_name as full_name
FROM profiles 
WHERE role = 'admin';