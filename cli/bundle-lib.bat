@echo off
REM Bundle lib into CLI dist folder

REM Create the target directory
if not exist "dist\node_modules\@onion-initializr\lib" (
    mkdir "dist\node_modules\@onion-initializr\lib"
)

REM Copy lib dist files using xcopy
xcopy "..\lib\dist\*" "dist\node_modules\@onion-initializr\lib\" /E /I /Y /Q

REM Fix the package.json exports using Node.js
node fix-lib-package.js

echo Lib bundled successfully
