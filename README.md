# SCOLISCAN — English Competition Edition

SCOLISCAN is a responsive, camera-based AI posture asymmetry screening prototype created for a Form 4 innovation project.

## Main features

- Bold, bright health-tech design in English
- Responsive desktop, tablet and mobile layout
- Live camera preview
- MediaPipe Pose Landmarker analysis
- Shoulder tilt, hip tilt and torso-shift measurements
- AI overlay drawn on the captured image
- Manual observation review
- Email contact button for the Form 4 team
- Clear medical and privacy disclaimers

## Add the team email address

Open `script.js` and find:

```javascript
const TEAM_EMAIL = "";
```

Insert the real Form 4 team email address between the quotation marks, for example:

```javascript
const TEAM_EMAIL = "SCOLISCAN.team@school.edu.my";
```

Do not use the example address unless it is the team’s real address. If the field remains blank, the contact button still opens a prepared email draft, but the visitor must enter the recipient manually.

## Start the website

### Windows method

1. Extract the ZIP file.
2. Open the project folder.
3. Double-click `START_LOCAL_SERVER.bat`.
4. Open `http://localhost:8000` if the browser does not open automatically.
5. Allow camera access when requested.

### Manual method

Run this command inside the project folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## AI requirements

The AI model is loaded from the internet when the page starts. The computer therefore needs internet access during the demonstration. Camera access works best through `localhost` or an HTTPS-hosted website.

## Important limitation

SCOLISCAN is an educational early-screening prototype. Its angle thresholds are prototype heuristics, not clinically validated diagnostic thresholds. It must not be presented as a medical diagnosis or a replacement for professional examination.


## Team email
The Contact button opens Gmail Web in a new tab and prepares an enquiry to hazmanzafirah@gmail.com. The visitor must be signed in to Gmail and press Send manually.
