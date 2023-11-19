//大きいキャンバス
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
//小さい転写用のキャンバス
let scaledCanvas = document.getElementById("scaledCanvas");
let ctxScaled = scaledCanvas.getContext("2d");

//ctx.fillStyle= "#fff";
ctx.clearRect(0, 0, 280, 280);
let moveflg = false;
let pointX, pointY;

canvas.addEventListener("mousedown", startPoint);//マウスの左ボタンを押し下げるイベント
canvas.addEventListener("mousemove", movePoint);//マウスを動かすイベント
canvas.addEventListener("mouseup", endPoint);//マウスの左ボタンを離すイベント

function startPoint(e) {
    //console.log("mousedown");
    e.preventDefault();
    pointX = e.layerX;
    pointY = e.layerY;
    ctx.beginPath();//描画開始
    ctx.moveTo(pointX,pointY);//ペン先の移動
}

function movePoint(e) {
    //console.log("mousemove");
    if (e.buttons === 1) {
        pointX = e.layerX;
        pointY = e.layerY;
        moveflg = true;
        ctx.lineTo(pointX, pointY);
        ctx.lineCap = "round";
        ctx.lineWidth = 20;
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }
}

function endPoint(e) {
    //console.log("mouseup");
    moveflg = false;
}

function clearCanvas() {
    ctx.clearRect(0, 0, 280, 280);
    ctxScaled.clearRect(0, 0, 28, 28);
    let ele = document.getElementById("result");
    //子要素がなくなるまで削除
    while (ele.firstChild) {
        ele.removeChild(ele.firstChild);
    }
}

function evaluateModel() {
    //console.log("evaluateModel()");
    evaluation();
}

//認識処理
async function evaluation() {
    //画像のテンソル
    let inputTensor = getImageTensor();
    //モデルの読込
    let modelFile = "./js/mnist.onnx";
    let session = new onnx.InferenceSession();
    await session.loadModel(modelFile);
    //推論の実行
    let outputData = await session.run([inputTensor]);
    //console.log(outputData);
    let ele = document.getElementById("result");
    let max = 0;
    let index = -1;
    outputData.forEach((value, key) => {
        value.data.forEach((val, key) => {
            console.log(key+ ":" + val);
            let para = document.createElement("p");
            let txt = document.createTextNode(key + ":" + val);
            para.setAttribute("id", "result" + key);
            para.appendChild(txt);
            ele.appendChild(para);
            if (val > max) {
                max = val;
                index = key;
            }
        })
    });
    //
    document.getElementById("result" + index).style.fontWeight = "bold";
}

//画像の処理
function getImageTensor() {
    //画像サイズの変更のため転写
    ctxScaled.save();
    ctxScaled.scale(28 / ctx.canvas.width, 28 / ctx.canvas.height);
    ctxScaled.drawImage(canvas, 0, 0);
    ctxScaled.restore();
    //画像のテンソル化
    let imageDataScaled = ctxScaled.getImageData(0, 0, 28, 28);
    //console.log(imageDataScaled);
    let input = new Float32Array(28*28);//入力データの準備(ARGB)
    for (let i = 0; i< imageDataScaled.data.length; i += 4) {
        input[i / 4] = imageDataScaled.data[i + 3] / 255;
    }
    let tensor = new Tensor(input, "float32",[1,1,28,28]);
    return tensor;
}