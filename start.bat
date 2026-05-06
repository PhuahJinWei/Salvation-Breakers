@echo off
setlocal EnableExtensions

cd /d "%~dp0" || exit /b 1
title Salvation Breakers Dev Server

where node.exe >nul 2>nul
if errorlevel 1 (
  echo node.exe was not found. Install Node.js, then run this file again.
  pause
  exit /b 1
)

node ".\scripts\dev-menu.mjs"
if errorlevel 1 pause
