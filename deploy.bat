@echo off
echo Building Celefy for deployment...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful! 
    echo.
    echo 📁 Your dist folder is ready for deployment
    echo.
    echo 🚀 To deploy to Netlify:
    echo 1. Go to https://netlify.com
    echo 2. Drag the 'dist' folder to the dashboard
    echo 3. Your site will be deployed instantly!
    echo.
    echo 📋 Or use Netlify CLI:
    echo npm install -g netlify-cli
    echo netlify login
    echo netlify deploy --prod --dir=dist
    echo.
    echo 🔍 Check DEPLOYMENT.md for detailed instructions
    echo.
    pause
) else (
    echo.
    echo ❌ Build failed! Check the errors above.
    echo.
    pause
)
