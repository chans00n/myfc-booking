-- Optional: Disable the trigger if it's causing issues
-- You can run this if the trigger continues to cause problems

-- NOTE: This requires superuser privileges on the auth schema
-- Commented out to allow migrations to run successfully
-- To run this manually, use: supabase db execute --file path/to/this/file

-- Disable the trigger
-- ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Or drop it entirely
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- To re-enable later:
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;