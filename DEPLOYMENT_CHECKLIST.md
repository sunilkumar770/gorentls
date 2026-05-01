# Production Deployment Checklist

## Before Deployment

### GitHub Secrets (Must be set)
- [ ] `DB_URL` - PostgreSQL connection string
- [ ] `DB_USERNAME` - Database user
- [ ] `DB_PASSWORD` - Database password
- [ ] `JWT_SECRET` - 32-char hex string (openssl rand -hex 32)
- [ ] `RAZORPAY_KEY_ID` - Production API key
- [ ] `RAZORPAY_KEY_SECRET` - Production API secret
- [ ] `NEXT_PUBLIC_API_URL` - Production API endpoint

### Optional Secrets
- [ ] `CLOUDINARY_API_KEY` - Image storage
- [ ] `CLOUDINARY_API_SECRET` - Image storage
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Database provider

### Validation
- [ ] CI/CD pipeline passes all validation steps
- [ ] Docker build succeeds with correct secrets
- [ ] Application starts without configuration errors
- [ ] Frontend can connect to backend API

## After Deployment

- [ ] Check application logs for any missing configuration
- [ ] Verify API endpoints are accessible
- [ ] Test critical user flows (login, data fetch, upload)
