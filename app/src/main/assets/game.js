// --- Babylon.js 엔진 전환 버전 (game.js) ---
// 스플래시 이벤트는 index.html에서 처리

// 차량 데이터
const vehicleData = {
    sedan:   { type: 'sedan', w: 2.0, h: 1.4, l: 4.5, accel: 0.004, maxSpeed: 0.35, color: {r: 0, g: 0.5, b: 1} },
    sports:  { type: 'sports', w: 2.0, h: 1.3, l: 4.6, accel: 0.007, maxSpeed: 0.45, color: {r: 1, g: 0, b: 0} },
    truck:   { type: 'truck', w: 2.6, h: 2.5, l: 6.5, accel: 0.003, maxSpeed: 0.25, color: {r: 1, g: 0.2, b: 0.2} }
};

let currentVehicle = null;
let currentDifficulty = 'EASY';


window.selectVehicle = function(type) {
    window.location.hash = 'difficulty-' + type;
};

// --- History Routing Setup ---
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    const hash = window.location.hash;
    
    if (hash === '' || hash === '#') {
        exitGameIfRunning();
        showVehicleSelectionUI();
    } else if (hash.startsWith('#difficulty')) {
        exitGameIfRunning();
        const type = hash.split('-')[1];
        showDifficultySelectionUI(type);
    } else if (hash.startsWith('#game')) {
        const diff = hash.split('-')[1];
        launchGameUI(diff);
    }
}

function showDifficultySelectionUI(type) {
    currentVehicle = vehicleData[type];
    if (!currentVehicle) currentVehicle = vehicleData.sedan; // 기본값 방어 코드
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
                void dSelection.offsetWidth; // Reflow
                dSelection.style.transition = 'opacity 0.3s ease';
                dSelection.style.opacity = '1';
            }
        }, 300);
    } else {
        if (dSelection) {
            dSelection.classList.remove('hidden');
            dSelection.style.opacity = '1';
        }
    }
    
    if (selectedText) selectedText.innerText = "VEHICLE: " + type.toUpperCase();
}

function showVehicleSelectionUI() {
    const vSel = document.getElementById('vehicle-selection');
    const dSel = document.getElementById('difficulty-selection');
    if (dSel && !dSel.classList.contains('hidden')) {
        dSel.style.opacity = '0';
        setTimeout(() => {
            dSel.classList.add('hidden');
            if (vSel) {
                vSel.classList.remove('hidden');
                void vSel.offsetWidth;
                vSel.style.opacity = '1';
            }
        }, 300);
    } else {
        if (dSel) dSel.classList.add('hidden');
        if (vSel) {
            vSel.classList.remove('hidden');
            vSel.style.opacity = '1';
        }
    }
}

function exitGameIfRunning() {
    if (engine) engine.stopRenderLoop();
    const gameScreen = document.getElementById('game-screen');
    const mainMenu = document.getElementById('main-menu');
    const overlay = document.getElementById('game-overlay');
    if (gameScreen) gameScreen.classList.add('hidden');
    if (mainMenu) mainMenu.classList.remove('hidden');
    if (overlay) overlay.classList.add('hidden');
}

// --- 게임 상태 변수 ---
let isGameOver = false;
let timerValue = 0;
let timerInterval;

// 물리 상태
let carPhysics = { x: 0, z: 0, speed: 0, angle: 0 };
let walls = [];
let parkingSpot = { x: 0, z: 0, w: 3.5, l: 6.0 };

// NPC 상태
let npcCars = [];
let playerBox = null;

// 컨트롤 및 기어 상태 (D/R 단순화)
const controls = { gas: false, brake: false, left: false, right: false };
let currentGear = 'D'; // D (Drive), R (Reverse)

function setGear(gear) {
    currentGear = gear;
    // UI 업데이트
    const btns = document.querySelectorAll('.gear-btn');
    btns.forEach(btn => {
        if (btn.innerText === gear) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    // UI에 현재 기어 표시 (색상 변화)
    const gearSelector = document.getElementById('gear-selector');
    if (gearSelector) gearSelector.dataset.gear = gear;
}

// --- Babylon.js 핵심 변수 ---
let engine, scene, camera;
let ambientLight, dirLight;
let carGroup;
let envObjects = [];

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
    let floorColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    let wallColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    let bgColor = new BABYLON.Color3(0.53, 0.81, 0.92);
    let fogDensity = 0.01;

    if (difficulty === 'FREE') {
        floorColor = new BABYLON.Color3(0.25, 0.25, 0.25);
        wallColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    } else if (difficulty === 'EASY') {
        floorColor = new BABYLON.Color3(0.18, 0.29, 0.07);
        wallColor = new BABYLON.Color3(0.36, 0.23, 0.13);
    } else if (difficulty === 'MEDIUM') {
        floorColor = new BABYLON.Color3(0.4, 0.4, 0.4); // 가시성이 좋은 옅은 회색 바닥으로 변경
        wallColor = new BABYLON.Color3(0.1, 0.15, 0.2);
        bgColor = new BABYLON.Color3(0.02, 0.02, 0.06);
        fogDensity = 0.02;
    } else if (difficulty === 'DIFFICULT') {
        floorColor = new BABYLON.Color3(0.13, 0.02, 0);
        wallColor = new BABYLON.Color3(0.1, 0.04, 0.02);
        bgColor = new BABYLON.Color3(0.2, 0, 0);
        fogDensity = 0.03;
    }

    scene.clearColor = BABYLON.Color4.FromColor3(bgColor);
    scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
    scene.fogDensity = 0;
    scene.fogColor = bgColor;

    ambientLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = (difficulty === 'EASY') ? 1.0 : 0.6; // 밝기 상향

    dirLight = new BABYLON.DirectionalLight("DirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = (difficulty === 'EASY') ? 1.2 : 0.8; // 밝기 상향

    // 색감이 흐릿하게 나오는 문제를 해결하기 위해 톤 매핑 설정 상향 조정
    scene.imageProcessingConfiguration.exposure = 1.4;
    scene.imageProcessingConfiguration.contrast = 1.3;

    const floorSize = (difficulty === 'FREE') ? 1000 : 200;
    const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: floorSize, height: floorSize }, scene);
    const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
    floorMat.diffuseColor = floorColor;
    floorMat.specularColor = new BABYLON.Color3(0, 0, 0);
    floorMat.usePhysicalLightFalloff = false; // 흐릿함 방지를 위해 빛 감쇠 비활성화
    floor.material = floorMat;
    floor.receiveShadows = true;

    walls = [];
    const addWall = (x, z, w, l) => {
        const wall = BABYLON.MeshBuilder.CreateBox("wall", { width: w, height: 2, depth: l }, scene);
        wall.position = new BABYLON.Vector3(x, 1, z);
        const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
        wallMat.diffuseColor = wallColor;
        wallMat.usePhysicalLightFalloff = false; // 흐릿함 방지를 위해 빛 감쇠 비활성화
        wall.material = wallMat;
        walls.push({ x: x - w/2, z: z - l/2, w: w, l: l });
    };

    if (difficulty !== 'FREE') {
        addWall(0, -50, 100, 2);
        addWall(0, 50, 100, 2);
        addWall(-50, 0, 2, 100);
        addWall(50, 0, 2, 100);

        if (difficulty === 'EASY') {
            parkingSpot = { x: 0, z: -30, w: 4, l: 8 };
            addWall(-10, -10, 5, 20);
        } else if (difficulty === 'MEDIUM') {
            parkingSpot = { x: 20, z: -30, w: 3.5, l: 7 };
            addWall(0, -15, 40, 2);
        } else {
            parkingSpot = { x: 40, z: -40, w: 3, l: 7 };
            addWall(0, 0, 80, 2);
        }

        // 1. 바닥 인디케이터 (은은한 글로우)
        const spot = BABYLON.MeshBuilder.CreateGround("spot", { width: parkingSpot.w, height: parkingSpot.l }, scene);
        spot.position = new BABYLON.Vector3(parkingSpot.x, 0.02, parkingSpot.z);
        const spotMat = new BABYLON.StandardMaterial("spotMat", scene);
        spotMat.diffuseColor = new BABYLON.Color3(0, 0.8, 0.5);
        spotMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0.2);
        spotMat.alpha = 0.25;
        spot.material = spotMat;

        // 2. 실제 주차선 그리기 (얇은 Box로 입체감 부여)
        const lineThickness = 0.15;
        const lineMat = new BABYLON.StandardMaterial("lineMat", scene);
        lineMat.diffuseColor = new BABYLON.Color3(1, 1, 1); // 흰색 주차선
        lineMat.emissiveColor = new BABYLON.Color3(0.6, 0.6, 0.6); // 약간 발광하여 선명하게

        // 좌측 선
        const leftLine = BABYLON.MeshBuilder.CreateBox("leftLine", { width: lineThickness, height: 0.05, depth: parkingSpot.l }, scene);
        leftLine.position = new BABYLON.Vector3(parkingSpot.x - parkingSpot.w / 2, 0.03, parkingSpot.z);
        leftLine.material = lineMat;
        
        // 우측 선
        const rightLine = BABYLON.MeshBuilder.CreateBox("rightLine", { width: lineThickness, height: 0.05, depth: parkingSpot.l }, scene);
        rightLine.position = new BABYLON.Vector3(parkingSpot.x + parkingSpot.w / 2, 0.03, parkingSpot.z);
        rightLine.material = lineMat;
        
        // 뒤쪽 선 (막힌 곳)
        const backLine = BABYLON.MeshBuilder.CreateBox("backLine", { width: parkingSpot.w + lineThickness, height: 0.05, depth: lineThickness }, scene);
        backLine.position = new BABYLON.Vector3(parkingSpot.x, 0.03, parkingSpot.z - parkingSpot.l / 2);
        backLine.material = lineMat;

        // --- NEW: 스토퍼 추가 ---
        const stopperMat = new BABYLON.StandardMaterial("stopperMat", scene);
        stopperMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.1);
        const stopper = BABYLON.MeshBuilder.CreateBox("stopper", { width: parkingSpot.w - 0.8, height: 0.15, depth: 0.3 }, scene);
        stopper.position = new BABYLON.Vector3(parkingSpot.x, 0.075, parkingSpot.z - parkingSpot.l / 2 + 0.6);
        stopper.material = stopperMat;
        walls.push({ x: parkingSpot.x - (parkingSpot.w - 0.8)/2, z: stopper.position.z - 0.15, w: parkingSpot.w - 0.8, l: 0.3 });
        
        // --- NEW: 바닥 화살표 페인트 ---
        const arrowMat = new BABYLON.StandardMaterial("arrowMat", scene);
        arrowMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        arrowMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        arrowMat.alpha = 0.5;
        
        const arrowBody = BABYLON.MeshBuilder.CreatePlane("arrowBody", { width: 1.2, height: 5 }, scene);
        arrowBody.rotation.x = Math.PI / 2;
        arrowBody.position = new BABYLON.Vector3(parkingSpot.x, 0.025, parkingSpot.z + 10);
        arrowBody.material = arrowMat;
        
        const arrowHead = BABYLON.MeshBuilder.CreateDisc("arrowHead", { radius: 1.8, tessellation: 3 }, scene);
        arrowHead.rotation.x = Math.PI / 2;
        arrowHead.rotation.y = -Math.PI / 2;
        arrowHead.position = new BABYLON.Vector3(parkingSpot.x, 0.025, parkingSpot.z + 6.6); // 10 - 5/2 - 1.8/2 approx
        arrowHead.material = arrowMat;

        // 3. 코너 마커 (네 모서리의 입체 기둥)
        const markerMat = new BABYLON.StandardMaterial("markerMat", scene);
        markerMat.diffuseColor = new BABYLON.Color3(0, 1, 1);
        markerMat.emissiveColor = new BABYLON.Color3(0, 0.8, 0.8);
        
        const createMarker = (mx, mz) => {
            // 원뿔형 기둥(Cylinder) 생성
            const marker = BABYLON.MeshBuilder.CreateCylinder("marker", { diameterTop: 0.1, diameterBottom: 0.2, height: 0.8 }, scene);
            marker.position = new BABYLON.Vector3(mx, 0.4, mz);
            marker.material = markerMat;
        };
        
        // 네 모서리에 마커 배치
        createMarker(parkingSpot.x - parkingSpot.w / 2, parkingSpot.z + parkingSpot.l / 2); // 앞좌측
        createMarker(parkingSpot.x + parkingSpot.w / 2, parkingSpot.z + parkingSpot.l / 2); // 앞우측
        createMarker(parkingSpot.x - parkingSpot.w / 2, parkingSpot.z - parkingSpot.l / 2); // 뒤좌측
        createMarker(parkingSpot.x + parkingSpot.w / 2, parkingSpot.z - parkingSpot.l / 2); // 뒤우측
    } else {
        // FREE 모드에서는 주차 구역을 멀리 배치하거나 없앰 (여기서는 시각적 확인용으로 아주 멀리 하나 둠)
        parkingSpot = { x: 9999, z: 9999, w: 0, l: 0 };
    }

    carPhysics.x = 0; carPhysics.z = 10; carPhysics.speed = 0; carPhysics.angle = Math.PI;
}

let wheelMeshes = [];
let frontWheelGroups = [];

/**
 * 차량 모델 생성 (고퀄리티 버전)
 */

function createCar() {
    const v = currentVehicle;
    carGroup = new BABYLON.TransformNode("carGroup", scene);

    // NEW: 플레이어 바운딩 박스
    playerBox = BABYLON.MeshBuilder.CreateBox("playerBox", { width: v.w, height: v.h, depth: v.l }, scene);
    playerBox.parent = carGroup;
    playerBox.position.y = v.h / 2;
    playerBox.visibility = 0; // 보이지 않지만 충돌 연산에는 포함됨

    // 모델 경로 매핑 (Kenney GLB format 디렉터리)
    let modelFile = "";
    switch (v.type) {
        case "sedan":
            modelFile = "kenney_car-kit/Models/GLB%20format/sedan.glb";
            break;
        case "sports":
            modelFile = "kenney_car-kit/Models/GLB%20format/race.glb";
            break;
        case "truck":
            modelFile = "kenney_car-kit/Models/GLB%20format/truck.glb";
            break;
        default:
            modelFile = "kenney_car-kit/Models/GLB%20format/sedan.glb";
    }

    console.log("Attempting to load model from:", modelFile);

    // Babylon.js 모델 로딩 방식 개선: 경로와 파일명 분리
    const lastSlash = modelFile.lastIndexOf('/');
    const rootUrl = modelFile.substring(0, lastSlash + 1);
    const fileName = modelFile.substring(lastSlash + 1);

    BABYLON.SceneLoader.ImportMeshAsync("", rootUrl, fileName, scene).then(result => {
        console.log("Model loaded successfully:", fileName);
        const root = result.meshes[0];
        root.parent = carGroup;
        root.scaling = new BABYLON.Vector3(2.25, 2.25, 2.25);
        root.position = new BABYLON.Vector3(0, 0, 0);
        
        wheelMeshes = [];
        frontWheelGroups = [];
        result.meshes.forEach(m => {
            // 모든 메쉬가 잘 보이도록 설정
            if (m.material) {
                m.material.backFaceCulling = false; // 양면 렌더링으로 부품 누락 방지
                if (m.material.albedoColor) {
                    m.material.albedoColor.scaleToRef(1.2, m.material.albedoColor);
                }
                m.material.usePhysicalLightFalloff = false;
            }

            if (m.name.toLowerCase().includes("wheel")) {
                wheelMeshes.push(m);
                if (m.name.toLowerCase().includes("front")) {
                    frontWheelGroups.push(m);
                }
            }
        });
    }).catch(err => {
        console.error("Failed to load vehicle model:", err);
        // 모델 로드 실패 시 시각적 구분을 위해 색상이 있는 박스 생성
        const body = BABYLON.MeshBuilder.CreateBox("fallback-body", { width: v.w, height: v.h * 0.4, depth: v.l }, scene);
        body.parent = carGroup;
        body.position.y = 0.5;
        const bodyMat = new BABYLON.StandardMaterial("bodyMat", scene);
        bodyMat.diffuseColor = new BABYLON.Color3(v.color.r, v.color.g, v.color.b);
        body.material = bodyMat;

        const cabin = BABYLON.MeshBuilder.CreateBox("fallback-cabin", { width: v.w * 0.8, height: v.h * 0.4, depth: v.l * 0.5 }, scene);
        cabin.parent = carGroup;
        cabin.position.y = 1.0;
        cabin.position.z = -0.2;
        const cabinMat = new BABYLON.StandardMaterial("cabinMat", scene);
        cabinMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        cabin.material = cabinMat;
    });

    // 카메라 설정 (ArcRotateCamera로 변경하여 360도 회전 지원)
    camera = new BABYLON.ArcRotateCamera("ArcCam", -Math.PI / 2, Math.PI / 3.5, 18, BABYLON.Vector3.Zero(), scene);
    camera.setTarget(carGroup);
    
    // 줌 제한
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 35;
    
    // 카메라 상하 회전 제한 (땅 밑으로 안 들어가게)
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) - 0.05;
    
    // 캔버스에 카메라 컨트롤 연결
    const canvas = document.getElementById('renderCanvas');
    camera.attachControl(canvas, true);
    
    // 카메라 드래그 상태 감지
    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                isCameraDragging = true;
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                isCameraDragging = false;
                break;
        }
    });

    scene.activeCamera = camera;
}

let steeringAngle = 0;
const maxSteering = 0.45;
let isSteeringActive = false;
let isCameraDragging = false;
let cameraIdleTime = 0;

/**
 * 물리 연산 프레임 업데이트
 */
function updatePhysics() {
    if(isGameOver) return;
    const v = currentVehicle;

    // 조향 핸들 로직
    if (!isSteeringActive) {
        if (!controls.left && !controls.right) {
            steeringAngle *= 0.85;
            if (Math.abs(steeringAngle) < 0.01) steeringAngle = 0;
        } else {
            if (controls.left) steeringAngle = Math.min(steeringAngle + 0.04, maxSteering);
            if (controls.right) steeringAngle = Math.max(steeringAngle - 0.04, -maxSteering);
        }
        
        const wheelUI = document.getElementById('steering-wheel');
        if (wheelUI) {
            const visualAngle = -(steeringAngle / maxSteering) * 120;
            wheelUI.style.transform = `rotate(${visualAngle}deg)`;
        }
    }

    // --- 자동차 바퀴 애니메이션 업데이트 ---
    // 모든 바퀴 회전 및 조향 업데이트
    wheelMeshes.forEach(m => {
        // 쿼터니언 대신 오일러 회전 사용을 위해 초기화 (Kenney 모델 특성 대응)
        m.rotationQuaternion = null;

        // 1. 구름 애니메이션 (X축): 모든 바퀴에 적용
        // 기존 회전값에 속도에 비례한 회전량을 더함
        m.rotation.x -= carPhysics.speed / 0.4;

        // 2. 조향 애니메이션 (Y축): 앞바퀴에만 적용
        if (m.name.toLowerCase().includes("front")) {
            m.rotation.y = -steeringAngle;
        }
    });

    // --- 현실적인 가감속 물리 (엔진 브레이크 적용) ---
    if (controls.gas) {
        const dir = (currentGear === 'D') ? 1 : -1;
        carPhysics.speed += v.accel * dir;
    } else {
        // [엔진 브레이크]: 액셀을 밟지 않을 때 실제 자동차처럼 서서히 속도가 줄어듬
        carPhysics.speed *= 0.97; 
        if (Math.abs(carPhysics.speed) < 0.005) carPhysics.speed = 0;
    }
    
    // 브레이크 페달 (강력 제동)
    if (controls.brake) {
        carPhysics.speed *= 0.82; 
        if (Math.abs(carPhysics.speed) < 0.01) carPhysics.speed = 0;
    }

    // 속도 제한 (후진 시 더 천천히)
    const speedLimit = currentGear === 'D' ? v.maxSpeed : v.maxSpeed * 0.5;
    if(carPhysics.speed > speedLimit) carPhysics.speed = speedLimit;
    if(carPhysics.speed < -speedLimit) carPhysics.speed = -speedLimit;

    // 조향 각도 적용
    const wheelbase = v.l * 0.75;
    if(Math.abs(carPhysics.speed) > 0.005) {
        carPhysics.angle -= (carPhysics.speed / wheelbase) * Math.tan(steeringAngle);
    }

    carPhysics.x -= Math.sin(carPhysics.angle) * carPhysics.speed;
    carPhysics.z -= Math.cos(carPhysics.angle) * carPhysics.speed;

    if (carGroup) {
        carGroup.position.set(carPhysics.x, 0, carPhysics.z);
        carGroup.rotation.y = carPhysics.angle;
    }

    if (currentDifficulty !== 'FREE') {
        checkCollisions();
        checkWinCondition();
    }
}

function createNPCs(difficulty) {
    npcCars = [];
    if (difficulty === 'FREE') return;
    
    // 난이도별 NPC 설정 (플레이어 주변, 주차 공간 위주의 순찰 경로)
    let npcConfigs = [];
    if (difficulty === 'EASY') {
        // EASY: 주차 공간(0, -30) 우측 및 앞쪽을 맴도는 사각형 궤도 (벽 x:-10, z:-10~-20 회피)
        npcConfigs.push({ x: 15, z: -15, speed: 0.1, path: [{x: 15, z: -15}, {x: 15, z: -45}, {x: -5, z: -45}, {x: -5, z: -15}], pathIdx: 0, color: {r: 1, g: 1, b: 0} });
    } else if (difficulty === 'MEDIUM') {
        // MEDIUM 1: 중앙 거대 벽(x:0, z:-15, w:40)을 완벽하게 빙글빙글 도는 궤도
        npcConfigs.push({ x: -25, z: -10, speed: 0.15, path: [{x: -25, z: -10}, {x: 25, z: -10}, {x: 25, z: -20}, {x: -25, z: -20}], pathIdx: 0, color: {r: 0, g: 1, b: 0} });
        // MEDIUM 2: 주차 공간(20, -30) 바로 앞(z:-25)에서 좌우로 진로를 방해
        npcConfigs.push({ x: 5, z: -25, speed: 0.12, path: [{x: 5, z: -25}, {x: 35, z: -25}], pathIdx: 0, color: {r: 1, g: 0.5, b: 0} });
    } else if (difficulty === 'DIFFICULT') {
        // DIFFICULT 1: 플레이어 시작 지점(0, 10) 바로 앞(z=5)을 가로지르며 긴장감 유발
        npcConfigs.push({ x: -35, z: 5, speed: 0.2, path: [{x: -35, z: 5}, {x: 35, z: 5}], pathIdx: 0, color: {r: 1, g: 0, b: 0} });
        // DIFFICULT 2: 우측의 좁은 틈새 통로(x=45)를 막아서며 위아래로 빠르게 순찰
        npcConfigs.push({ x: 45, z: 15, speed: 0.18, path: [{x: 45, z: 15}, {x: 45, z: -15}], pathIdx: 0, color: {r: 0.8, g: 0, b: 0.8} });
        // DIFFICULT 3: 주차 공간(40, -40) 앞쪽 공터를 넓게 맴돌며 주차를 방해
        npcConfigs.push({ x: 15, z: -25, speed: 0.25, path: [{x: 15, z: -25}, {x: 45, z: -25}, {x: 45, z: -35}, {x: 15, z: -35}], pathIdx: 0, color: {r: 0, g: 0, b: 1} });
    }

    const modelFile = "kenney_car-kit/Models/GLB%20format/suv.glb";
    const lastSlash = modelFile.lastIndexOf('/');
    const rootUrl = modelFile.substring(0, lastSlash + 1);
    const fileName = modelFile.substring(lastSlash + 1);

    npcConfigs.forEach((config, index) => {
        const npcNode = new BABYLON.TransformNode("npc_" + index, scene);
        npcNode.position = new BABYLON.Vector3(config.x, 0, config.z);
        
        // 투명 바운딩 박스
        const box = BABYLON.MeshBuilder.CreateBox("npcBox_" + index, { width: 2.2, height: 1.5, depth: 4.8 }, scene);
        box.parent = npcNode;
        box.position.y = 0.75;
        box.visibility = 0; // 게임 상에서는 보이지 않음
        
        BABYLON.SceneLoader.ImportMeshAsync("", rootUrl, fileName, scene).then(result => {
            const root = result.meshes[0];
            root.parent = npcNode;
            root.scaling = new BABYLON.Vector3(2.25, 2.25, 2.25);
            
            // 색상 변경
            result.meshes.forEach(m => {
                if (m.material && m.material.albedoColor) {
                    m.material = m.material.clone("npcMat_" + m.name);
                    m.material.backFaceCulling = false;
                    m.material.usePhysicalLightFalloff = false;
                    const r = m.material.albedoColor.r;
                    const g = m.material.albedoColor.g;
                    const b = m.material.albedoColor.b;
                    // 타이어나 유리가 아닌 부분(주로 밝은 색)의 색상을 변경
                    if (r > 0.3 || g > 0.3 || b > 0.3) {
                        m.material.albedoColor = new BABYLON.Color3(config.color.r, config.color.g, config.color.b);
                    }
                }
            });
        });
        
        npcCars.push({
            node: npcNode,
            box: box,
            config: config,
            angle: 0
        });
    });
}

function updateNPCs() {
    if (isGameOver) return;
    npcCars.forEach(npc => {
        const c = npc.config;
        const target = c.path[c.pathIdx];
        
        const dx = target.x - npc.node.position.x;
        const dz = target.z - npc.node.position.z;
        const dist = Math.hypot(dx, dz);
        
        if (dist < 0.5) {
            c.pathIdx = (c.pathIdx + 1) % c.path.length;
        } else {
            // 회전 보간
            let targetAngle = Math.atan2(dx, dz);
            let angleDiff = targetAngle - npc.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            npc.angle += angleDiff * 0.1;
            
            npc.node.rotation.y = npc.angle;
            
            // 이동
            npc.node.position.x += Math.sin(npc.angle) * c.speed;
            npc.node.position.z += Math.cos(npc.angle) * c.speed;
            
            // 바퀴 회전
            npc.node.getChildMeshes().forEach(m => {
                if (m.name.toLowerCase().includes("wheel")) {
                    m.rotation.x -= c.speed / 0.4;
                }
            });
        }
    });
}

/**
 * 충돌 감지
 */
function checkCollisions() {
    const corners = getCarCorners();
    for(let wall of walls) {
        for(let corner of corners) {
            if(corner.x > wall.x && corner.x < wall.x + wall.w &&
               corner.z > wall.z && corner.z < wall.z + wall.l) {
                gameOver(false, "CRASHED!");
                return;
            }
        }
    }
    
    // NPC 충돌 감지 (정밀한 바운딩 박스 검사)
    if (playerBox && carGroup) {
        carGroup.computeWorldMatrix(true);
        playerBox.computeWorldMatrix(true);
        for (let npc of npcCars) {
            if (npc.box && npc.node) {
                npc.node.computeWorldMatrix(true);
                npc.box.computeWorldMatrix(true);
                if (playerBox.intersectsMesh(npc.box, true)) {
                    gameOver(false, "CRASHED INTO A CAR!");
                    return;
                }
            }
        }
    }
}

function getCarCorners() {
    const cos = Math.cos(carPhysics.angle);
    const sin = Math.sin(carPhysics.angle);
    const w = currentVehicle.w / 2;
    const l = currentVehicle.l / 2;
    const offsets = [{dx:-w, dz:-l}, {dx:w, dz:-l}, {dx:w, dz:l}, {dx:-w, dz:l}];
    return offsets.map(p => ({
        x: carPhysics.x + (p.dx * cos + p.dz * sin),
        z: carPhysics.z + (-p.dx * sin + p.dz * cos)
    }));
}

function checkWinCondition() {
    const dist = Math.hypot(carPhysics.x - parkingSpot.x, carPhysics.z - parkingSpot.z);
    const angleMod = Math.abs(carPhysics.angle % Math.PI);
    const isAligned = angleMod < 0.2 || angleMod > (Math.PI - 0.2);
    if(dist < 1.5 && isAligned && Math.abs(carPhysics.speed) < 0.05) {
        gameOver(true, "PARKING SUCCESS!");
    }
}

/**
 * 게임 시작
 */
function startGame(difficulty) {
    window.location.hash = 'game-' + difficulty;
}

function launchGameUI(difficulty) {
    currentDifficulty = difficulty;
    isGameOver = false;
    
    const mainMenu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const overlay = document.getElementById('game-overlay');
    
    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');
    if (overlay) overlay.classList.add('hidden');
    
    initBabylon();
    buildMap(difficulty);
    createCar();
    createNPCs(difficulty);
    bindControls();
    
    timerValue = (difficulty === 'FREE') ? 0 : 45;
    const timerElem = document.getElementById('timer');
    const timerBox = document.getElementById('timer-box');
    if (timerBox) timerBox.style.display = (difficulty === 'FREE') ? 'none' : 'block';
    
    clearInterval(timerInterval);
    if (difficulty !== 'FREE') {
        timerInterval = setInterval(() => {
            timerValue--;
            if (timerElem) timerElem.innerText = timerValue;
            if(timerValue <= 0) gameOver(false, "TIME OVER!");
        }, 1000);
    } else {
        if (timerElem) timerElem.innerText = "--";
    }

    engine.runRenderLoop(() => {
        if(!isGameOver) {
            updatePhysics();
            updateNPCs();
            updateCamera();
            drawMinimap();
            scene.render();
        }
    });
}

function updateCamera() {
    if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) return;
    
    if (isCameraDragging) {
        cameraIdleTime = 0;
    } else {
        cameraIdleTime += engine.getDeltaTime();
        // 2초(2000ms) 이상 조작이 없을 때 카메라를 차량 뒤로 부드럽게 정렬
        if (cameraIdleTime > 2000) {
            let targetAlpha = -carPhysics.angle + Math.PI / 2;
            let diff = targetAlpha - camera.alpha;
            
            // 각도 차이 정규화 (-PI ~ PI)
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            
            camera.alpha += diff * 0.03;
            
            let targetBeta = Math.PI / 3.5;
            camera.beta += (targetBeta - camera.beta) * 0.03;
        }
    }
}

function gameOver(win, msgText) {
    isGameOver = true;
    clearInterval(timerInterval);
    const overlay = document.getElementById('game-overlay');
    const msg = document.getElementById('result-message');
    if (overlay) overlay.classList.remove('hidden');
    if (msg) {
        msg.textContent = msgText;
        msg.style.color = win ? "#0f0" : "#f00";
    }
}

function backToMenu() {
    if (window.history.length > 2) {
        window.history.go(-2);
    } else {
        window.location.hash = '';
    }
}

window.backToMenu = backToMenu;

window.backToVehicle = function() {
    window.history.back();
};

window.startGame = startGame;
window.setGear = setGear;

/**
 * 조작 바인딩
 */
function bindControls() {
    const gasBtn = document.getElementById('btn-gas');
    const brakeBtn = document.getElementById('btn-brake');
    const wheel = document.getElementById('steering-wheel');
    const wheelContainer = document.querySelector('.steering-wheel-container');
    
    const setControl = (key, val) => controls[key] = val;

    if (gasBtn) {
        gasBtn.onmousedown = gasBtn.ontouchstart = (e) => { e.preventDefault(); setControl('gas', true); };
        gasBtn.onmouseup = gasBtn.ontouchend = gasBtn.onmouseleave = () => setControl('gas', false);
    }
    
    if (brakeBtn) {
        brakeBtn.onmousedown = brakeBtn.ontouchstart = (e) => { e.preventDefault(); setControl('brake', true); };
        brakeBtn.onmouseup = brakeBtn.ontouchend = brakeBtn.onmouseleave = () => setControl('brake', false);
    }

    let startX = 0;
    let startWheelAngle = 0;
    let currentWheelAngle = 0;

    const startSteer = (e) => {
        e.preventDefault();
        isSteeringActive = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        startWheelAngle = currentWheelAngle;
        if (wheel) wheel.style.transition = 'none';
    };

    const moveSteer = (e) => {
        if (!isSteeringActive) return;
        const currentX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = currentX - startX;
        let angle = startWheelAngle + deltaX * 0.8;
        if (angle > 120) angle = 120;
        if (angle < -120) angle = -120;
        currentWheelAngle = angle;
        if (wheel) wheel.style.transform = `rotate(${angle}deg)`;
        steeringAngle = -(angle / 120) * maxSteering;
    };

    const endSteer = () => {
        isSteeringActive = false;
        if (wheel) {
            wheel.style.transition = 'transform 0.3s ease-out';
            wheel.style.transform = 'rotate(0deg)';
        }
        currentWheelAngle = 0;
    };

    if (wheelContainer) {
        wheelContainer.onmousedown = wheelContainer.ontouchstart = startSteer;
        window.onmousemove = window.ontouchmove = moveSteer;
        window.onmouseup = window.ontouchend = endSteer;
    }

    window.onkeydown = (e) => {
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 'arrowup') setControl('gas', true);
        if(key === 's' || key === 'arrowdown') setControl('brake', true);
        if(key === 'a' || key === 'arrowleft') setControl('left', true);
        if(key === 'd' || key === 'arrowright') setControl('right', true);
    };
    window.onkeyup = (e) => {
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 'arrowup') setControl('gas', false);
        if(key === 's' || key === 'arrowdown') setControl('brake', false);
        if(key === 'a' || key === 'arrowleft') setControl('left', false);
        if(key === 'd' || key === 'arrowright') setControl('right', false);
    };
}

/**
 * 미니맵 그리기 (내 위치 중심 동적 뷰)
 */
function drawMinimap() {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    ctx.save();
    ctx.translate(w/2, h/2);
    const zoom = 2.0; 
    
    ctx.fillStyle = 'rgba(150,150,150,0.6)';
    walls.forEach(wall => {
        const rx = (wall.x - carPhysics.x) * zoom;
        const rz = (wall.z - carPhysics.z) * zoom;
        const rw = wall.w * zoom;
        const rl = wall.l * zoom;
        ctx.fillRect(rx, rz, rw, rl);
    });

    if (parkingSpot) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        const px = (parkingSpot.x - parkingSpot.w/2 - carPhysics.x) * zoom;
        const pz = (parkingSpot.z - parkingSpot.l/2 - carPhysics.z) * zoom;
        ctx.fillRect(px, pz, parkingSpot.w * zoom, parkingSpot.l * zoom);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(-carPhysics.angle); 
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(3, 3);
    ctx.lineTo(-3, 3);
    ctx.fill();
    ctx.restore();
}
