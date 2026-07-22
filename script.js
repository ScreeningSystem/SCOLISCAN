(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const camera = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const cameraShell = document.querySelector(".camera-shell");
  const placeholder = document.getElementById("camera-placeholder");
  const startButton = document.getElementById("start-camera");
  const captureButton = document.getElementById("capture-photo");
  const resetButton = document.getElementById("reset-photo");
  const observationPanel = document.getElementById("observation-panel");
  const reviewButton = document.getElementById("review-observation");
  const resultCard = document.getElementById("result-card");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const resultIcon = document.getElementById("result-icon");
  const timer = document.getElementById("camera-timer");
  const modelStatus = document.getElementById("ai-model-status");
  const aiMetrics = document.getElementById("ai-metrics");
  const shoulderMetric = document.getElementById("metric-shoulder");
  const hipMetric = document.getElementById("metric-hip");
  const shiftMetric = document.getElementById("metric-shift");
  const confidenceMetric = document.getElementById("metric-confidence");

  const MEDIAPIPE_MODULE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm";
  const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
  const POSE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

  let stream = null;
  let timerInterval = null;
  let elapsed = 0;
  let poseLandmarker = null;
  let poseInitError = null;
  let originalSnapshot = null;

  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  // Add the Form 4 team email address between the quotation marks below.
  // Example: const TEAM_EMAIL = "smartspine.team@gmail.com";
  // Leaving it blank still opens a prepared email draft without a recipient.
  const TEAM_EMAIL = "hazmanzafirah@gmail.com";
  const EMAIL_SUBJECT = "SMARTSPINE Innovation Enquiry";
  const EMAIL_BODY = `Hello SMARTSPINE Form 4 Team,

I would like to learn more about your innovation.

Thank you.`;

  const teamEmailLink = document.getElementById("team-email-link");
  if (teamEmailLink) {
    const gmailUrl =
      "https://mail.google.com/mail/?view=cm&fs=1" +
      `&to=${encodeURIComponent(TEAM_EMAIL)}` +
      `&su=${encodeURIComponent(EMAIL_SUBJECT)}` +
      `&body=${encodeURIComponent(EMAIL_BODY)}`;

    teamEmailLink.setAttribute("href", gmailUrl);
    teamEmailLink.setAttribute("target", "_blank");
    teamEmailLink.setAttribute("rel", "noopener noreferrer");
  }

  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 20);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  navToggle?.addEventListener("click", () => {
    const open = navMenu?.classList.toggle("open") ?? false;
    navToggle.classList.toggle("active", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu?.classList.remove("open");
      navToggle?.classList.remove("active");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
      revealObserver.observe(element);
    });
  } else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
  }

  const setModelStatus = (text, state = "loading") => {
    if (!modelStatus) return;
    modelStatus.textContent = text;
    modelStatus.closest(".ai-status")?.setAttribute("data-state", state);
  };

  const setResult = (type, icon, title, text) => {
    if (!resultCard || !resultTitle || !resultText) return;
    resultCard.classList.remove("result-low", "result-medium", "result-high");
    if (type) resultCard.classList.add(`result-${type}`);
    if (resultIcon) resultIcon.textContent = icon;
    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  const initPoseLandmarker = async () => {
    setModelStatus("Loading AI model…", "loading");

    try {
      const module = await import(MEDIAPIPE_MODULE_URL);
      const api = module.default ?? module;
      const FilesetResolver = module.FilesetResolver ?? api.FilesetResolver;
      const PoseLandmarker = module.PoseLandmarker ?? api.PoseLandmarker;

      if (!FilesetResolver || !PoseLandmarker) {
        throw new Error("MediaPipe API was not found.");
      }

      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const baseOptions = {
        modelAssetPath: POSE_MODEL_URL,
        delegate: "GPU"
      };

      try {
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions,
          runningMode: "IMAGE",
          numPoses: 1,
          minPoseDetectionConfidence: 0.55,
          minPosePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
          outputSegmentationMasks: false
        });
      } catch (gpuError) {
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL },
          runningMode: "IMAGE",
          numPoses: 1,
          minPoseDetectionConfidence: 0.55,
          minPosePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
          outputSegmentationMasks: false
        });
      }

      setModelStatus("AI is ready for analysis", "ready");
      return true;
    } catch (error) {
      poseInitError = error;
      console.error("SMARTSPINE AI initialization error:", error);
      setModelStatus("AI could not load — check internet access", "error");
      return false;
    }
  };

  const poseInitPromise = initPoseLandmarker();

  const startTimer = () => {
    elapsed = 0;
    if (timer) timer.textContent = "00:00";
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsed += 1;
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const seconds = String(elapsed % 60).padStart(2, "0");
      if (timer) timer.textContent = `${minutes}:${seconds}`;
    }, 1000);
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    clearInterval(timerInterval);
    cameraShell?.classList.remove("is-live");
  };

  const pointVisibility = (point) => Number.isFinite(point?.visibility) ? point.visibility : 1;

  const calculateTiltAngle = (left, right, width, height) => {
    const dx = (right.x - left.x) * width;
    const dy = (right.y - left.y) * height;
    return Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
  };

  const distance = (a, b, width, height) => {
    const dx = (b.x - a.x) * width;
    const dy = (b.y - a.y) * height;
    return Math.hypot(dx, dy);
  };

  const midpoint = (a, b) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  });

  const drawAnalysisOverlay = (landmarks) => {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const shoulderMid = midpoint(leftShoulder, rightShoulder);
    const hipMid = midpoint(leftHip, rightHip);

    const toPixel = (point) => ({ x: point.x * width, y: point.y * height });
    const drawLine = (a, b, colour, lineWidth = 6) => {
      const p1 = toPixel(a);
      const p2 = toPixel(b);
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.strokeStyle = colour;
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      context.stroke();
    };
    const drawPoint = (point, colour) => {
      const p = toPixel(point);
      context.beginPath();
      context.arc(p.x, p.y, Math.max(7, width * 0.008), 0, Math.PI * 2);
      context.fillStyle = colour;
      context.fill();
      context.lineWidth = Math.max(2, width * 0.0025);
      context.strokeStyle = "#ffffff";
      context.stroke();
    };

    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.24)";
    context.shadowBlur = 8;
    drawLine(leftShoulder, rightShoulder, "#1bb8a2");
    drawLine(leftHip, rightHip, "#4f8fff");
    drawLine(shoulderMid, hipMid, "#f6b94d", 5);
    [leftShoulder, rightShoulder].forEach((point) => drawPoint(point, "#1bb8a2"));
    [leftHip, rightHip].forEach((point) => drawPoint(point, "#4f8fff"));
    drawPoint(shoulderMid, "#f6b94d");
    drawPoint(hipMid, "#f6b94d");
    context.restore();
  };

  const updateAutomaticCheckboxes = ({ shoulderAngle, hipAngle, torsoShift }) => {
    const shoulderInput = document.querySelector('input[name="indicator"][value="shoulder"]');
    const waistInput = document.querySelector('input[name="indicator"][value="waist"]');
    const leanInput = document.querySelector('input[name="indicator"][value="lean"]');
    if (shoulderInput) shoulderInput.checked = shoulderAngle >= 3;
    if (waistInput) waistInput.checked = hipAngle >= 3;
    if (leanInput) leanInput.checked = torsoShift >= 5;
  };

  const showMetrics = ({ shoulderAngle, hipAngle, torsoShift, confidence }) => {
    if (shoulderMetric) shoulderMetric.textContent = `${shoulderAngle.toFixed(1)}°`;
    if (hipMetric) hipMetric.textContent = `${hipAngle.toFixed(1)}°`;
    if (shiftMetric) shiftMetric.textContent = `${torsoShift.toFixed(1)}%`;
    if (confidenceMetric) confidenceMetric.textContent = `${Math.round(confidence * 100)}%`;
    if (aiMetrics) aiMetrics.hidden = false;
  };

  const classifyPosture = ({ shoulderAngle, hipAngle, torsoShift }) => {
    const moderateFlags = [
      shoulderAngle >= 3,
      hipAngle >= 3,
      torsoShift >= 5
    ].filter(Boolean).length;

    const markedFlags = [
      shoulderAngle >= 6,
      hipAngle >= 6,
      torsoShift >= 10
    ].filter(Boolean).length;

    if (markedFlags >= 1 || moderateFlags >= 2) {
      return {
        type: "high",
        icon: "↗",
        title: "Marked posture asymmetry detected",
        text: `AI detected a marked posture difference (shoulder ${shoulderAngle.toFixed(1)}°, hip ${hipAngle.toFixed(1)}°, shift ${torsoShift.toFixed(1)}%). Repeat the image with correct positioning. If the result remains, seek professional assessment. This is not a scoliosis diagnosis.`
      };
    }

    if (moderateFlags === 1) {
      return {
        type: "medium",
        icon: "!",
        title: "Mild posture asymmetry observed",
        text: `One measurement shows a mild imbalance (shoulder ${shoulderAngle.toFixed(1)}°, hip ${hipAngle.toFixed(1)}°, shift ${torsoShift.toFixed(1)}%). Repeat the screening with the body upright and the camera level.`
      };
    }

    return {
      type: "low",
      icon: "✓",
      title: "Low posture asymmetry in this image",
      text: `Prototype measurements: shoulder ${shoulderAngle.toFixed(1)}°, hip ${hipAngle.toFixed(1)}°, shift ${torsoShift.toFixed(1)}%. This result evaluates posture in one image only and cannot rule out scoliosis.`
    };
  };

  const analyseSnapshot = async () => {
    setResult(null, "…", "AI is analysing the image", "The model is locating shoulder and hip landmarks.");
    captureButton.disabled = true;

    const ready = poseLandmarker || await poseInitPromise;
    if (!ready || !poseLandmarker) {
      captureButton.disabled = false;
      observationPanel.hidden = false;
      setResult(
        "medium",
        "!",
        "AI analysis could not start",
        `The AI model requires internet access while loading. ${poseInitError ? "Check the browser console for technical details." : ""} You may still use the manual review below.`
      );
      return;
    }

    try {
      const detection = poseLandmarker.detect(canvas);
      const landmarks = detection?.landmarks?.[0];

      if (!landmarks || landmarks.length < 25) {
        observationPanel.hidden = false;
        setResult("medium", "!", "Body landmarks were not detected", "Ensure only one person is visible, both shoulders and hips are fully shown, lighting is sufficient, and the person is facing away from the camera.");
        return;
      }

      const keyPoints = [landmarks[11], landmarks[12], landmarks[23], landmarks[24]];
      const minVisibility = Math.min(...keyPoints.map(pointVisibility));
      const confidence = keyPoints.reduce((sum, point) => sum + pointVisibility(point), 0) / keyPoints.length;
      const shoulderWidth = distance(landmarks[11], landmarks[12], canvas.width, canvas.height);

      if (minVisibility < 0.48 || shoulderWidth < canvas.width * 0.10) {
        observationPanel.hidden = false;
        setResult("medium", "!", "Image quality is insufficient", "Stand closer and ensure both shoulders and hips are unobstructed, then capture a new image.");
        return;
      }

      const shoulderAngle = calculateTiltAngle(landmarks[11], landmarks[12], canvas.width, canvas.height);
      const hipAngle = calculateTiltAngle(landmarks[23], landmarks[24], canvas.width, canvas.height);
      const shoulderMid = midpoint(landmarks[11], landmarks[12]);
      const hipMid = midpoint(landmarks[23], landmarks[24]);
      const torsoShiftPixels = Math.abs(shoulderMid.x - hipMid.x) * canvas.width;
      const torsoShift = torsoShiftPixels / Math.max(shoulderWidth, 1) * 100;

      drawAnalysisOverlay(landmarks);
      const metrics = { shoulderAngle, hipAngle, torsoShift, confidence };
      showMetrics(metrics);
      updateAutomaticCheckboxes(metrics);
      observationPanel.hidden = false;

      const classification = classifyPosture(metrics);
      setResult(classification.type, classification.icon, classification.title, classification.text);
      setModelStatus("AI analysis completed", "ready");
    } catch (error) {
      console.error("SMARTSPINE analysis error:", error);
      observationPanel.hidden = false;
      setResult("high", "!", "Analysis error", "The model could not process the image. Reload the page, confirm internet access, and try a new image.");
    } finally {
      captureButton.disabled = false;
    }
  };

  startButton?.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setResult("high", "!", "Camera is not supported", "Use Google Chrome or Microsoft Edge through HTTPS or localhost.");
      return;
    }

    try {
      stopStream();
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      camera.srcObject = stream;
      await camera.play();
      placeholder.style.display = "none";
      camera.style.display = "block";
      canvas.style.display = "none";
      cameraShell.classList.add("is-live");
      captureButton.disabled = false;
      resetButton.disabled = false;
      startButton.textContent = "Camera Active — Restart";
      observationPanel.hidden = true;
      if (aiMetrics) aiMetrics.hidden = true;
      startTimer();
      setResult("low", "●", "Camera activated", "Align the shoulders and hips with the guide lines before capturing an image.");
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setResult("high", "!", denied ? "Camera permission was denied" : "Camera could not be activated", denied ? "Allow camera access in the browser settings and try again." : "Ensure a camera is available and open the website through HTTPS or localhost.");
    }
  });

  captureButton?.addEventListener("click", async () => {
    if (!stream || !camera.videoWidth) return;

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(camera, 0, 0, canvas.width, canvas.height);
    originalSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    canvas.style.display = "block";
    camera.style.display = "none";
    cameraShell.classList.remove("is-live");
    clearInterval(timerInterval);
    observationPanel.hidden = true;
    if (aiMetrics) aiMetrics.hidden = true;
    await analyseSnapshot();
    observationPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  resetButton?.addEventListener("click", () => {
    document.querySelectorAll('input[name="indicator"]').forEach((input) => { input.checked = false; });
    observationPanel.hidden = true;
    if (aiMetrics) aiMetrics.hidden = true;
    canvas.style.display = "none";
    originalSnapshot = null;

    if (stream) {
      camera.style.display = "block";
      cameraShell.classList.add("is-live");
      startTimer();
      setResult("low", "●", "Camera ready", "Reposition the body and capture a new image.");
    } else {
      placeholder.style.display = "grid";
      setResult(null, "◎", "Ready to begin", "Activate the camera to begin the prototype posture screening.");
    }
  });

  reviewButton?.addEventListener("click", () => {
    const checked = document.querySelectorAll('input[name="indicator"]:checked').length;

    if (checked === 0) {
      setResult("low", "✓", "No manual signs selected", "Continue monitoring posture. Seek professional advice if there are concerns or other symptoms.");
    } else if (checked === 1) {
      setResult("medium", "!", "One manual sign observed", "Repeat the screening with correct positioning and speak with a teacher, parent or healthcare professional if the sign remains.");
    } else {
      setResult("high", "↗", "Further assessment is recommended", "Several posture signs were selected. Seek assessment from a doctor or healthcare professional. This is not a scoliosis diagnosis.");
    }

    resultCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  document.querySelectorAll("details").forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      document.querySelectorAll("details").forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });

  window.addEventListener("beforeunload", () => {
    stopStream();
    poseLandmarker?.close?.();
  });
})();
