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
  "objects": [
    { "type": "road-straight", "x": 0, "y": 0.01, "z": 8, "rotation": 1.5707963267948966 },
    { "type": "road-slant-high", "x": 0, "y": 0.01, "z": 0, "rotation": 1.5707963267948966 },
    { "type": "road-bridge", "x": 0, "y": 0.01, "z": -8, "rotation": 3.141592653589793 },
    { "type": "road-slant-flat-high", "x": 0, "y": 0.01, "z": -16, "rotation": 4.71238898038469 },
    { "type": "road-crossroad", "x": 0, "y": 0.01, "z": 24, "rotation": 0 },
    { "type": "road-bend-sidewalk", "x": -48, "y": 0.01, "z": 24, "rotation": 3.141592653589793 },
    { "type": "road-bend-sidewalk", "x": -48, "y": 0.01, "z": 0, "rotation": 7.853981633974483 },
    { "type": "road-bend", "x": -24, "y": 0.01, "z": 0, "rotation": 10.995574287564276 },
    { "type": "road-straight", "x": 2.7755575615628914e-17, "y": 0.009999999999999981, "z": 16.1, "rotation": 1.5707963267948966 },
    { "type": "road-slant-curve", "x": 40, "y": 0.01, "z": 11.899999999999986, "rotation": 20.420352248333657 },
    { "type": "road-bend-sidewalk", "x": 40, "y": 0.01, "z": 24, "rotation": 17.27875959474386 },
    { "type": "road-bend", "x": -24, "y": 0.01, "z": -40, "rotation": 14.137166941154069 },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": 32, "rotation": 1.5707963267948966 },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": -24, "rotation": 4.71238898038469 },
    { "type": "road-straight", "x": -8, "y": 0.01, "z": 24, "rotation": 0 },
    { "type": "road-straight", "x": -16, "y": 0.01, "z": 24, "rotation": 0 },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": 24, "rotation": 0 },
    { "type": "road-straight", "x": -40, "y": 0.01, "z": 24, "rotation": 0 },
    { "type": "road-straight", "x": -32, "y": 0.01, "z": 24, "rotation": 0 },
    { "type": "road-straight", "x": -48, "y": 0.01, "z": 16, "rotation": 4.71238898038469 },
    { "type": "road-straight", "x": -48, "y": 0.01, "z": 8, "rotation": 4.71238898038469 },
    { "type": "road-straight", "x": -40, "y": 0.01, "z": 0, "rotation": 9.42477796076938 },
    { "type": "road-straight", "x": -32, "y": 0.01, "z": 0, "rotation": 9.42477796076938 },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": -16, "rotation": 10.995574287564276 },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": -24, "rotation": 10.995574287564276 },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": -32, "rotation": 10.995574287564276 },
    { "type": "road-straight", "x": -16, "y": 0.01, "z": -40, "rotation": 15.707963267948966 },
    { "type": "road-straight", "x": -8, "y": 0.01, "z": -40, "rotation": 15.707963267948966 },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": -40, "rotation": 15.707963267948966 },
    { "type": "road-straight", "x": 8, "y": 0.01, "z": 24, "rotation": 15.707963267948966 },
    { "type": "road-straight", "x": 16, "y": 0.01, "z": 24, "rotation": 15.707963267948966 },
    { "type": "road-straight", "x": 24, "y": 0.01, "z": 24, "rotation": 15.707963267948966 },
    { "type": "road-straight", "x": 32, "y": 0.01, "z": 24, "rotation": 15.707963267948966 },
    { "type": "road-straight", "x": 40, "y": 4.0100000000000025, "z": 0, "rotation": 20.420352248333657 },
    { "type": "road-straight", "x": 40, "y": 4.0100000000000025, "z": -8, "rotation": 20.420352248333657 },
    { "type": "road-straight", "x": 40, "y": 4.0100000000000025, "z": -16, "rotation": 20.420352248333657 },
    { "type": "road-intersection", "x": -24, "y": 0.01, "z": -8, "rotation": 1.5707963267948966 },
    { "type": "road-straight", "x": -16, "y": 0.01, "z": -8, "rotation": 3.141592653589793 },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": -8, "rotation": 3.141592653589793 },
    { "type": "road-straight", "x": -8, "y": 0.01, "z": -8, "rotation": 3.141592653589793 },
    { "type": "road-straight", "x": 8, "y": 0.01, "z": -8, "rotation": 3.141592653589793 },
    { "type": "road-straight", "x": 16, "y": 0.01, "z": -8, "rotation": 3.141592653589793 },
    { "type": "road-slant-flat-high", "x": 40, "y": 0.01, "z": -24, "rotation": 10.995574287564276 },
    { "type": "road-bend-sidewalk", "x": 24, "y": 0.01, "z": -8, "rotation": 10.995574287564276 },
    { "type": "road-straight", "x": 24, "y": 0.01, "z": -16, "rotation": 10.995574287564276 },
    { "type": "road-straight", "x": 40, "y": 0.01, "z": -32, "rotation": 10.995574287564276 },
    { "type": "road-bend-sidewalk", "x": 40, "y": 0.01, "z": -40, "rotation": 31.415926535897945 },
    { "type": "road-straight", "x": 32, "y": 0.01, "z": -40, "rotation": 31.415926535897945 },
    { "type": "road-straight", "x": 8, "y": 0.01, "z": -40, "rotation": 31.415926535897945 },
    { "type": "road-straight", "x": 16, "y": 0.01, "z": -40, "rotation": 31.415926535897945 },
    { "type": "road-straight", "x": 24, "y": 0.01, "z": -40, "rotation": 31.415926535897945 },
    { "type": "road-end", "x": 24, "y": 0.01, "z": -24, "rotation": 36.12831551628264 },
    { "type": "road-end-barrier", "x": 24, "y": 0.01, "z": -24, "rotation": 36.12831551628264 },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": 32, "rotation": 36.12831551628264 },
    { "type": "road-straight-barrier", "x": -8, "y": 0.01, "z": 24, "rotation": 37.69911184307754 },
    { "type": "road-straight-barrier", "x": -16, "y": 0.01, "z": 24, "rotation": 37.69911184307754 },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": 24, "rotation": 37.69911184307754 },
    { "type": "road-straight-barrier", "x": -32, "y": 0.01, "z": 24, "rotation": 37.69911184307754 },
    { "type": "road-straight-barrier", "x": -40, "y": 0.01, "z": 24, "rotation": 37.69911184307754 },
    { "type": "road-straight-barrier", "x": -48, "y": 0.01, "z": 16, "rotation": 39.26990816987244 },
    { "type": "road-straight-barrier", "x": -48, "y": 0.01, "z": 8, "rotation": 39.26990816987244 },
    { "type": "road-straight-barrier", "x": -40, "y": 0.01, "z": 0, "rotation": 40.840704496667335 },
    { "type": "road-straight-barrier", "x": -32, "y": 0.01, "z": 0, "rotation": 40.840704496667335 },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": -16, "rotation": 42.411500823462234 },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": -24, "rotation": 42.411500823462234 },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": -32, "rotation": 42.411500823462234 },
    { "type": "road-straight-barrier", "x": -16, "y": 0.01, "z": -40, "rotation": 43.98229715025713 },
    { "type": "road-straight-barrier", "x": -8, "y": 0.01, "z": -40, "rotation": 43.98229715025713 },
    { "type": "road-straight-barrier", "x": -16, "y": 0.01, "z": -8, "rotation": 43.98229715025713 },
    { "type": "road-straight-barrier", "x": -8, "y": 0.01, "z": -8, "rotation": 43.98229715025713 },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": -8, "rotation": 43.98229715025713 },
    { "type": "road-straight-barrier", "x": 8, "y": 0.01, "z": -8, "rotation": 43.98229715025713 },
    { "type": "road-straight-barrier", "x": 16, "y": 0.01, "z": -8, "rotation": 43.98229715025713 },
    { "type": "road-straight-barrier", "x": 24, "y": 0.01, "z": -16, "rotation": 45.55309347705203 },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": 16, "rotation": 48.69468613064183 },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": 8, "rotation": 48.69468613064183 },
    { "type": "road-straight-barrier", "x": 8, "y": 0.01, "z": 24, "rotation": 50.265482457436725 },
    { "type": "road-straight-barrier", "x": 16, "y": 0.01, "z": 24, "rotation": 50.265482457436725 },
    { "type": "road-straight-barrier", "x": 24, "y": 0.01, "z": 24, "rotation": 50.265482457436725 },
    { "type": "road-straight-barrier", "x": 32, "y": 0.01, "z": 24, "rotation": 50.265482457436725 },
    { "type": "road-straight-barrier", "x": 40, "y": 0.01, "z": -32, "rotation": 51.836278784231624 },
    { "type": "road-straight-barrier", "x": 32, "y": 0.01, "z": -40, "rotation": 53.40707511102652 },
    { "type": "road-straight-barrier", "x": 24, "y": 0.01, "z": -40, "rotation": 53.40707511102652 },
    { "type": "road-straight-barrier", "x": 16, "y": 0.01, "z": -40, "rotation": 53.40707511102652 },
    { "type": "road-straight-barrier", "x": 8, "y": 0.01, "z": -40, "rotation": 53.40707511102652 },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": -40, "rotation": 53.40707511102652 },
    { "type": "road-straight-barrier", "x": 40, "y": 4.110000000000002, "z": -16, "rotation": 54.97787143782142 },
    { "type": "road-straight-barrier", "x": 40, "y": 4.110000000000002, "z": -8, "rotation": 54.97787143782142 },
    { "type": "road-straight-barrier", "x": 40, "y": 4.110000000000002, "z": 0, "rotation": 54.97787143782142 },
    { "type": "road-slant-curve-barrier", "x": 40, "y": 0.009999999999999995, "z": 12.000000000000014, "rotation": 58.11946409141122 },
    { "type": "road-bend-square-barrier", "x": 40, "y": 0.01, "z": 24, "rotation": 61.261056745001014 },
    { "type": "road-bend-square-barrier", "x": 40, "y": 0.01, "z": -40, "rotation": 62.83185307179591 },
    { "type": "road-bend-square-barrier", "x": 24, "y": 0.01, "z": -8, "rotation": 67.54424205218059 },
    { "type": "road-bend-square-barrier", "x": -48, "y": 0.01, "z": 24, "rotation": 72.25663103256527 },
    { "type": "road-bend-square-barrier", "x": -48, "y": 0.01, "z": 0, "rotation": 76.96902001294994 },
    { "type": "road-bend-barrier", "x": -24, "y": 0.01, "z": -40, "rotation": 83.2522053201295 },
    { "type": "road-bend-barrier", "x": -24, "y": 0.01, "z": 0, "rotation": 86.39379797371929 },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": -24, "rotation": 86.39379797371929 },
    { "type": "road-straight-barrier", "x": 0, "y": 4.210000000000002, "z": -8, "rotation": 86.39379797371929 },
    { "type": "road-intersection-barrier", "x": -24, "y": 0.01, "z": -8, "rotation": 89.53539062730907 },
    { "type": "road-slant-high-barrier", "x": 0, "y": 0.01, "z": -16, "rotation": 92.67698328089885 },
    { "type": "road-slant-high-barrier", "x": 0, "y": 0.01, "z": 0, "rotation": 95.81857593448863 },
    { "type": "road-slant-high-barrier", "x": 40, "y": 0.01, "z": -24, "rotation": 98.96016858807842 }
  ]
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
let barrierMeshes = []; // 배리어 충돌 감지용 메시 목록
let parkingSpot = { x: 0, z: 0, w: 2.25, l: 4.5 };
let roadMeshes = [];

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
    const activeMap = (customMapData && customMapData.difficulty === difficulty) ? customMapData : null;
    roadMeshes = [];
    barrierMeshes = []; // 초기화
    
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
        floorColor = new BABYLON.Color3(0.4, 0.4, 0.4);
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
    ambientLight.intensity = (difficulty === 'EASY') ? 1.0 : 0.6;

    dirLight = new BABYLON.DirectionalLight("DirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = (difficulty === 'EASY') ? 1.2 : 0.8;

    scene.imageProcessingConfiguration.exposure = 1.4;
    scene.imageProcessingConfiguration.contrast = 1.3;

    const floorSize = (difficulty === 'FREE') ? 1000 : 200;
    const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: floorSize, height: floorSize }, scene);
    const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
    floorMat.diffuseColor = floorColor;
    floorMat.specularColor = new BABYLON.Color3(0, 0, 0);
    floor.material = floorMat;
    floor.receiveShadows = true;
    roadMeshes.push(floor);

    walls = [];
    const addWall = (x, z, w, l) => {
        const wall = BABYLON.MeshBuilder.CreateBox("wall", { width: w, height: 2, depth: l }, scene);
        wall.position = new BABYLON.Vector3(x, 1, z);
        const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
        wallMat.diffuseColor = wallColor;
        wall.material = wallMat;
        walls.push({ x: x - w/2, z: z - l/2, w: w, l: l });
    };

    // 커스텀 도로 오브젝트 로드 (스케일 8.1 적용)
    if (activeMap && activeMap.objects) {
        activeMap.objects.forEach(obj => {
            BABYLON.SceneLoader.ImportMesh("", "roads/models/", obj.type + ".glb", scene, (meshes) => {
                const roadGroup = new BABYLON.Mesh("roadGroup", scene);
                meshes.forEach(m => {
                    m.parent = roadGroup;
                    if (m.material) m.material.backFaceCulling = false;
                    roadMeshes.push(m);
                    
                    // 'barrier'가 포함된 블록에서 실제 수직 구조물만 추출
                    if (obj.type.toLowerCase().includes("barrier")) {
                        const mName = m.name.toLowerCase();
                        // 바닥재(road, tile, floor, ground)를 제외한 것만 배리어로 인정
                        if (mName.includes("barrier") || mName.includes("wall") || mName.includes("railing") || mName.includes("rim") || mName.includes("post")) {
                            barrierMeshes.push(m);
                        }
                    }
                });
                roadGroup.position.set(obj.x, obj.y || 0.05, obj.z);
                roadGroup.rotation.y = obj.rotation;
                roadGroup.scaling = new BABYLON.Vector3(8.1, 8.1, 8.1); 
            });
        });
    }

    if (difficulty !== 'FREE') {
        if (activeMap) {
            parkingSpot = activeMap.parkingSpot;
            carPhysics.x = activeMap.startPos.x;
            carPhysics.z = activeMap.startPos.z;
            carPhysics.angle = activeMap.startPos.rotation;
        } else {
            addWall(0, -50, 100, 2);
            addWall(0, 50, 100, 2);
            addWall(-50, 0, 2, 100);
            addWall(50, 0, 2, 100);

            if (difficulty === 'EASY') {
                parkingSpot = { x: 0, z: -30, w: 2.25, l: 4.5 };
                addWall(-10, -10, 5, 20);
            } else if (difficulty === 'MEDIUM') {
                parkingSpot = { x: 20, z: -30, w: 2.0, l: 4.0 };
                addWall(0, -15, 40, 2);
            } else {
                parkingSpot = { x: 40, z: -40, w: 1.8, l: 4.0 };
                addWall(0, 0, 80, 2);
            }
            carPhysics.x = 0; carPhysics.z = 10; carPhysics.angle = Math.PI;
        }

        // 주차 구역 시각화
        const spot = BABYLON.MeshBuilder.CreateGround("spot", { width: parkingSpot.w, height: parkingSpot.l }, scene);
        spot.position = new BABYLON.Vector3(parkingSpot.x, 0.02, parkingSpot.z);
        const spotMat = new BABYLON.StandardMaterial("spotMat", scene);
        spotMat.diffuseColor = new BABYLON.Color3(0, 0.8, 0.5);
        spotMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0.2);
        spotMat.alpha = 0.25;
        spot.material = spotMat;

        const lineThickness = 0.1;
        const lineMat = new BABYLON.StandardMaterial("lineMat", scene);
        lineMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        lineMat.emissiveColor = new BABYLON.Color3(0.6, 0.6, 0.6);

        const leftLine = BABYLON.MeshBuilder.CreateBox("leftLine", { width: lineThickness, height: 0.05, depth: parkingSpot.l }, scene);
        leftLine.position = new BABYLON.Vector3(parkingSpot.x - parkingSpot.w / 2, 0.03, parkingSpot.z);
        leftLine.material = lineMat;
        
        const rightLine = BABYLON.MeshBuilder.CreateBox("rightLine", { width: lineThickness, height: 0.05, depth: parkingSpot.l }, scene);
        rightLine.position = new BABYLON.Vector3(parkingSpot.x + parkingSpot.w / 2, 0.03, parkingSpot.z);
        rightLine.material = lineMat;
        
        const backLine = BABYLON.MeshBuilder.CreateBox("backLine", { width: parkingSpot.w + lineThickness, height: 0.05, depth: lineThickness }, scene);
        backLine.position = new BABYLON.Vector3(parkingSpot.x, 0.03, parkingSpot.z - parkingSpot.l / 2);
        backLine.material = lineMat;

        const markerMat = new BABYLON.StandardMaterial("markerMat", scene);
        markerMat.diffuseColor = new BABYLON.Color3(0, 1, 1);
        markerMat.emissiveColor = new BABYLON.Color3(0, 0.8, 0.8);
        
        const createMarker = (mx, mz) => {
            const marker = BABYLON.MeshBuilder.CreateCylinder("marker", { diameterTop: 0.05, diameterBottom: 0.1, height: 0.4 }, scene);
            marker.position = new BABYLON.Vector3(mx, 0.2, mz);
            marker.material = markerMat;
        };
        
        createMarker(parkingSpot.x - parkingSpot.w / 2, parkingSpot.z + parkingSpot.l / 2);
        createMarker(parkingSpot.x + parkingSpot.w / 2, parkingSpot.z + parkingSpot.l / 2);
        createMarker(parkingSpot.x - parkingSpot.w / 2, parkingSpot.z - parkingSpot.l / 2);
        createMarker(parkingSpot.x + parkingSpot.w / 2, parkingSpot.z - parkingSpot.l / 2);
    } else {
        parkingSpot = { x: 9999, z: 9999, w: 0, l: 0 };
        carPhysics.x = 0; carPhysics.z = 10; carPhysics.angle = Math.PI;
    }
}

let wheelMeshes = [];
let frontWheelGroups = [];

/**
 * 차량 모델 생성
 */
function createCar() {
    const v = currentVehicle;
    carGroup = new BABYLON.TransformNode("carGroup", scene);

    let modelFile = "";
    switch (v.type) {
        case "sedan": modelFile = "kenney_car-kit/Models/GLB%20format/sedan.glb"; break;
        case "sports": modelFile = "kenney_car-kit/Models/GLB%20format/race.glb"; break;
        case "truck": modelFile = "kenney_car-kit/Models/GLB%20format/truck.glb"; break;
        default: modelFile = "kenney_car-kit/Models/GLB%20format/sedan.glb";
    }

    const lastSlash = modelFile.lastIndexOf('/');
    const rootUrl = modelFile.substring(0, lastSlash + 1);
    const fileName = modelFile.substring(lastSlash + 1);

    BABYLON.SceneLoader.ImportMeshAsync("", rootUrl, fileName, scene).then(result => {
        const root = result.meshes[0];
        root.parent = carGroup;
        root.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
        root.position = new BABYLON.Vector3(0, 0, 0);
        
        wheelMeshes = [];
        frontWheelGroups = [];
        result.meshes.forEach(m => {
            if (m.material) {
                m.material.backFaceCulling = false;
                m.material.usePhysicalLightFalloff = false;
            }
            if (m.name.toLowerCase().includes("wheel")) {
                wheelMeshes.push(m);
                if (m.name.toLowerCase().includes("front")) frontWheelGroups.push(m);
            }
        });
    });

    camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -15), scene);
    camera.radius = 8; 
    camera.heightOffset = 3.5;
    camera.rotationOffset = 0;
    camera.cameraAcceleration = 0.05;
    camera.maxCameraSpeed = 20;
    camera.lockedTarget = carGroup;
    scene.activeCamera = camera;
}

let steeringAngle = 0;
const maxSteering = 0.45;
let isSteeringActive = false;

/**
 * 물리 연산
 */
function updatePhysics() {
    if(isGameOver) return;
    const v = currentVehicle;

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
        if (Math.abs(carPhysics.speed) < 0.005) carPhysics.speed = 0;
    }
    
    if (controls.brake) {
        carPhysics.speed *= 0.82; 
        if (Math.abs(carPhysics.speed) < 0.01) carPhysics.speed = 0;
    }

    const speedLimit = currentGear === 'D' ? v.maxSpeed : v.maxSpeed * 0.5;
    if(carPhysics.speed > speedLimit) carPhysics.speed = speedLimit;
    if(carPhysics.speed < -speedLimit) carPhysics.speed = -speedLimit;

    const wheelbase = v.l * 0.75;
    
    // 이전 위치 저장
    const oldX = carPhysics.x;
    const oldZ = carPhysics.z;
    const oldAngle = carPhysics.angle;

    if(Math.abs(carPhysics.speed) > 0.005) {
        carPhysics.angle -= (carPhysics.speed / wheelbase) * Math.tan(steeringAngle);
    }

    carPhysics.x -= Math.sin(carPhysics.angle) * carPhysics.speed;
    carPhysics.z -= Math.cos(carPhysics.angle) * carPhysics.speed;

    // 충돌 체크 (이동 차단 방식)
    if (isCollidingWithBarrier()) {
        // 충돌 발생 시 위치 되돌리기 및 속도 감속 (튕겨나감)
        carPhysics.x = oldX;
        carPhysics.z = oldZ;
        carPhysics.angle = oldAngle;
        carPhysics.speed *= -0.5; 
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

        const targetY = (targetHF + targetHR) / 2;
        carPhysics.y += (targetY - carPhysics.y) * 0.2;
        
        const pitch = Math.atan2(targetHF - targetHR, v.l * 0.8);

        if (carGroup) {
            carGroup.position.set(carPhysics.x, carPhysics.y, carPhysics.z);
            carGroup.rotation.y = carPhysics.angle;
            carGroup.rotation.x = pitch;
        }
    } else {
        if (carGroup) {
            carGroup.position.set(carPhysics.x, carPhysics.y, carPhysics.z);
            carGroup.rotation.y = carPhysics.angle;
            carGroup.rotation.x = 0;
        }
    }

    if (currentDifficulty !== 'FREE') {
        // 배리어 충돌로 인한 게임 오버는 제거, 주차 성공만 체크
        checkWinCondition();
    }
}

/**
 * 배리어 충돌 여부 확인 (이동 차단용)
 */
function isCollidingWithBarrier() {
    const corners = getCarCorners();
    
    // 1. 배리어 블록 영역 체크
    for (let b of barrierObjects) {
        const dist = Math.hypot(carPhysics.x - b.x, carPhysics.z - b.z);
        if (dist < 6) {
            const cos = Math.cos(-b.rotation);
            const sin = Math.sin(-b.rotation);
            for (let c of corners) {
                const dx = c.x - b.x;
                const dz = c.z - b.z;
                const lx = dx * cos + dz * sin;
                const lz = -dx * sin + dz * cos;
                const margin = 3.65; 
                if (Math.abs(lx) > margin || Math.abs(lz) > margin) return true;
            }
        }
    }

    // 2. 외부 경계벽 체크
    for(let wall of walls) {
        if(corners.some(c => c.x > wall.x && c.x < wall.x + wall.w && c.z > wall.z && c.z < wall.z + wall.l)) return true;
    }

    return false;
}

function checkCollisions() {
    // 이제 물리 벽 시스템으로 대체되어 비워둡니다.
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
    if(dist < 1.0 && isAligned && Math.abs(carPhysics.speed) < 0.05) {
        gameOver(true, "PARKING SUCCESS!");
    }
}

function startGame(difficulty) {
    currentDifficulty = difficulty;
    isGameOver = false;
    gameStartTime = Date.now(); 
    const mainMenu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const overlay = document.getElementById('game-overlay');
    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');
    if (overlay) overlay.classList.add('hidden');
    initBabylon();
    buildMap(difficulty);
    createCar();
    bindControls();
    setTimeout(() => { setupMobileCamera(); }, 500);
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
    }
    engine.runRenderLoop(() => {
        if(!isGameOver) {
            updatePhysics();
            drawMinimap();
            scene.render();
        }
    });
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
    if (engine) engine.stopRenderLoop();
    document.getElementById('game-screen').classList.add('hidden');
    const menu = document.getElementById('main-menu');
    if (menu) menu.classList.remove('hidden');
    const vSel = document.getElementById('vehicle-selection');
    const dSel = document.getElementById('difficulty-selection');
    if (dSel) { dSel.style.opacity = '0'; dSel.classList.add('hidden'); }
    if (vSel) { vSel.classList.remove('hidden'); void vSel.offsetWidth; vSel.style.opacity = '1'; }
}

window.backToMenu = backToMenu;
window.backToVehicle = () => {
    const vSel = document.getElementById('vehicle-selection');
    const dSel = document.getElementById('difficulty-selection');
    if (dSel) {
        dSel.style.opacity = '0';
        setTimeout(() => {
            dSel.classList.add('hidden');
            if (vSel) { vSel.classList.remove('hidden'); void vSel.offsetWidth; vSel.style.opacity = '1'; }
        }, 300);
    }
};

window.startGame = startGame;
window.setGear = setGear;

function openEditor() {
    const editorWin = window.open('editor.html', '_blank');
    if (editorWin) {
        setTimeout(() => {
            editorWin.postMessage({ type: "LOAD_MAP", map: customMapData }, "*");
        }, 1500);
    }
}
window.openEditor = openEditor;

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
    let startX = 0, startWheelAngle = 0, currentWheelAngle = 0;
    const startSteer = (e) => { e.preventDefault(); isSteeringActive = true; startX = e.touches ? e.touches[0].clientX : e.clientX; startWheelAngle = currentWheelAngle; if (wheel) wheel.style.transition = 'none'; };
    const moveSteer = (e) => { if (!isSteeringActive) return; const currentX = e.touches ? e.touches[0].clientX : e.clientX; const deltaX = currentX - startX; let angle = startWheelAngle + deltaX * 0.8; if (angle > 120) angle = 120; if (angle < -120) angle = -120; currentWheelAngle = angle; if (wheel) wheel.style.transform = `rotate(${angle}deg)`; steeringAngle = -(angle / 120) * maxSteering; };
    const endSteer = () => { isSteeringActive = false; if (wheel) { wheel.style.transition = 'transform 0.3s ease-out'; wheel.style.transform = 'rotate(0deg)'; } currentWheelAngle = 0; };
    if (wheelContainer) { wheelContainer.onmousedown = wheelContainer.ontouchstart = startSteer; window.onmousemove = window.ontouchmove = moveSteer; window.onmouseup = window.ontouchend = endSteer; }
    window.onkeydown = (e) => { const key = e.key.toLowerCase(); if(key === 'w' || key === 'arrowup') setControl('gas', true); if(key === 's' || key === 'arrowdown') setControl('brake', true); if(key === 'a' || key === 'arrowleft') setControl('left', true); if(key === 'd' || key === 'arrowright') setControl('right', true); };
    window.onkeyup = (e) => { const key = e.key.toLowerCase(); if(key === 'w' || key === 'arrowup') setControl('gas', false); if(key === 's' || key === 'arrowdown') setControl('brake', false); if(key === 'a' || key === 'arrowleft') setControl('left', false); if(key === 'd' || key === 'arrowright') setControl('right', false); };
}

function drawMinimap() {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.translate(w/2, h/2);
    const zoom = 1.0; 
    ctx.fillStyle = 'rgba(150,150,150,0.6)';
    walls.forEach(wall => {
        ctx.fillRect((wall.x - carPhysics.x) * zoom, (wall.z - carPhysics.z) * zoom, wall.w * zoom, wall.l * zoom);
    });
    if (parkingSpot) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillRect((parkingSpot.x - parkingSpot.w/2 - carPhysics.x) * zoom, (parkingSpot.z - parkingSpot.l/2 - carPhysics.z) * zoom, parkingSpot.w * zoom, parkingSpot.l * zoom);
    }
    ctx.restore();
    ctx.save(); ctx.translate(w/2, h/2); ctx.rotate(-carPhysics.angle); ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.fill(); ctx.restore();
}
