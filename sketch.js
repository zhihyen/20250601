let video;
let poseNet;
let poses = [];
let score = 0;
let questionIndex = 0;
let showResult = false;
let resultText = "";
let videoReady = false;
let questions = [
  { q: "淡江大學教育科技學系的英文簡稱是？", left: "ET", right: "TKU EdTech", answer: "right" },
  { q: "教育科技系最常使用來製作簡報動畫的軟體是？", left: "PowerPoint", right: "Canva", answer: "left" },
  { q: "教育科技系常用哪個平台協作筆記與專案？", left: "hackMD", right: "YouTube", answer: "left" },
  { q: "下列哪一個程式語言是教育科技系常用來寫互動網頁的？", left: "p5.js", right: "Python", answer: "left" },
  { q: "教育科技系位於淡江哪一個校區？", left: "台北校園", right: "淡水校園", answer: "right" },
  { q: "教育科技系的課程中，哪一門課主要學習教學媒體製作？", left: "教學媒體與運用", right: "教學設計", answer: "left" },
  { q: "「教育科技」的核心價值是？", left: "教得快", right: "教得懂、學得會", answer: "right" },
  { q: "教育科技系有哪些雙主修或輔系最熱門？", left: "資訊工程系", right: "中文系", answer: "left" },
  { q: "教育科技系學生畢業專題常用哪種互動展示技術？", left: "Excel 製圖", right: "VR/AR", answer: "right" },
  { q: "教育科技系有開設哪一門與 AI 有關的課程？", left: "AI 遊戲設計", right: "機器學習與教育應用", answer: "left" }
];

// 選項區域座標
const optionY = 240; // height / 2
const optionHeight = 80;
const optionLeft = { x: 0, y: optionY, w: 320, h: optionHeight }; // 左半邊
const optionRight = { x: 320, y: optionY, w: 320, h: optionHeight }; // 右半邊

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, () => {
    videoReady = true;
  });
  video.size(640, 480);
  video.hide();

  console.log(ml5); // ← 這行可以檢查 ml5 是否載入成功 


  if (typeof ml5 !== "undefined") {
    poseNet = ml5.poseNet(video, modelReady);
    poseNet.on('pose', function(results) {
      poses = results;
    });
  } else {
    console.error("ml5 尚未載入！");
  }
}

function modelReady() {
  console.log('PoseNet Model Loaded!');
}

function draw() {
  background(220);

  if (videoReady && video.loadedmetadata) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
  } else {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("攝影機尚未啟動\n請確認權限與伺服器", width / 2, height / 2);
    return;
  }

  fill(255, 0, 0);
  textSize(24);
  textAlign(RIGHT, TOP);
  text("分數: " + score, width - 10, 10);

  if (poses.length === 0) {
    fill(255, 255, 0, 200);
    noStroke();
    textSize(28);
    textAlign(CENTER, CENTER);
    text("請將手指放在畫面內", width / 2, height / 2);
    return;
  }

  if (questionIndex >= questions.length) {
    fill(0, 200, 0);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("遊戲結束！\n總分: " + score, width / 2, height / 2);
    return;
  }

  let q = questions[questionIndex];
  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(q.q, width / 2, height / 2 - 60);

  fill(255, 255, 0, 180);
  noStroke();
  textSize(20);
  textAlign(CENTER, CENTER);
  text("請將手指放在畫面內，指尖圓點出現即可作答", width / 2, 40);

  // ==== 讓選項區域根據視窗大小自動調整 ====
  let optionY = height / 2;
  let optionHeight = 80;
  let optionLeft = { x: 0, y: optionY, w: width / 2, h: optionHeight };
  let optionRight = { x: width / 2, y: optionY, w: width / 2, h: optionHeight };

  fill(0, 100, 255, 180);
  rect(optionLeft.x, optionLeft.y, optionLeft.w, optionLeft.h);
  fill(255);
  textSize(28);
  textAlign(CENTER, CENTER);
  text(q.left, width / 4, optionLeft.y + optionLeft.h / 2);

  fill(0, 255, 100, 180);
  rect(optionRight.x, optionRight.y, optionRight.w, optionRight.h);
  fill(255);
  textAlign(CENTER, CENTER);
  text(q.right, width * 3 / 4, optionRight.y + optionRight.h / 2);

  // 只在 showResult 為 false 時偵測作答
  if (poses.length > 0) {
    let pose = poses[0].pose;
    let keypoints = pose.keypoints;

    // 只用左手或右手中指指尖偵測即可
    let leftTip = keypoints[8];
    let rightTip = keypoints[12];
    let leftTipX = leftTip.position.x;
    let leftTipY = leftTip.position.y;
    let rightTipX = rightTip.position.x;
    let rightTipY = rightTip.position.y;

    // 只顯示偵測到的其中一個指尖點（優先左手，否則右手）
    if (leftTip.score > 0.2) {
      fill(255, 128, 0);
      ellipse(leftTipX, leftTipY, 30, 30);
    } else if (rightTip.score > 0.2) {
      fill(0, 200, 255);
      ellipse(rightTipX, rightTipY, 30, 30);
    }

    // 檢查左手指尖是否碰到左選項
    if (
      leftTip.score > 0.2 &&
      leftTipX > optionLeft.x &&
      leftTipX < optionLeft.x + optionLeft.w &&
      leftTipY > optionLeft.y &&
      leftTipY < optionLeft.y + optionLeft.h
    ) {
      checkAnswer("left");
    }
    // 檢查右手指尖是否碰到右選項
    else if (
      rightTip.score > 0.2 &&
      rightTipX > optionRight.x &&
      rightTipX < optionRight.x + optionRight.w &&
      rightTipY > optionRight.y &&
      rightTipY < optionRight.y + optionRight.h
    ) {
      checkAnswer("right");
    }
  }

  // 顯示答題結果
  if (showResult) {
    fill(resultText === "正確！" ? color(0, 200, 0) : color(200, 0, 0));
    textSize(48);
    textAlign(CENTER, CENTER);
    text(resultText, width / 2, height / 2 + 120);
  }
}

// 每題只判定一次，顯示結果後自動跳下一題
function checkAnswer(ans) {
  showResult = true;
  if (questions[questionIndex].answer === ans) {
    resultText = "正確！";
    score += 10;
  } else {
    resultText = "錯誤！";
  }
  setTimeout(() => {
    showResult = false;
    questionIndex++;
  }, 1000);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
