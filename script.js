let imgInput = document.getElementById('imageInput');
let canvas = document.getElementById('canvasOutput');
let ctx = canvas.getContext('2d');
let countDisplay = document.getElementById('karinakuCount');

function onOpenCvReady() {
  console.log("✅ OpenCV.js is ready.");
}

imgInput.addEventListener('change', (e) => {
  if (e.target.files.length === 0) return;

  let file = e.target.files[0];
  let reader = new FileReader();
  reader.onload = function(ev) {
    let img = new Image();
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      detectKarinaku(img);
    }
    img.src = ev.target.result;
  }
  reader.readAsDataURL(file);
});

function detectKarinaku(image) {
  let src = cv.imread(image);
  let hsv = new cv.Mat();
  let mask = new cv.Mat();

  // Convert to HSV and filter pink/red range
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  let lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [160, 50, 50, 0]);
  let upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [179, 255, 255, 255]);
  cv.inRange(hsv, lower, upper, mask);

  // Blur to reduce noise
  cv.GaussianBlur(mask, mask, new cv.Size(5, 5), 0);

  // Contour detection
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let karinakuCount = 0;

  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    if (area > 10 && area < 1000) {  // adjust for real-world images
      let perimeter = cv.arcLength(cnt, true);
      let circularity = 4 * Math.PI * area / (perimeter * perimeter);
      if (circularity > 0.4) {  // approximate circle/oval
        karinakuCount++;
        let color = new cv.Scalar(0, 255, 0, 255);
        cv.drawContours(src, contours, i, color, 2);
      }
    }
    cnt.delete();
  }

  // Show result
  cv.imshow('canvasOutput', src);
  countDisplay.textContent = `Karinaku Count: ${karinakuCount}`;

  // Cleanup
  src.delete(); hsv.delete(); mask.delete();
  contours.delete(); hierarchy.delete(); lower.delete(); upper.delete();
}
