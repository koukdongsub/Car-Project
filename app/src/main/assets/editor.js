const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
let scene, camera, ground, ghostObject;
let selectedRoadType = null; 
let currentRotation = 0;
let placedObjects = [];
let currentDifficulty = null;
let isDeleteMode = false;
let isEditMode = false;
let selectedObjects = []; // 다중 선택을 위해 배열로 변경
let adjustInterval = null;

let startPointMesh, endPointMesh;
let startPos = { x: 0, z: 10, rotation: Math.PI };
let endPos = { x: 0, z: -30 };

const keys = { w: false, a: false, s: false, d: false };

// [핵심] 도로 간격을 없애기 위해 스케일을 8.1로 조정 (1x1 에셋을 8단위 그리드에 딱 맞게)
const BASE_SCALE = 8.1;  
const SNAP_UNIT = 8;     

const MAP_THEMES = {
    EASY: {
        floorColor: new BABYLON.Color3(0.2, 0.35, 0.1),
        parkingSpot: { x: 0, z: -35, w: 2.25, l: 4.5 },
        walls: [
            {x: 0, z: -55, w: 110, l: 2}, {x: 0, z: 55, w: 110, l: 2},
            {x: -55, z: 0, w: 2, l: 110}, {x: 55, z: 0, w: 2, l: 110},
            {x: -15, z: -10, w: 6, l: 25}, {x: 15, z: -10, w: 6, l: 25}
        ]
    },
    MEDIUM: {
        floorColor: new BABYLON.Color3(0.2, 0.22, 0.25),
        parkingSpot: { x: 25, z: -25, w: 1.75, l: 3.5 },
        walls: [
            {x: 0, z: -45, w: 90, l: 2}, {x: 0, z: 45, w: 90, l: 2},
            {x: -45, z: 0, w: 2, l: 90}, {x: 45, z: 0, w: 2, l: 90},
            {x: -15, z: -15, w: 3, l: 3}, {x: 15, z: -15, w: 3, l: 3},
            {x: -15, z: 15, w: 3, l: 3}, {x: 15, z: 15, w: 3, l: 3},
            {x: 25, z: -10, w: 1, l: 15}
        ]
    },
    DIFFICULT: {
        floorColor: new BABYLON.Color3(0.15, 0.15, 0.15),
        parkingSpot: { x: 40, z: -40, w: 1.6, l: 3.25 },
        walls: [
            {x: 0, z: -60, w: 120, l: 2}, {x: 0, z: 60, w: 120, l: 2},
            {x: -60, z: 0, w: 2, l: 120}, {x: 60, z: 0, w: 2, l: 120},
            {x: 0, z: 0, w: 80, l: 5}, {x: -20, z: -30, w: 5, l: 40},
            {x: 20, z: 30, w: 5, l: 40}, {x: 40, z: -15, w: 15, l: 5}
        ]
    }
};

const roadGroups = [
    { label: "직선", items: [
        "road-straight", "road-straight-half", "road-straight-barrier", "road-straight-barrier-half", "road-straight-barrier-end"
    ]},
    { label: "곡선 / 커브", items: [
        "road-bend", "road-bend-barrier", "road-bend-sidewalk", "road-bend-square", "road-bend-square-barrier",
        "road-curve", "road-curve-barrier", "road-curve-intersection", "road-curve-intersection-barrier", "road-curve-pavement"
    ]},
    { label: "교차로", items: [
        "road-intersection", "road-intersection-barrier", "road-intersection-line", "road-intersection-path",
        "road-crossroad", "road-crossroad-barrier", "road-crossroad-line", "road-crossroad-path"
    ]},
    { label: "분기 / 측면", items: [
        "road-split", "road-split-barrier",
        "road-side", "road-side-barrier", "road-side-entry", "road-side-entry-barrier", "road-side-exit", "road-side-exit-barrier"
    ]},
    { label: "라운드어바웃", items: [
        "road-roundabout", "road-roundabout-barrier"
    ]},
    { label: "경사 / 브리지", items: [
        "road-bridge", "bridge-pillar", "bridge-pillar-wide",
        "road-slant", "road-slant-barrier", "road-slant-high", "road-slant-high-barrier",
        "road-slant-flat", "road-slant-flat-high", "road-slant-curve", "road-slant-curve-barrier", "road-slant-flat-curve"
    ]},
    { label: "도로 끝", items: [
        "road-end", "road-end-barrier", "road-end-round", "road-end-round-barrier"
    ]},
    { label: "기타 도로", items: [
        "road-crossing", "road-driveway-single", "road-driveway-single-barrier",
        "road-driveway-double", "road-driveway-double-barrier", "road-square", "road-square-barrier",
        "road-square-pro"
    ]},
    { label: "공사 / 장애물", items: [
        "construction-barrier", "construction-cone", "construction-light"
    ]},
    { label: "가로등", items: [
        "light-curved", "light-curved-double", "light-curved-cross",
        "light-square", "light-square-double", "light-square-cross"
    ]},
    { label: "표지판", items: [
        "sign-highway", "sign-highway-wide", "sign-highway-detailed"
    ]},
    { label: "타일", items: [
        "tile-high", "tile-low", "tile-slant", "tile-slantHigh"
    ]},
];

const SQ_BORDER_W = 0.81;
const SQ_BORDER_H = 0.15;

const createProceduralSquareMesh = (alpha = 1) => {
    const root = new BABYLON.Mesh("placed", scene);
    const half = SNAP_UNIT / 2;
    const bOff = half - SQ_BORDER_W / 2;
    const bY = 0.1 + SQ_BORDER_H / 2;

    // 외곽 도로면 (UV 0.031 → RGB 81,85,102)
    const floorOuterMat = new BABYLON.StandardMaterial("sq-floor-outer-mat", scene);
    floorOuterMat.diffuseColor = new BABYLON.Color3(0.318, 0.333, 0.400);
    if (alpha < 1) floorOuterMat.alpha = alpha;

    // 중심 도로면 (UV 0.156 → RGB 102,107,128)
    const floorInnerMat = new BABYLON.StandardMaterial("sq-floor-inner-mat", scene);
    floorInnerMat.diffuseColor = new BABYLON.Color3(0.400, 0.420, 0.502);
    if (alpha < 1) floorInnerMat.alpha = alpha;

    // 연석 (UV 0.969 → RGB 220,220,233)
    const borderMat = new BABYLON.StandardMaterial("sq-border-mat", scene);
    borderMat.diffuseColor = new BABYLON.Color3(0.863, 0.863, 0.914);
    if (alpha < 1) borderMat.alpha = alpha;

    // 외곽 도로면: 연석 안쪽 전체 (±3.24 → 6.48단위)
    const outerRoadSize = (SNAP_UNIT / 2 - SQ_BORDER_W) * 2;
    const floor = BABYLON.MeshBuilder.CreateBox("sq-floor", { width: SNAP_UNIT, height: 0.1, depth: SNAP_UNIT }, scene);
    floor.parent = root;
    floor.position.y = 0.05;
    floor.material = floorOuterMat;

    const innerSize = (SNAP_UNIT / 2 - SQ_BORDER_W) * 2 * 0.75;
    const ext      = SNAP_UNIT / 2 - innerSize / 2;
    const cOff     = innerSize / 2 + ext / 2;
    const curbOff  = ext / 2 - SQ_BORDER_W / 2;

    // 중심 도로면 (항상 표시)
    const floorInner = BABYLON.MeshBuilder.CreateBox("sq-floor-inner", { width: innerSize, height: 0.11, depth: innerSize }, scene);
    floorInner.parent = root;
    floorInner.position.y = 0.055;
    floorInner.material = floorInnerMat;
    floorInner.isPickable = false;

    // 4방향 연장 조각: 인접 타일 방향으로 개별 활성화
    const innerExts = {};
    [
        { key: 'N', w: innerSize, d: ext, x: 0,     z: -cOff },
        { key: 'S', w: innerSize, d: ext, x: 0,     z:  cOff },
        { key: 'E', w: ext, d: innerSize, x:  cOff, z: 0     },
        { key: 'W', w: ext, d: innerSize, x: -cOff, z: 0     },
    ].forEach(({ key, w, d, x, z }) => {
        const s = BABYLON.MeshBuilder.CreateBox("sq-iext-" + key, { width: w, height: 0.11, depth: d }, scene);
        s.parent = root;
        s.position.set(x, 0.055, z);
        s.material = floorInnerMat;
        s.isPickable = false;
        s.setEnabled(false);
        innerExts[key] = s;
    });

    // 대각선 코너 조각: 대각선 타일이 있을 때만 활성화 (없으면 outer dark floor로 자연히 채워짐)
    const innerCornerExts = {};
    [
        { key: 'NE', x:  cOff, z: -cOff },
        { key: 'NW', x: -cOff, z: -cOff },
        { key: 'SE', x:  cOff, z:  cOff },
        { key: 'SW', x: -cOff, z:  cOff },
    ].forEach(({ key, x, z }) => {
        const c = BABYLON.MeshBuilder.CreateBox("sq-icx-" + key, { width: ext, height: 0.11, depth: ext }, scene);
        c.parent = root;
        c.position.set(x, 0.055, z);
        c.material = floorInnerMat;
        c.isPickable = false;
        c.setEnabled(false);
        innerCornerExts[key] = c;
    });

    const borders = {};
    [
        { key: 'N', w: SNAP_UNIT,    d: SQ_BORDER_W, pos: new BABYLON.Vector3(0,     bY, -bOff) },
        { key: 'S', w: SNAP_UNIT,    d: SQ_BORDER_W, pos: new BABYLON.Vector3(0,     bY,  bOff) },
        { key: 'E', w: SQ_BORDER_W,  d: SNAP_UNIT,   pos: new BABYLON.Vector3( bOff, bY,  0)    },
        { key: 'W', w: SQ_BORDER_W,  d: SNAP_UNIT,   pos: new BABYLON.Vector3(-bOff, bY,  0)    },
    ].forEach(({ key, w, d, pos }) => {
        const b = BABYLON.MeshBuilder.CreateBox("sq-border", { width: w, height: SQ_BORDER_H, depth: d }, scene);
        b.parent = root;
        b.position = pos;
        b.material = borderMat;
        b.isPickable = false;
        borders[key] = b;
    });

    // ㄱ자 내측 코너: 연석 조각만 (dark floor는 outer floor로 자연히 처리, 겹침 없음)
    const corners = {};
    [
        { key: 'NE', cx:  cOff, cz: -cOff, nsZ: -curbOff, ewX:  curbOff },
        { key: 'NW', cx: -cOff, cz: -cOff, nsZ: -curbOff, ewX: -curbOff },
        { key: 'SE', cx:  cOff, cz:  cOff, nsZ:  curbOff, ewX:  curbOff },
        { key: 'SW', cx: -cOff, cz:  cOff, nsZ:  curbOff, ewX: -curbOff },
    ].forEach(({ key, cx, cz, nsZ, ewX }) => {
        const cg = new BABYLON.Mesh("sq-corner-" + key, scene);
        cg.parent = root;
        cg.position.set(cx, 0, cz);

        const curb = BABYLON.MeshBuilder.CreateBox("cc", { width: SQ_BORDER_W, height: SQ_BORDER_H, depth: SQ_BORDER_W }, scene);
        curb.parent = cg;
        curb.position.set(ewX, bY, nsZ);
        curb.material = borderMat;
        curb.isPickable = false;

        cg.setEnabled(false);
        corners[key] = cg;
    });

    return { root, borders, innerExts, innerCornerExts, corners };
};

const updateSquareBorders = () => {
    const sqTiles = placedObjects.filter(o => o.isSqTile);
    sqTiles.forEach(t => Object.values(t.borders).forEach(b => b.setEnabled(true)));
    sqTiles.forEach(tile => {
        const { x, z } = tile;
        const find = (tx, tz) => sqTiles.find(o => Math.abs(o.x - tx) < 1 && Math.abs(o.z - tz) < 1);
        const hasN = !!find(x,             z - SNAP_UNIT);
        const hasS = !!find(x,             z + SNAP_UNIT);
        const hasE = !!find(x + SNAP_UNIT, z            );
        const hasW = !!find(x - SNAP_UNIT, z            );

        if (hasN) tile.borders.N.setEnabled(false);
        if (hasS) tile.borders.S.setEnabled(false);
        if (hasE) tile.borders.E.setEnabled(false);
        if (hasW) tile.borders.W.setEnabled(false);

        if (tile.innerExts) {
            tile.innerExts.N.setEnabled(hasN);
            tile.innerExts.S.setEnabled(hasS);
            tile.innerExts.E.setEnabled(hasE);
            tile.innerExts.W.setEnabled(hasW);
        }

        if (tile.innerCornerExts || tile.corners) {
            const hasNE = !!find(x + SNAP_UNIT, z - SNAP_UNIT);
            const hasNW = !!find(x - SNAP_UNIT, z - SNAP_UNIT);
            const hasSE = !!find(x + SNAP_UNIT, z + SNAP_UNIT);
            const hasSW = !!find(x - SNAP_UNIT, z + SNAP_UNIT);
            if (tile.innerCornerExts) {
                tile.innerCornerExts.NE.setEnabled(hasN && hasE &&  hasNE);
                tile.innerCornerExts.NW.setEnabled(hasN && hasW &&  hasNW);
                tile.innerCornerExts.SE.setEnabled(hasS && hasE &&  hasSE);
                tile.innerCornerExts.SW.setEnabled(hasS && hasW &&  hasSW);
            }
            if (tile.corners) {
                tile.corners.NE.setEnabled(hasN && hasE && !hasNE);
                tile.corners.NW.setEnabled(hasN && hasW && !hasNW);
                tile.corners.SE.setEnabled(hasS && hasE && !hasSE);
                tile.corners.SW.setEnabled(hasS && hasW && !hasSW);
            }
        }
    });
};

window.selectDifficulty = (diff) => {
    currentDifficulty = diff;
    document.getElementById("difficulty-modal").style.display = "none";
    initEditor(diff);
};

window.toggleEditMode = () => {
    isEditMode = !isEditMode;
    isDeleteMode = false;
    selectedRoadType = null;
    document.querySelectorAll(".road-item").forEach(i => i.classList.remove("selected"));
    
    const btn = document.getElementById("btn-edit");
    const dBtn = document.getElementById("btn-delete");
    dBtn.classList.remove("active");
    dBtn.innerText = "🗑️ 삭제 모드 OFF";

    if (isEditMode) {
        btn.classList.add("active");
        btn.style.background = "#f0f";
        btn.style.color = "white";
        btn.innerText = "✏️ 편집 모드 ON (블록 클릭)";
        if (ghostObject) ghostObject.setEnabled(false);
    } else {
        btn.classList.remove("active");
        btn.style.background = "#0ff";
        btn.style.color = "black";
        btn.innerText = "✏️ 편집 모드 OFF";
        deselectAllObjects();
    }
};

window.deselectAllObjects = () => {
    selectedObjects.forEach(obj => {
        if (obj.mesh) {
            obj.mesh.showBoundingBox = false;
            obj.mesh.renderOutline = false;
            obj.mesh.getChildMeshes().forEach(m => m.renderOutline = false);
        }
    });
    selectedObjects = [];
    document.getElementById("transform-panel").style.display = "none";
};

window.deselectObject = () => deselectAllObjects();

const highlightObject = (mesh, isSelected) => {
    if (!mesh) return;
    mesh.renderOutline = isSelected;
    mesh.outlineColor = new BABYLON.Color3(1, 0, 1); // 보라색 외곽선
    mesh.outlineWidth = 0.2;
    mesh.showBoundingBox = isSelected;
    
    mesh.getChildMeshes().forEach(m => {
        m.renderOutline = isSelected;
        m.outlineColor = new BABYLON.Color3(1, 0, 1);
        m.outlineWidth = 0.2;
    });
};

window.startAdjust = (type, delta) => {
    if (selectedObjects.length === 0) return;
    
    const doAdjust = () => {
        selectedObjects.forEach(obj => {
            const mesh = obj.mesh;
            if (type === 'x') { obj.x += delta; mesh.position.x = obj.x; }
            if (type === 'y') { obj.y += delta; mesh.position.y = obj.y; }
            if (type === 'z') { obj.z += delta; mesh.position.z = obj.z; }
            if (type === 'rot') { obj.rotation += delta; mesh.rotation.y = obj.rotation; }
            updateVisualWalls(obj);
        });
    };

    doAdjust(); 
    adjustInterval = setInterval(doAdjust, 50); 
};

window.stopAdjust = () => {
    if (adjustInterval) {
        clearInterval(adjustInterval);
        adjustInterval = null;
    }
};

// 투명벽 설정 업데이트 함수
window.updateWallSettings = () => {
    if (selectedObjects.length === 0) return;
    
    const f = document.getElementById('wall-f').checked;
    const b = document.getElementById('wall-b').checked;
    const l = document.getElementById('wall-l').checked;
    const r = document.getElementById('wall-r').checked;
    
    selectedObjects.forEach(obj => {
        obj.walls = [f, b, l, r];
        updateVisualWalls(obj);
    });
};

// 에디터 내에서 투명벽 시각화 (빨간 선 메시)
const updateVisualWalls = (obj) => {
    if (!obj.visualWalls) obj.visualWalls = [];
    obj.visualWalls.forEach(w => w.dispose());
    obj.visualWalls = [];

    if (!obj.walls) return;

    const size = 4; // 8단위 블록의 절반
    const wallColor = new BABYLON.Color3(1, 0, 0);
    const wallHeight = 2;

    // F(0), B(1), L(2), R(3)
    const configs = [
        { name: "F", pos: new BABYLON.Vector3(0, wallHeight/2, size), rot: 0, scale: new BABYLON.Vector3(8, wallHeight, 0.1) },
        { name: "B", pos: new BABYLON.Vector3(0, wallHeight/2, -size), rot: 0, scale: new BABYLON.Vector3(8, wallHeight, 0.1) },
        { name: "L", pos: new BABYLON.Vector3(-size, wallHeight/2, 0), rot: Math.PI/2, scale: new BABYLON.Vector3(8, wallHeight, 0.1) },
        { name: "R", pos: new BABYLON.Vector3(size, wallHeight/2, 0), rot: Math.PI/2, scale: new BABYLON.Vector3(8, wallHeight, 0.1) }
    ];

    obj.walls.forEach((enabled, i) => {
        if (enabled) {
            const wall = BABYLON.MeshBuilder.CreateBox("v-wall", { width: 1, height: 1, depth: 1 }, scene);
            wall.parent = obj.mesh;
            wall.position = configs[i].pos;
            wall.rotation.y = configs[i].rot;
            wall.scaling = configs[i].scale;
            const mat = new BABYLON.StandardMaterial("v-wall-mat", scene);
            mat.diffuseColor = wallColor;
            mat.alpha = 0.5;
            wall.material = mat;
            wall.isPickable = false;
            obj.visualWalls.push(wall);
        }
    });
};

window.toggleDeleteMode = () => {
    isDeleteMode = !isDeleteMode;
    isEditMode = false;
    const btn = document.getElementById("btn-delete");
    const eBtn = document.getElementById("btn-edit");
    eBtn.classList.remove("active");
    eBtn.style.background = "#0ff";
    eBtn.style.color = "black";
    eBtn.innerText = "✏️ 편집 모드 OFF";
    deselectAllObjects();

    if (isDeleteMode) {
        btn.classList.add("active");
        btn.innerText = "🗑️ 삭제 모드 ON (도로 클릭)";
        if (ghostObject) ghostObject.setEnabled(false);
        selectedRoadType = null;
        document.querySelectorAll(".road-item").forEach(i => i.classList.remove("selected"));
    } else {
        btn.classList.remove("active");
        btn.innerText = "🗑️ 삭제 모드 OFF";
        if (ghostObject && selectedRoadType) ghostObject.setEnabled(true);
    }
};

window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "LOAD_MAP") {
        const map = event.data.map;
        loadMapData(map);
    }
});

const loadMapData = (map) => {
    startPos = map.startPos;
    if (startPointMesh) {
        startPointMesh.position.set(startPos.x, 0.2, startPos.z);
        startPointMesh.rotation.y = startPos.rotation;
    }

    endPos = { x: map.parkingSpot.x, z: map.parkingSpot.z };
    if (endPointMesh) {
        endPointMesh.position.set(endPos.x, 0.05, endPos.z);
    }

    clearMap();
    map.objects.forEach(obj => {
        if (obj.type === 'road-square-pro') {
            const { root, borders, innerExts, innerCornerExts, corners } = createProceduralSquareMesh();
            root.position.set(obj.x, obj.y || 0.01, obj.z);
            root.rotation.y = obj.rotation;
            const dataObj = { type: obj.type, isSqTile: true, x: obj.x, y: obj.y || 0.01, z: obj.z, rotation: obj.rotation, mesh: root, borders, innerExts, innerCornerExts, corners, walls: obj.walls || [false, false, false, false] };
            placedObjects.push(dataObj);
            updateVisualWalls(dataObj);
            return;
        }
        BABYLON.SceneLoader.ImportMesh("", "roads/models/", obj.type + ".glb", scene, (meshes) => {
            const newObj = new BABYLON.Mesh("placed", scene);
            meshes.forEach(m => {
                m.parent = newObj;
                if (m.material) m.material.backFaceCulling = false;
            });
            newObj.position.set(obj.x, obj.y || 0.01, obj.z);
            newObj.rotation.y = obj.rotation;
            newObj.scaling = new BABYLON.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE);
            const dataObj = { type: obj.type, x: obj.x, y: obj.y || 0.01, z: obj.z, rotation: obj.rotation, mesh: newObj, walls: obj.walls || [false, false, false, false] };
            placedObjects.push(dataObj);
            updateVisualWalls(dataObj);
        });
    });
    updateSquareBorders();
};

const initEditor = (diff) => {
    const theme = MAP_THEMES[diff];
    const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
    floorMat.diffuseColor = theme.floorColor;
    ground.material = floorMat;

    theme.walls.forEach(w => {
        const wall = BABYLON.MeshBuilder.CreateBox("env-wall", { width: w.w, height: 2, depth: w.l }, scene);
        wall.position = new BABYLON.Vector3(w.x, 1, w.z);
        const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        wallMat.alpha = 0.2;
        wall.material = wallMat;
        wall.isPickable = false;
    });

    BABYLON.SceneLoader.ImportMesh("", "kenney_car-kit/Models/GLB format/", "sedan.glb", scene, (meshes) => {
        startPointMesh = new BABYLON.Mesh("startPoint", scene);
        meshes.forEach(m => {
            m.parent = startPointMesh;
            if (m.material) {
                m.material = m.material.clone("startCarMat");
                m.material.albedoColor = new BABYLON.Color3(1, 1, 0); 
            }
        });
        startPointMesh.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
        
        if (window.opener && window.opener.customMapData) {
            startPos = window.opener.customMapData.startPos;
        }

        startPointMesh.position.set(startPos.x, 0.2, startPos.z);
        startPointMesh.rotation.y = startPos.rotation;
        startPointMesh.isPickable = true;

        const dragStart = new BABYLON.PointerDragBehavior({dragPlaneNormal: new BABYLON.Vector3(0,1,0)});
        dragStart.onDragObservable.add(() => {
            startPos.x = startPointMesh.position.x;
            startPos.z = startPointMesh.position.z;
        });
        startPointMesh.addBehavior(dragStart);
    });

    if (window.opener && window.opener.customMapData) {
        endPos = { x: window.opener.customMapData.parkingSpot.x, z: window.opener.customMapData.parkingSpot.z };
    } else {
        endPos = { x: theme.parkingSpot.x, z: theme.parkingSpot.z };
    }

    endPointMesh = BABYLON.MeshBuilder.CreateBox("endPoint", { width: theme.parkingSpot.w, height: 0.1, depth: theme.parkingSpot.l }, scene);
    endPointMesh.position.set(endPos.x, 0.05, endPos.z);
    const endMat = new BABYLON.StandardMaterial("endMat", scene);
    endMat.diffuseColor = new BABYLON.Color3(0, 1, 0.5);
    endMat.alpha = 0.5;
    endPointMesh.material = endMat;
    
    const dragEnd = new BABYLON.PointerDragBehavior({dragPlaneNormal: new BABYLON.Vector3(0,1,0)});
    dragEnd.onDragObservable.add(() => {
        endPos.x = endPointMesh.position.x;
        endPos.z = endPointMesh.position.z;
    });
    endPointMesh.addBehavior(dragEnd);

    if (window.opener && window.opener.customMapData) {
        loadMapData(window.opener.customMapData);
    }
};

const initPalette = () => {
    const palette = document.getElementById("palette");
    roadGroups.forEach(group => {
        const header = document.createElement("div");
        header.className = "road-group-header";
        header.innerHTML = `<span>${group.label}</span><span>▼</span>`;

        const content = document.createElement("div");
        content.className = "road-group-content";

        header.onclick = () => {
            const collapsed = content.classList.toggle("collapsed");
            header.querySelector("span:last-child").textContent = collapsed ? "▶" : "▼";
        };

        group.items.forEach(roadId => {
            const item = document.createElement("div");
            item.className = "road-item";
            const label = roadId.replace(/^(road|bridge|construction|light|sign|tile)-?/, '').replace(/-/g, ' ') || roadId;
            const previewId = roadId === 'road-square-pro' ? 'road-square' : roadId;
            item.innerHTML = `<img src="roads/previews/${previewId}.png" onerror="this.src='roads/previews/road-straight.png'"><span>${label}</span>`;
            item.onclick = () => {
                if (isDeleteMode) toggleDeleteMode();
                if (isEditMode) toggleEditMode();
                if (selectedRoadType === roadId) {
                    selectedRoadType = null;
                    item.classList.remove("selected");
                    if (ghostObject) ghostObject.dispose();
                    ghostObject = null;
                } else {
                    document.querySelectorAll(".road-item").forEach(i => i.classList.remove("selected"));
                    item.classList.add("selected");
                    selectedRoadType = roadId;
                    updateGhost();
                }
            };
            content.appendChild(item);
        });

        palette.appendChild(header);
        palette.appendChild(content);
    });
};

const createScene = () => {
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.05, 1);
    camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 80, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5; camera.upperRadiusLimit = 300;

    // 내장 포인터 입력(좌클릭 회전/우클릭 패닝) 제거 후 직접 구현
    const _ptrKey = Object.keys(camera.inputs.attached).find(k => camera.inputs.attached[k].buttons);
    if (_ptrKey) camera.inputs.remove(camera.inputs.attached[_ptrKey]);

    let _rotDrag = false, _rotLx = 0, _rotLy = 0;
    let _panDrag = false, _panLx = 0, _panLy = 0;

    canvas.addEventListener("pointerdown", e => {
        if (e.button === 1) { _rotDrag = true; _rotLx = e.clientX; _rotLy = e.clientY; e.preventDefault(); }
        if (e.button === 2) { _panDrag = true; _panLx = e.clientX; _panLy = e.clientY; }
    });
    window.addEventListener("pointerup", e => {
        if (e.button === 1) _rotDrag = false;
        if (e.button === 2) _panDrag = false;
    });
    canvas.addEventListener("pointermove", e => {
        if (_rotDrag) {
            camera.alpha -= (e.clientX - _rotLx) * 0.005;
            camera.beta = Math.max(0.05, Math.min(1.5, camera.beta - (e.clientY - _rotLy) * 0.005));
            _rotLx = e.clientX; _rotLy = e.clientY;
        }
        if (_panDrag) {
            const spd = camera.radius * 0.001;
            const sa = Math.sin(camera.alpha), ca = Math.cos(camera.alpha);
            const dx = e.clientX - _panLx, dy = e.clientY - _panLy;
            camera.target.x += sa * dx * spd;
            camera.target.z -= ca * dx * spd;
            camera.target.x -= ca * dy * spd;
            camera.target.z -= sa * dy * spd;
            _panLx = e.clientX; _panLy = e.clientY;
        }
    });
    canvas.addEventListener("contextmenu", e => e.preventDefault());

    const hemiLight = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.8;
    hemiLight.specular = BABYLON.Color3.Black();

    ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);
    const grid = new BABYLON.GridMaterial("grid", scene);
    grid.gridRatio = 1; grid.majorUnitFrequency = SNAP_UNIT;
    grid.mainColor = new BABYLON.Color3(0, 0.8, 1); grid.opacity = 0.1;
    ground.material = grid;

    scene.onPointerMove = () => {
        if (!selectedRoadType || !ghostObject || isDeleteMode || isEditMode) return;
        const pick = scene.pick(scene.pointerX, scene.pointerY, (m) => m === ground);
        if (pick.hit) {
            const x = Math.round(pick.pickedPoint.x / SNAP_UNIT) * SNAP_UNIT;
            const z = Math.round(pick.pickedPoint.z / SNAP_UNIT) * SNAP_UNIT;
            ghostObject.position.set(x, 0.02, z);
        }
    };

    scene.onPointerDown = (evt) => {
        if (evt.button !== 0) return;
        
        if (isDeleteMode) {
            const pick = scene.pick(scene.pointerX, scene.pointerY);
            if (pick.hit && pick.pickedMesh) {
                let target = pick.pickedMesh;
                while (target && target.name !== "placed") {
                    target = target.parent;
                }
                if (target && target.name === "placed") {
                    const obj = placedObjects.find(o => o.mesh === target);
                    if (obj && obj.visualWalls) obj.visualWalls.forEach(w => w.dispose());
                    placedObjects = placedObjects.filter(o => o.mesh !== target);
                    target.dispose();
                    updateSquareBorders();
                }
            }
        } else if (isEditMode) {
            const pick = scene.pick(scene.pointerX, scene.pointerY);
            if (pick.hit && pick.pickedMesh) {
                let target = pick.pickedMesh;
                
                let placedTarget = target;
                while (placedTarget && placedTarget.name !== "placed") {
                    placedTarget = placedTarget.parent;
                }

                let specialTarget = null;
                if (target.name === "startPoint" || (target.parent && target.parent.name === "startPoint")) {
                    specialTarget = startPointMesh;
                } else if (target.name === "endPoint") {
                    specialTarget = endPointMesh;
                }

                const finalTarget = placedTarget || specialTarget;

                if (finalTarget) {
                    const obj = placedObjects.find(o => o.mesh === finalTarget) || 
                               (finalTarget === startPointMesh ? { mesh: startPointMesh, get x() { return startPos.x }, set x(v) { startPos.x = v }, get y() { return startPointMesh.position.y }, set y(v) { startPointMesh.position.y = v }, get z() { return startPos.z }, set z(v) { startPos.z = v }, get rotation() { return startPos.rotation }, set rotation(v) { startPos.rotation = v } } : 
                               (finalTarget === endPointMesh ? { mesh: endPointMesh, get x() { return endPos.x }, set x(v) { endPos.x = v }, get y() { return endPointMesh.position.y }, set y(v) { endPointMesh.position.y = v }, get z() { return endPos.z }, set z(v) { endPos.z = v }, get rotation() { return 0 }, set rotation(v) {} } : null));
                    
                    if (obj) {
                        if (!evt.ctrlKey && !evt.shiftKey) {
                            if (!selectedObjects.includes(obj)) {
                                deselectAllObjects();
                                selectedObjects = [obj];
                                highlightObject(finalTarget, true);
                            }
                        } else {
                            if (selectedObjects.includes(obj)) {
                                highlightObject(obj.mesh, false);
                                selectedObjects = selectedObjects.filter(o => o !== obj);
                            } else {
                                selectedObjects.push(obj);
                                highlightObject(finalTarget, true);
                            }
                        }
                        
                        if (selectedObjects.length > 0) {
                            document.getElementById("transform-panel").style.display = "block";
                            // 첫 번째 선택된 객체의 벽 설정 복원
                            const firstObj = selectedObjects[0];
                            if (firstObj.walls) {
                                document.getElementById('wall-f').checked = firstObj.walls[0];
                                document.getElementById('wall-b').checked = firstObj.walls[1];
                                document.getElementById('wall-l').checked = firstObj.walls[2];
                                document.getElementById('wall-r').checked = firstObj.walls[3];
                                document.getElementById('wall-settings').style.display = (finalTarget === placedTarget) ? "block" : "none";
                            }
                        } else {
                            document.getElementById("transform-panel").style.display = "none";
                        }
                    }
                }
            } else {
                if (!evt.ctrlKey && !evt.shiftKey) deselectAllObjects();
            }
        } else if (selectedRoadType) {
            const pick = scene.pick(scene.pointerX, scene.pointerY, (m) => m === ground);
            if (pick.hit) placeRoad();
        }
    };

    window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (keys.hasOwnProperty(k)) keys[k] = true;
        if (k === "r") {
            if (isEditMode && selectedObjects.length > 0) {
                selectedObjects.forEach(obj => {
                    obj.rotation += Math.PI / 2;
                    obj.mesh.rotation.y = obj.rotation;
                    updateVisualWalls(obj);
                });
            } else {
                currentRotation += Math.PI / 2;
                if (ghostObject) ghostObject.rotation.y = currentRotation;
                if (!selectedRoadType && startPointMesh) {
                    startPos.rotation = currentRotation;
                    startPointMesh.rotation.y = currentRotation;
                }
            }
        }
    });
    window.addEventListener("keyup", (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

    scene.registerBeforeRender(() => {
        const speed = 0.6;
        const f = camera.getDirection(BABYLON.Vector3.Forward());
        const r = camera.getDirection(BABYLON.Vector3.Right());
        f.y = 0; r.y = 0; f.normalize(); r.normalize();
        if (keys.w) camera.target.addInPlace(f.scale(speed));
        if (keys.s) camera.target.subtractInPlace(f.scale(speed));
        if (keys.a) camera.target.subtractInPlace(r.scale(speed));
        if (keys.d) camera.target.addInPlace(r.scale(speed));
    });

    return scene;
};

const updateGhost = () => {
    if (ghostObject) ghostObject.dispose();
    if (!selectedRoadType) return;

    if (selectedRoadType === 'road-square-pro') {
        const { root } = createProceduralSquareMesh(0.4);
        ghostObject = root;
        ghostObject.getChildMeshes().forEach(m => m.isPickable = false);
        return;
    }

    BABYLON.SceneLoader.ImportMesh("", "roads/models/", selectedRoadType + ".glb", scene, (meshes) => {
        ghostObject = new BABYLON.Mesh("ghost", scene);
        meshes.forEach(m => {
            m.parent = ghostObject;
            if (m.material) { 
                m.material = m.material.clone("ghostMat"); 
                m.material.alpha = 0.4;
                m.material.backFaceCulling = false;
            }
        });
        ghostObject.scaling = new BABYLON.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE);
        ghostObject.rotation.y = currentRotation;
        ghostObject.isPickable = false;
    });
};

const placeRoad = () => {
    if (!ghostObject) return;
    const pos = ghostObject.position.clone();
    const rot = currentRotation;
    const type = selectedRoadType;

    if (type === 'road-square-pro') {
        const { root, borders, innerExts, innerCornerExts, corners } = createProceduralSquareMesh();
        root.position.set(pos.x, 0.01, pos.z);
        root.rotation.y = rot;
        const dataObj = { type, isSqTile: true, x: pos.x, y: 0.01, z: pos.z, rotation: rot, mesh: root, borders, innerExts, innerCornerExts, corners, walls: [false, false, false, false] };
        placedObjects.push(dataObj);
        updateSquareBorders();
        return;
    }

    BABYLON.SceneLoader.ImportMesh("", "roads/models/", type + ".glb", scene, (meshes) => {
        const newObj = new BABYLON.Mesh("placed", scene);
        meshes.forEach(m => {
            m.parent = newObj;
            if (m.material) m.material.backFaceCulling = false;
        });
        newObj.position.copyFrom(pos);
        newObj.position.y = 0.01;
        newObj.rotation.y = rot;
        newObj.scaling = new BABYLON.Vector3(BASE_SCALE, BASE_SCALE, BASE_SCALE);
        const dataObj = { type, x: pos.x, y: 0.01, z: pos.z, rotation: rot, mesh: newObj, walls: [false, false, false, false] };
        placedObjects.push(dataObj);
    });
};

window.clearMap = () => {
    placedObjects.forEach(o => {
        if (o.visualWalls) o.visualWalls.forEach(vw => vw.dispose());
        o.mesh.dispose();
    });
    placedObjects = [];
};

window.exportMap = () => {
    const data = JSON.stringify({
        difficulty: currentDifficulty,
        startPos: startPos,
        parkingSpot: { x: endPos.x, z: endPos.z, w: MAP_THEMES[currentDifficulty].parkingSpot.w, l: MAP_THEMES[currentDifficulty].parkingSpot.l },
        objects: placedObjects.map(o => ({ type: o.type, x: o.x, y: o.y, z: o.z, rotation: o.rotation, walls: o.walls }))
    }, null, 2);
    const el = document.createElement('textarea'); el.value = data; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    alert("Map data copied!");
};

initPalette();
createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
