UPDATE users 
SET password_hash = '$2a$10$9kNFF0yhYw45rlgyaPunl.MNMyGxXdsTCHNMhRk7w0t2mDolQam0u' 
WHERE email = 'admin@gorentals.com';

SELECT email, password_hash, length(password_hash) FROM users WHERE email = 'admin@gorentals.com';
