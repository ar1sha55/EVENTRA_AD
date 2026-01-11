# Quick Debug - Event Blast Issues

## 🚀 IMMEDIATE ACTIONS

### 1. Deploy These Changes
```bash
git add .
git commit -m "Fix: Add blast debugging and error handling"
git push origin main
```

### 2. After Deploy, Check This URL
Replace `YOUR_CRON_SECRET` with your actual `CRON_SECRET` from .env:
```
https://eventra-ad.onrender.com/diagnostics/blast-status?token=YOUR_CRON_SECRET
```

This will show you:
- ✅ Configuration status
- 📋 Recent blast attempts
- 📝 Relevant logs
- ❌ Actual error messages

### 3. If URL Shows Config Issues
Run these in Render shell:
```bash
php artisan config:clear
php artisan cache:clear
```

Then check the URL again.

## 🔍 WHAT WAS FIXED

1. **Scheduler output now saved** - No more silent failures
   - Check: `storage/logs/scheduler-blasts.log`

2. **Better error messages** - You'll now see exactly what fails
   - All Telegram API errors are logged
   - Fallback mechanisms added

3. **Auto-retry logic** - Handles common issues automatically
   - Markdown errors → retry as plain text
   - Messages too long → auto-truncate
   - Image fails → send as text

## 📊 DIAGNOSTIC ENDPOINTS

All require `?token=YOUR_CRON_SECRET`:

| Endpoint | Purpose |
|----------|---------|
| `/diagnostics/blast-status` | See recent blasts & logs |
| `/diagnostics/test-scheduler` | Manually run scheduler |
| `/cron/run` | Trigger via UptimeRobot (existing) |

## 🎯 MOST LIKELY ISSUES

Based on "fails immediately with no error":

### Issue A: Markdown Formatting Error ✅ FIXED
- Cause: Special characters in message break Markdown
- Fix: Now auto-retries without Markdown

### Issue B: Message Too Long ✅ FIXED  
- Cause: Event description > 4096 chars (Telegram limit)
- Fix: Now auto-truncates

### Issue C: Missing Config
- Cause: Config cached with wrong values
- Fix: Run `php artisan config:clear`

## 📝 WHAT TO DO NOW

1. **Deploy** (git push)
2. **Visit** the diagnostics URL
3. **Share** the JSON output if issue persists
4. **Check** logs on Render:
   ```bash
   tail -f storage/logs/scheduler-blasts.log
   ```

## 🆘 STILL NOT WORKING?

Get this info and share:

```bash
# On Render shell:
php artisan config:clear
php artisan tinker --execute="echo 'Bot Token: ' . (config('services.telegram.bot_token') ? 'SET' : 'NOT SET') . PHP_EOL . 'Channel ID: ' . config('services.telegram.channel_id');"
```

Then visit: `/diagnostics/blast-status?token=YOUR_CRON_SECRET`

Copy the entire JSON response.
