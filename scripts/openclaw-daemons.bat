@echo off
setlocal

set WS=C:\Users\Fares\.openclaw\workspace

:: Start OpenClaw daemons on login
start /B node "%WS%\scripts\notification-daemon.js" >> "%WS%\scripts\daemon.log" 2>>&1
start /B node "%WS%\scripts\sync-daemon.js" >> "%WS%\scripts\sync-daemon.log" 2>>&1
start /B node "%WS%\scripts\activity-mirror-daemon.js" >> "%WS%\scripts\activity-mirror.log" 2>>&1

echo OpenClaw daemons started (notification, sync, activity-mirror)
