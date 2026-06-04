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

const roads = [
    "road-straight", "road-straight-half", "road-straight-barrier", "road-straight-barrier-half", "road-straight-barrier-end",
    "road-bend", "road-bend-barrier", "road-bend-sidewalk", "road-bend-square", "road-bend-square-barrier",
    "road-intersection", "road-intersection-barrier", "road-intersection-line", "road-intersection-path",
    "road-crossroad", "road-crossroad-barrier", "road-crossroad-line", "road-crossroad-path",
    "road-curve", "road-curve-barrier", "road-curve-intersection", "road-curve-intersection-barrier", "road-curve-pavement",
    "road-roundabout", "road-roundabout-barrier",
    "road-bridge", "bridge-pillar", "bridge-pillar-wide",
    "road-slant", "road-slant-barrier", "road-slant-high", "road-slant-high-barrier", "road-slant-flat", "road-slant-flat-high",
    "road-slant-curve", "road-slant-curve-barrier", "road-slant-flat-curve",
    "road-split", "road-split-barrier",
    "road-side", "road-side-barrier", "road-side-entry", "road-side-entry-barrier", "road-side-exit", "road-side-exit-barrier",
    "road-end", "road-end-barrier", "road-end-round", "road-end-round-barrier",
    "road-crossing", "road-driveway-single", "road-driveway-single-barrier", "road-driveway-double", "road-driveway-double-barrier",
    "road-square", "road-square-barrier",
    "construction-barrier", "construction-cone", "construction-light",
    "light-curved", "light-curved-double", "light-curved-cross",
    "light-square", "light-square-double", "light-square-cross",
    "sign-highway", "sign-highway-wide", "sign-highway-detailed",
    "tile-high", "tile-low", "tile-slant", "tile-slantHigh"
];

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
        if (ghostObject) ghostObject.isVisible = false;
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
        if (ghostObject) ghostObject.isVisible = false;
        selectedRoadType = null;
        document.querySelectorAll(".road-item").forEach(i => i.classList.remove("selected"));
    } else {
        btn.classList.remove("active");
        btn.innerText = "🗑️ 삭제 모드 OFF";
        if (ghostObject) ghostObject.isVisible = true;
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
    roads.forEach(roadId => {
        const item = document.createElement("div");
        item.className = "road-item";
        item.innerHTML = `<img src="roads/previews/${roadId}.png" onerror="this.src='roads/previews/road-straight.png'"><span>${roadId.replace('road-', '')}</span>`;
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
        palette.appendChild(item);
    });
};

const createScene = () => {
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.05, 1);
    camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 80, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5; camera.upperRadiusLimit = 300;

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.8;

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
        const speed = 1.2;
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
