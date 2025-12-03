# EVENTRA Queue Worker Setup for Windows

## 🚀 Quick Start Options

### Option 1: Manual Start (Easiest - For Development)

Double-click `start-queue-worker.bat` to start the queue worker in a terminal window.
- Keep the window open while developing
- Close the window to stop the worker
- Restart if you make changes to mail configuration

---

### Option 2: Windows Task Scheduler (Recommended - For Production)

This will run the queue worker automatically in the background.

#### Step-by-Step Instructions:

1. **Open Task Scheduler**
   - Press `Win + R`
   - Type: `taskschd.msc`
   - Press Enter

2. **Create New Task**
   - Click "Create Task..." (not "Create Basic Task")
   - Name: `EVENTRA Queue Worker`
   - Description: `Processes email notifications for EVENTRA system`
   - Check: "Run whether user is logged on or not"
   - Check: "Run with highest privileges"
   - Configure for: Windows 10/11

3. **Triggers Tab**
   - Click "New..."
   - Begin the task: "At startup"
   - Check: "Enabled"
   - Click OK

4. **Actions Tab**
   - Click "New..."
   - Action: "Start a program"
   - Program/script: `wscript.exe`
   - Add arguments: `"c:\AD\EVENTRA_AD\queue-worker-service.vbs"`
   - Click OK

5. **Conditions Tab**
   - Uncheck: "Start the task only if the computer is on AC power"
   - Check: "Wake the computer to run this task" (optional)

6. **Settings Tab**
   - Check: "Allow task to be run on demand"
   - Check: "Run task as soon as possible after a scheduled start is missed"
   - Check: "If the task fails, restart every: 1 minute"
   - Attempt to restart up to: 3 times

7. **Save**
   - Click OK
   - Enter your Windows password if prompted

8. **Test It**
   - Right-click the task → "Run"
   - Check if it's running: Open Task Manager → Details tab → Look for `php.exe` with "queue:work" command

---

### Option 3: Run on Windows Startup (Alternative)

Add the queue worker to your Windows startup folder:

1. Press `Win + R`
2. Type: `shell:startup`
3. Press Enter
4. Create a shortcut to: `c:\AD\EVENTRA_AD\queue-worker-service.vbs`

The queue worker will start automatically when you log in to Windows.

---

## 📊 Monitoring Queue Worker

### Check if Queue Worker is Running:

**Option 1: Task Manager**
- Press `Ctrl + Shift + Esc`
- Go to "Details" tab
- Look for `php.exe` processes

**Option 2: Command Line**
```bash
tasklist | findstr php.exe
```

**Option 3: Laravel Command**
```bash
php artisan queue:monitor
```

### Check Queue Status:
```bash
php artisan queue:work --once
```

---

## 🛠️ Troubleshooting

### Queue Worker Not Processing Emails:

1. **Check if running:**
   ```bash
   tasklist | findstr php.exe
   ```

2. **Check failed jobs:**
   ```bash
   php artisan queue:failed
   ```

3. **Restart queue worker:**
   - Task Scheduler: Right-click task → "End" → Right-click → "Run"
   - Manual: Close terminal window → Double-click `start-queue-worker.bat`

4. **Clear config cache:**
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

### Emails Not Sending:

1. **Verify configuration:**
   ```bash
   php artisan tinker --execute="echo config('mail.mailer')"
   ```
   Should output: `smtp`

2. **Test email manually:**
   ```bash
   php artisan tinker --execute="Mail::raw('Test', function($m) { $m->to('your@email.com')->subject('Test'); });"
   ```

3. **Check Gmail settings:**
   - Ensure 2-Step Verification is enabled
   - Ensure App Password is correct
   - Check Gmail account for security alerts

---

## 💡 Best Practices

### Development:
- Use **Option 1** (Manual Start)
- Restart when making changes

### Production:
- Use **Option 2** (Task Scheduler)
- Monitor logs regularly
- Set up email alerts for failed jobs

---

## 📝 Notes

- Queue worker runs every hour (3600 seconds) then restarts automatically
- Failed jobs are retried 3 times before failing permanently
- Emails are processed in the order they were queued
- The worker checks for new jobs every 3 seconds

---

## 🆘 Need Help?

If emails aren't being sent:
1. Check queue status: `php artisan queue:work --once`
2. Check Laravel logs: `storage/logs/laravel.log`
3. Verify Gmail SMTP credentials in `.env`
4. Ensure queue worker is running (Task Manager)

---

**Created:** December 2025
**System:** EVENTRA Event Management
**Version:** 1.0
