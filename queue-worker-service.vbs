Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\AD\EVENTRA_AD"
WshShell.Run "php artisan queue:work --sleep=3 --tries=3 --max-time=3600", 0, False
Set WshShell = Nothing
