# SCOLISCAN — GitHub Pages Ready

SCOLISCAN is an AI-based early scoliosis/posture asymmetry screening prototype for school health awareness. It uses a browser camera and MediaPipe Pose Landmarker to estimate visible shoulder, hip and torso asymmetry.

## Upload to GitHub
1. Open the `ScreeningSystem/SCOLISCAN` repository.
2. Upload/replace all files in this folder directly in the repository root.
3. Commit the changes.
4. Keep GitHub Pages set to `main` and `/(root)`.
5. Wait for **Actions → pages build and deployment** to show a green check.
6. Open `https://screeningsystem.github.io/SCOLISCAN/` and hard-refresh with `Ctrl + Shift + R`.

## Main files
- `index.html` — website content and interface
- `style.css` — responsive competition-ready design
- `script.js` — camera, AI pose analysis and Gmail contact button
- `SCOLISCAN_logo.jpg` — supplied full project logo, cropped for web use
- `SCOLISCAN_mark.png` — emblem used in header/footer/favicon
- `.nojekyll` — ensures GitHub Pages serves the site as plain static files

## Contact
The website contact button opens Gmail Web addressed to `hazmanzafirah@gmail.com`.

## Medical notice
SCOLISCAN is an educational screening prototype, not a medical device. It does not diagnose scoliosis and does not replace professional clinical assessment or radiographic examination.

## v13 updates
- Reset button text is now dark and clearly visible on mobile.
- Added `SCOLISCAN_team.jpg` as a featured team proof image in the Form 4 Innovation Team section.
- Updated stylesheet cache version to `v=13` so mobile browsers load the latest layout.
