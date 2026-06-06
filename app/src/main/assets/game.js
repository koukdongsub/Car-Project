// --- Babylon.js 엔진 전환 버전 (game.js) ---
// 스플래시 이벤트는 index.html에서 처리

// 차량 데이터 (사용자 요청에 따라 차량 사이즈 약 30% 축소 -> 여기서 다시 1/2 축소)
const vehicleData = {
    sedan:   { type: 'sedan', w: 0.7, h: 0.5, l: 1.6, accel: 0.004, maxSpeed: 0.35, color: {r: 0, g: 0.5, b: 1} },
    sports:  { type: 'sports', w: 0.7, h: 0.45, l: 1.6, accel: 0.007, maxSpeed: 0.45, color: {r: 1, g: 0, b: 0} },
    truck:   { type: 'truck', w: 0.9, h: 0.9, l: 2.25, accel: 0.003, maxSpeed: 0.25, color: {r: 1, g: 0.2, b: 0.2} }
};

let currentVehicle = null;
let currentDifficulty = 'EASY';

// --- 커스텀 맵 데이터 ---
let customMapData = {
  "difficulty": "EASY",
  "startPos": {
    "x": -1.4277184245467764,
    "z": 33.0922874344515,
    "rotation": 3.141592653589793
  },
  "parkingSpot": {
    "x": 0,
    "z": -35,
    "w": 2.25,
    "l": 4.5
  },
  "objects": [] // 맵 에디터에서 생성된 데이터가 여기에 들어갑니다.
};

window.selectVehicle = function(type) {
    currentVehicle = vehicleData[type];
    if (!currentVehicle) currentVehicle = vehicleData.sedan;
    const vSelection = document.getElementById('vehicle-selection');
    const dSelection = document.getElementById('difficulty-selection');
    const selectedText = document.getElementById('selected-vehicle-text');
    
    if (vSelection) {
        vSelection.style.opacity = '0';
        setTimeout(() => {
            vSelection.classList.add('hidden');
            if (dSelection) {
                dSelection.classList.remove('hidden');
                dSelection.style.opacity = '0';
                void dSelection.offsetWidth; 
                dSelection.style.transition = 'opacity 0.3s ease';
                dSelection.style.opacity = '1';
            }
        }, 300);
    }
    
    if (selectedText) selectedText.innerText = "VEHICLE: " + type.toUpperCase();
};

// --- 게임 상태 변수 ---
let isGameOver = false;
let gameStartTime = 0; 
let timerValue = 0;
let timerInterval;

// 물리 상태
let carPhysics = { x: 0, y: 0, z: 0, speed: 0, angle: 0 };
let walls = [];
let roadMeshes = [];
let physicsWalls = []; // 실제 물리적 충돌을 수행할 투명 벽들

// 컨트롤 및 기어 상태
const controls = { gas: false, brake: false, left: false, right: false };
let currentGear = 'D'; 

function setGear(gear) {
    currentGear = gear;
    const btns = document.querySelectorAll('.gear-btn');
    btns.forEach(btn => {
        if (btn.innerText === gear) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    const gearSelector = document.getElementById('gear-selector');
    if (gearSelector) gearSelector.dataset.gear = gear;
}

// --- Babylon.js 핵심 변수 ---
let engine, scene, camera;
let carGroup;

/**
 * Babylon 엔진 초기화
 */
function initBabylon() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    container.innerHTML = '<canvas id="renderCanvas" style="width:100%; height:100%; touch-action: none;"></canvas>';
    const canvas = document.getElementById('renderCanvas');

    if (!window.BABYLON) {
        alert("Babylon.js 라이브러리가 로드되지 않았습니다.");
        return;
    }

    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
}

/**
 * 맵 생성
 */
function buildMap(difficulty) {
    const activeMap = (customMapData && customMapData.difficulty === difficulty) ? customMapData : null;
    roadMeshes = [];
    physicsWalls = [];
    walls = []; // 초기화

    let floorColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    let wallColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    let bgColor = new BABYLON.Color3(0.53, 0.81, 0.92);

    if (difficulty === 'EASY') {
        floorColor = new BABYLON.Color3(0.18, 0.29, 0.07);
        wallColor = new BABYLON.Color3(0.36, 0.23, 0.13);
    } else if (difficulty === 'MEDIUM') {
        floorColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        wallColor = new BABYLON.Color3(0.1, 0.15, 0.2);
        bgColor = new BABYLON.Color3(0.02, 0.02, 0.06);
    } else if (difficulty === 'DIFFICULT') {
        floorColor = new BABYLON.Color3(0.13, 0.02, 0);
        wallColor = new BABYLON.Color3(0.1, 0.04, 0.02);
        bgColor = new BABYLON.Color3(0.2, 0, 0);
    }

    scene.clearColor = BABYLON.Color4.FromColor3(bgColor);
    new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.8;
    const dirLight = new BABYLON.DirectionalLight("DirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(20, 40, 20);

    const floorSize = 1000;
    const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: floorSize, height: floorSize }, scene);
    const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
    floorMat.diffuseColor = floorColor;
    floor.material = floorMat;
    roadMeshes.push(floor);

    // 커스텀 도로 오브젝트 로드 및 사용자 지정 투명벽 생성
    if (activeMap && activeMap.objects) {
        activeMap.objects.forEach(obj => {
            BABYLON.SceneLoader.ImportMesh("", "roads/models/", obj.type + ".glb", scene, (meshes) => {
                const roadGroup = new BABYLON.Mesh("roadGroup", scene);
                meshes.forEach(m => {
                    m.parent = roadGroup;
                    if (m.material) m.material.backFaceCulling = false;
                    roadMeshes.push(m);
                });
                roadGroup.position.set(obj.x, obj.y || 0.05, obj.z);
                roadGroup.rotation.y = obj.rotation;
                roadGroup.scaling = new BABYLON.Vector3(8.1, 8.1, 8.1); 

                // 사용자 지정 투명벽 생성 (F, B, L, R)
                if (obj.walls) {
                    const size = 4; // 8.1 / 2 (근사치)
                    const wallHeight = 4;
                    const configs = [
                        { dx: 0, dz: size, rot: 0 },         // F
                        { dx: 0, dz: -size, rot: 0 },        // B
                        { dx: -size, dz: 0, rot: Math.PI/2 }, // L
                        { dx: size, dz: 0, rot: Math.PI/2 }  // R
                    ];

                    obj.walls.forEach((enabled, i) => {
                        if (enabled) {
                            const conf = configs[i];
                            // 회전 행렬을 이용한 월드 좌표 계산
                            const cos = Math.cos(obj.rotation);
                            const sin = Math.sin(obj.rotation);
                            const worldX = obj.x + (conf.dx * cos + conf.dz * sin);
                            const worldZ = obj.z + (-conf.dx * sin + conf.dz * cos);

                            const wall = {
                                x: worldX,
                                z: worldZ,
                                rotation: obj.rotation + conf.rot,
                                w: 8.1,
                                h: wallHeight
                            };
                            physicsWalls.push(wall);
                        }
                    });
                }
            });
        });
    }

    if (activeMap) {
        parkingSpot = activeMap.parkingSpot;
        carPhysics.x = activeMap.startPos.x;
        carPhysics.z = activeMap.startPos.z;
        carPhysics.angle = activeMap.startPos.rotation;
    }

    // 주차 구역 시각화
    const spot = BABYLON.MeshBuilder.CreateGround("spot", { width: parkingSpot.w, height: parkingSpot.l }, scene);
    spot.position = new BABYLON.Vector3(parkingSpot.x, 0.02, parkingSpot.z);
    const spotMat = new BABYLON.StandardMaterial("spotMat", scene);
    spotMat.diffuseColor = new BABYLON.Color3(0, 0.8, 0.5);
    spotMat.alpha = 0.3;
    spot.material = spotMat;
}

let wheelMeshes = [];

function createCar() {
    const v = currentVehicle;
    if (!v) return;
    carGroup = new BABYLON.TransformNode("carGroup", scene);

    let modelFile = "kenney_car-kit/Models/GLB%20format/sedan.glb";
    if (v.type === "sports") modelFile = "kenney_car-kit/Models/GLB%20format/race.glb";
    if (v.type === "truck") modelFile = "kenney_car-kit/Models/GLB%20format/truck.glb";

    BABYLON.SceneLoader.ImportMeshAsync("", "", modelFile, scene).then(result => {
        const root = result.meshes[0];
        root.parent = carGroup;
        root.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
        
        wheelMeshes = [];
        result.meshes.forEach(m => {
            if (m.name.toLowerCase().includes("wheel")) wheelMeshes.push(m);
        });
    });

    camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -15), scene);
    camera.radius = 8; 
    camera.heightOffset = 3.5;
    camera.lockedTarget = carGroup;
    scene.activeCamera = camera;
}

let steeringAngle = 0;
const maxSteering = 0.45;
let isSteeringActive = false;

function updatePhysics() {
    if(isGameOver || !currentVehicle) return;
    const v = currentVehicle;

    if (!isSteeringActive) {
        if (!controls.left && !controls.right) {
            steeringAngle *= 0.85;
        } else {
            if (controls.left) steeringAngle = Math.min(steeringAngle + 0.04, maxSteering);
            if (controls.right) steeringAngle = Math.max(steeringAngle - 0.04, -maxSteering);
        }
        const wheelUI = document.getElementById('steering-wheel');
        if (wheelUI) wheelUI.style.transform = `rotate(${-(steeringAngle / maxSteering) * 120}deg)`;
    }

    wheelMeshes.forEach(m => {
        m.rotationQuaternion = null;
        m.rotation.x -= carPhysics.speed / 0.2; 
        if (m.name.toLowerCase().includes("front")) m.rotation.y = -steeringAngle;
    });

    if (controls.gas) {
        const dir = (currentGear === 'D') ? 1 : -1;
        carPhysics.speed += v.accel * dir;
    } else {
        carPhysics.speed *= 0.97; 
    }
    
    if (controls.brake) carPhysics.speed *= 0.82; 

    const speedLimit = currentGear === 'D' ? v.maxSpeed : v.maxSpeed * 0.5;
    if(carPhysics.speed > speedLimit) carPhysics.speed = speedLimit;
    if(carPhysics.speed < -speedLimit) carPhysics.speed = -speedLimit;

    const oldX = carPhysics.x;
    const oldZ = carPhysics.z;
    const oldAngle = carPhysics.angle;

    if(Math.abs(carPhysics.speed) > 0.005) {
        carPhysics.angle -= (carPhysics.speed / (v.l * 0.75)) * Math.tan(steeringAngle);
    }

    carPhysics.x -= Math.sin(carPhysics.angle) * carPhysics.speed;
    carPhysics.z -= Math.cos(carPhysics.angle) * carPhysics.speed;

    // 투명 물리 벽 충돌 체크
    if (isCollidingWithWalls()) {
        carPhysics.x = oldX;
        carPhysics.z = oldZ;
        carPhysics.angle = oldAngle;
        carPhysics.speed *= -0.3; // 반동
    }

    if (scene && roadMeshes.length > 0) {
        const halfL = v.l * 0.4;
        const cos = Math.cos(carPhysics.angle);
        const sin = Math.sin(carPhysics.angle);
        const frontPos = { x: carPhysics.x - sin * halfL, z: carPhysics.z - cos * halfL };
        const rearPos = { x: carPhysics.x + sin * halfL, z: carPhysics.z + cos * halfL };

        const rayF = new BABYLON.Ray(new BABYLON.Vector3(frontPos.x, carPhysics.y + 1.5, frontPos.z), new BABYLON.Vector3(0, -1, 0), 20);
        const rayR = new BABYLON.Ray(new BABYLON.Vector3(rearPos.x, carPhysics.y + 1.5, rearPos.z), new BABYLON.Vector3(0, -1, 0), 20);
        const pickF = scene.pickWithRay(rayF, (m) => roadMeshes.includes(m));
        const pickR = scene.pickWithRay(rayR, (m) => roadMeshes.includes(m));

        let targetHF = 0, targetHR = 0;
        if (pickF && pickF.hit) targetHF = pickF.pickedPoint.y;
        if (pickR && pickR.hit) targetHR = pickR.pickedPoint.y;

        carPhysics.y += ((targetHF + targetHR) / 2 - carPhysics.y) * 0.2;
        if (carGroup) {
            carGroup.position.set(carPhysics.x, carPhysics.y, carPhysics.z);
            carGroup.rotation.y = carPhysics.angle;
            carGroup.rotation.x = Math.atan2(targetHF - targetHR, v.l * 0.8);
        }
    }

    if (currentDifficulty !== 'FREE') checkWinCondition();
}

function isCollidingWithWalls() {
    const corners = getCarCorners();
    for (let w of physicsWalls) {
        // 벽 로컬 좌표계로 변환하여 체크
        const cos = Math.cos(-w.rotation);
        const sin = Math.sin(-w.rotation);
        for (let c of corners) {
            const lx = (c.x - w.x) * cos + (c.z - w.z) * sin;
            const lz = -(c.x - w.x) * sin + (c.z - w.z) * cos;
            // 벽의 두께는 0.2로 가정
            if (Math.abs(lx) < w.w/2 && Math.abs(lz) < 0.2) return true;
        }
    }
    return false;
}

function getCarCorners() {
    if (!currentVehicle) return [];
    const cos = Math.cos(carPhysics.angle), sin = Math.sin(carPhysics.angle);
    const w = currentVehicle.w / 2, l = currentVehicle.l / 2;
    return [{dx:-w, dz:-l}, {dx:w, dz:-l}, {dx:w, dz:l}, {dx:-w, dz:l}].map(p => ({
        x: carPhysics.x + (p.dx * cos + p.dz * sin),
        z: carPhysics.z + (-p.dx * sin + p.dz * cos)
    }));
}

function checkWinCondition() {
    const dist = Math.hypot(carPhysics.x - parkingSpot.x, carPhysics.z - parkingSpot.z);
    const angleMod = Math.abs(carPhysics.angle % Math.PI);
    if(dist < 1.0 && (angleMod < 0.2 || angleMod > (Math.PI - 0.2)) && Math.abs(carPhysics.speed) < 0.05) {
        gameOver(true, "PARKING SUCCESS!");
    }
}

function startGame(difficulty) {
    currentDifficulty = difficulty;
    isGameOver = false;
    gameStartTime = Date.now(); 
    const mainMenu = document.getElementById('main-menu'), gameScreen = document.getElementById('game-screen'), overlay = document.getElementById('game-overlay');
    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');
    if (overlay) overlay.classList.add('hidden');
    initBabylon();
    buildMap(difficulty);
    createCar();
    bindControls();
    setTimeout(() => { setupMobileCamera(); }, 500);
    timerValue = (difficulty === 'FREE') ? 0 : 60;
    clearInterval(timerInterval);
    if (difficulty !== 'FREE') {
        timerInterval = setInterval(() => {
            timerValue--;
            if (document.getElementById('timer')) document.getElementById('timer').innerText = timerValue;
            if(timerValue <= 0) gameOver(false, "TIME OVER!");
        }, 1000);
    }
    engine.runRenderLoop(() => { if(!isGameOver) { updatePhysics(); drawMinimap(); scene.render(); } });
}

function gameOver(win, msgText) {
    isGameOver = true;
    clearInterval(timerInterval);
    const overlay = document.getElementById('game-overlay'), msg = document.getElementById('result-message');
    if (overlay) overlay.classList.remove('hidden');
    if (msg) { msg.textContent = msgText; msg.style.color = win ? "#0f0" : "#f00"; }
}

function backToMenu() {
    if (engine) engine.stopRenderLoop();
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

window.backToMenu = backToMenu;
window.startGame = startGame;
window.setGear = setGear;

function openEditor() {
    const editorWin = window.open('editor.html', '_blank');
    if (editorWin) {
        setTimeout(() => { editorWin.postMessage({ type: "LOAD_MAP", map: customMapData }, "*"); }, 1500);
    }
}
window.openEditor = openEditor;

function setupMobileCamera() {
    if (!camera) return;
    let isTouching = false, lastX = 0, lastY = 0, startDist = 0;
    const canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) { isTouching = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
        else if (e.touches.length === 2) { isTouching = false; startDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    });
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isTouching) {
            const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
            camera.rotationOffset = (camera.rotationOffset + dx * 0.5) % 360;
            camera.heightOffset = Math.max(1, Math.min(15, camera.heightOffset - dy * 0.05));
            lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            camera.radius = Math.max(3, Math.min(30, camera.radius - (currentDist - startDist) * 0.05));
            startDist = currentDist;
        }
    });
    canvas.addEventListener('touchend', () => { isTouching = false; });
}

function bindControls() {
    const gasBtn = document.getElementById('btn-gas'), brakeBtn = document.getElementById('btn-brake'), wheel = document.getElementById('steering-wheel'), wheelContainer = document.querySelector('.steering-wheel-container');
    const setControl = (key, val) => controls[key] = val;
    if (gasBtn) { gasBtn.onmousedown = gasBtn.ontouchstart = (e) => { e.preventDefault(); setControl('gas', true); }; gasBtn.onmouseup = gasBtn.ontouchend = gasBtn.onmouseleave = () => setControl('gas', false); }
    if (brakeBtn) { brakeBtn.onmousedown = brakeBtn.ontouchstart = (e) => { e.preventDefault(); setControl('brake', true); }; brakeBtn.onmouseup = brakeBtn.ontouchend = brakeBtn.onmouseleave = () => setControl('brake', false); }
    let startX = 0, startWheelAngle = 0, currentWheelAngle = 0;
    const startSteer = (e) => { e.preventDefault(); isSteeringActive = true; startX = e.touches ? e.touches[0].clientX : e.clientX; startWheelAngle = currentWheelAngle; };
    const moveSteer = (e) => { if (!isSteeringActive) return; const currentX = e.touches ? e.touches[0].clientX : e.clientX, deltaX = currentX - startX; let angle = Math.max(-120, Math.min(120, startWheelAngle + deltaX * 0.8)); currentWheelAngle = angle; if (wheel) wheel.style.transform = `rotate(${angle}deg)`; steeringAngle = -(angle / 120) * maxSteering; };
    const endSteer = () => { isSteeringActive = false; if (wheel) { wheel.style.transition = 'transform 0.3s ease-out'; wheel.style.transform = 'rotate(0deg)'; } currentWheelAngle = 0; };
    if (wheelContainer) { wheelContainer.onmousedown = wheelContainer.ontouchstart = startSteer; window.onmousemove = window.ontouchmove = moveSteer; window.onmouseup = window.ontouchend = endSteer; }
    window.onkeydown = (e) => { const k = e.key.toLowerCase(); if(k === 'w' || k === 'arrowup') setControl('gas', true); if(k === 's' || k === 'arrowdown') setControl('brake', true); if(k === 'a' || k === 'arrowleft') setControl('left', true); if(k === 'd' || k === 'arrowright') setControl('right', true); };
    window.onkeyup = (e) => { const k = e.key.toLowerCase(); if(k === 'w' || k === 'arrowup') setControl('gas', false); if(k === 's' || k === 'arrowdown') setControl('brake', false); if(k === 'a' || k === 'arrowleft') setControl('left', false); if(k === 'd' || k === 'arrowright') setControl('right', false); };
}

function drawMinimap() {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.translate(w/2, h/2);
    const zoom = 1.0; 
    ctx.fillStyle = 'rgba(150,150,150,0.6)';
    if (parkingSpot) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillRect((parkingSpot.x - parkingSpot.w/2 - carPhysics.x) * zoom, (parkingSpot.z - parkingSpot.l/2 - carPhysics.z) * zoom, parkingSpot.w * zoom, parkingSpot.l * zoom);
    }
    ctx.restore();
    ctx.save(); ctx.translate(w/2, h/2); ctx.rotate(-carPhysics.angle); ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.fill(); ctx.restore();
}
