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

// 차량 선택 및 UI 전환
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
            if (selectedText) selectedText.innerText = type.toUpperCase();
        }, 300);
    }
};

// --- 커스텀 맵 데이터 (제공된 JSON 적용) ---
let customMapData = {
  "difficulty": "EASY",
  "startPos": {
    "x": -1.4277184245467764,
    "z": 33.0922874344515,
    "rotation": 92.67698328089885
  },
  "parkingSpot": {
    "x": 0,
    "z": -35,
    "w": 2.25,
    "l": 4.5
  },
  "objects": [
    { "type": "road-straight", "x": 0, "y": 0.01, "z": 8, "rotation": 1.5707963267948966, "walls": [false, false, false, false] },
    { "type": "road-crossroad", "x": 0, "y": 0.01, "z": 24, "rotation": 0, "walls": [false, false, false, false] },
    { "type": "road-slant-high", "x": 0, "y": 0.01, "z": 0, "rotation": 1.5707963267948966, "walls": [false, false, false, false] },
    { "type": "road-bend-sidewalk", "x": -48, "y": 0.01, "z": 24, "rotation": 3.141592653589793, "walls": [false, false, false, false] },
    { "type": "road-slant-flat-high", "x": 0, "y": 0.01, "z": -16, "rotation": 4.71238898038469, "walls": [false, false, false, false] },
    { "type": "road-bridge", "x": 0, "y": 0.01, "z": -8, "rotation": 3.141592653589793, "walls": [false, false, false, false] },
    { "type": "road-bend", "x": -24, "y": 0.01, "z": 0, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-slant-curve", "x": 40, "y": 0.01, "z": 11.899999999999986, "rotation": 20.420352248333657, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 2.7755575615628914e-17, "y": 0.009999999999999981, "z": 16.1, "rotation": 1.5707963267948966, "walls": [false, false, false, false] },
    { "type": "road-bend-sidewalk", "x": -48, "y": 0.01, "z": 0, "rotation": 7.853981633974483, "walls": [false, false, false, false] },
    { "type": "road-intersection", "x": -24, "y": 0.01, "z": -8, "rotation": 1.5707963267948966, "walls": [false, false, false, false] },
    { "type": "road-slant-flat-high", "x": 40, "y": 0.01, "z": -24, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-end", "x": 24, "y": 0.01, "z": -24, "rotation": 36.12831551628264, "walls": [false, false, false, false] },
    { "type": "road-end-barrier", "x": 24, "y": 0.01, "z": -24, "rotation": 36.12831551628264, "walls": [false, false, false, false] },
    { "type": "road-bend", "x": -24, "y": 0.01, "z": -40, "rotation": 14.137166941154069, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": 32, "rotation": 1.5707963267948966, "walls": [false, false, false, false] },
    { "type": "road-bend-sidewalk", "x": 40, "y": 0.01, "z": 24, "rotation": 17.27875959474386, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": 32, "rotation": 36.12831551628264, "walls": [false, false, false, false] },
    { "type": "road-slant-curve-barrier", "x": 40, "y": 0.009999999999999995, "z": 12.000000000000014, "rotation": 58.11946409141122, "walls": [false, false, false, false] },
    { "type": "road-bend-square-barrier", "x": 40, "y": 0.01, "z": 24, "rotation": 61.261056745001014, "walls": [false, false, false, false] },
    { "type": "road-bend-barrier", "x": -24, "y": 0.01, "z": -40, "rotation": 83.2522053201295, "walls": [false, false, false, false] },
    { "type": "road-intersection-barrier", "x": -24, "y": 0.01, "z": -8, "rotation": 89.53539062730907, "walls": [false, false, false, false] },
    { "type": "road-slant-high-barrier", "x": 0, "y": 0.01, "z": -16, "rotation": 92.67698328089885, "walls": [false, false, false, false] },
    { "type": "road-bend-sidewalk", "x": 24, "y": 0.01, "z": -8, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": -24, "rotation": 4.71238898038469, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -8, "y": 0.01, "z": 24, "rotation": 37.69911184307754, "walls": [false, false, false, false] },
    { "type": "road-bend-square-barrier", "x": 40, "y": 0.01, "z": -40, "rotation": 62.83185307179591, "walls": [false, false, false, false] },
    { "type": "road-bend-barrier", "x": -24, "y": 0.01, "z": 0, "rotation": 86.39379797371929, "walls": [false, false, false, false] },
    { "type": "road-slant-high-barrier", "x": 0, "y": 0.01, "z": 0, "rotation": 95.81857593448863, "walls": [false, false, false, false] },
    { "type": "road-bend-sidewalk", "x": 40, "y": 0.01, "z": -40, "rotation": 31.415926535897945, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -8, "y": 0.01, "z": 24, "rotation": 0, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -16, "y": 0.01, "z": 24, "rotation": 37.69911184307754, "walls": [false, false, false, false] },
    { "type": "road-bend-square-barrier", "x": 24, "y": 0.01, "z": -8, "rotation": 67.54424205218059, "walls": [false, false, false, false] },
    { "type": "road-slant-high-barrier", "x": 40, "y": 0.01, "z": -24, "rotation": 98.96016858807842, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -16, "y": 0.01, "z": 24, "rotation": 0, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": 24, "rotation": 37.69911184307754, "walls": [false, false, false, false] },
    { "type": "road-bend-square-barrier", "x": -48, "y": 0.01, "z": 24, "rotation": 72.25663103256527, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": 24, "rotation": 0, "walls": [false, false, false, false] },
    { "type": "road-bend-square-barrier", "x": -48, "y": 0.01, "z": 0, "rotation": 76.96902001294994, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -32, "y": 0.01, "z": 24, "rotation": 37.69911184307754, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -40, "y": 0.01, "z": 24, "rotation": 0, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -40, "y": 0.01, "z": 24, "rotation": 37.69911184307754, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -32, "y": 0.01, "z": 24, "rotation": 0, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -48, "y": 0.01, "z": 16, "rotation": 39.26990816987244, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -48, "y": 0.01, "z": 8, "rotation": 39.26990816987244, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -48, "y": 0.01, "z": 16, "rotation": 4.71238898038469, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -40, "y": 0.01, "z": 0, "rotation": 40.840704496667335, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -48, "y": 0.01, "z": 8, "rotation": 4.71238898038469, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -32, "y": 0.01, "z": 0, "rotation": 40.840704496667335, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -40, "y": 0.01, "z": 0, "rotation": 9.42477796076938, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": -16, "rotation": 42.411500823462234, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -32, "y": 0.01, "z": 0, "rotation": 9.42477796076938, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": -24, "rotation": 42.411500823462234, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": -16, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -24, "y": 0.01, "z": -32, "rotation": 42.411500823462234, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": -24, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -16, "y": 0.01, "z": -40, "rotation": 43.98229715025713, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -24, "y": 0.01, "z": -32, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -8, "y": 0.01, "z": -40, "rotation": 43.98229715025713, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -16, "y": 0.01, "z": -40, "rotation": 15.707963267948966, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -16, "y": 0.01, "z": -8, "rotation": 43.98229715025713, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -8, "y": 0.01, "z": -40, "rotation": 15.707963267948966, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": -8, "y": 0.01, "z": -8, "rotation": 43.98229715025713, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": -40, "rotation": 15.707963267948966, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": -8, "rotation": 43.98229715025713, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 8, "y": 0.01, "z": 24, "rotation": 15.707963267948966, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 16, "y": 0.01, "z": 24, "rotation": 15.707963267948966, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 8, "y": 0.01, "z": -8, "rotation": 43.98229715025713, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 16, "y": 0.01, "z": -8, "rotation": 43.98229715025713, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 24, "y": 0.01, "z": 24, "rotation": 15.707963267948966, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 24, "y": 0.01, "z": -16, "rotation": 45.55309347705203, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 32, "y": 0.01, "z": 24, "rotation": 15.707963267948966, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": 16, "rotation": 48.69468613064183, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 40, "y": 4.0100000000000025, "z": 0, "rotation": 20.420352248333657, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": 8, "rotation": 48.69468613064183, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 40, "y": 4.0100000000000025, "z": -8, "rotation": 20.420352248333657, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 8, "y": 0.01, "z": 24, "rotation": 50.265482457436725, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 40, "y": 4.0100000000000025, "z": -16, "rotation": 20.420352248333657, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 16, "y": 0.01, "z": 24, "rotation": 50.265482457436725, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -16, "y": 0.01, "z": -8, "rotation": 3.141592653589793, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 24, "y": 0.01, "z": 24, "rotation": 50.265482457436725, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 0, "y": 0.01, "z": -8, "rotation": 3.141592653589793, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": -8, "y": 0.01, "z": -8, "rotation": 3.141592653589793, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 32, "y": 0.01, "z": 24, "rotation": 50.265482457436725, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 8, "y": 0.01, "z": -8, "rotation": 3.141592653589793, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 40, "y": 0.01, "z": -32, "rotation": 51.836278784231624, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 16, "y": 0.01, "z": -8, "rotation": 3.141592653589793, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 32, "y": 0.01, "z": -40, "rotation": 53.40707511102652, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 24, "y": 0.01, "z": -40, "rotation": 53.40707511102652, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 24, "y": 0.01, "z": -16, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 16, "y": 0.01, "z": -40, "rotation": 53.40707511102652, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 40, "y": 0.01, "z": -32, "rotation": 10.995574287564276, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 8, "y": 0.01, "z": -40, "rotation": 53.40707511102652, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 32, "y": 0.01, "z": -40, "rotation": 31.415926535897945, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": -40, "rotation": 53.40707511102652, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 8, "y": 0.01, "z": -40, "rotation": 31.415926535897945, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 40, "y": 4.110000000000002, "z": -16, "rotation": 54.97787143782142, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 16, "y": 0.01, "z": -40, "rotation": 31.415926535897945, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 40, "y": 4.110000000000002, "z": -8, "rotation": 54.97787143782142, "walls": [false, false, false, false] },
    { "type": "road-straight", "x": 24, "y": 0.01, "z": -40, "rotation": 31.415926535897945, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 40, "y": 4.110000000000002, "z": 0, "rotation": 54.97787143782142, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 0, "y": 0.01, "z": -24, "rotation": 86.39379797371929, "walls": [false, false, false, false] },
    { "type": "road-straight-barrier", "x": 0, "y": 4.210000000000002, "z": -8, "rotation": 86.39379797371929, "walls": [false, false, false, false] },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": 34, "rotation": 7.853981633974483, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": 34, "rotation": 7.853981633974483, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": 30, "rotation": 10.995574287564276, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -6, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -10, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -14, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -18, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -22, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -26, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -30, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -34, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -38, "y": 1, "z": 28, "rotation": 12.566370614359172, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -42, "y": 1, "z": 28, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -46, "y": 1, "z": 28, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -50, "y": 1, "z": 28, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": 26, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": 22, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": 18, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": 14, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": 10, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": 6, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": 2, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -52, "y": 1, "z": -2, "rotation": 14.137166941154069, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -50, "y": 1, "z": -4, "rotation": 15.707963267948966, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -47, "y": 1, "z": -4, "rotation": 15.707963267948966, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -51, "y": 1, "z": -2, "rotation": 20.420352248333657, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -49, "y": 1, "z": -3, "rotation": 21.991148575128555, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -50, "y": 1, "z": -3, "rotation": 23.561944901923454, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -43, "y": 1, "z": -4, "rotation": 25.132741228718352, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -39, "y": 1, "z": -4, "rotation": 25.132741228718352, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -35, "y": 1, "z": -4, "rotation": 25.132741228718352, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -31, "y": 1, "z": -4, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -30, "y": 1, "z": -4, "rotation": 28.27433388230815, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -6, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -10, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -14, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -18, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -22, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -26, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -30, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -34, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -28, "y": 1, "z": -38, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -24, "y": 1, "z": -45, "rotation": 29.845130209103047, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -27, "y": 1, "z": -42, "rotation": 32.986722862692844, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -29, "y": 1, "z": -39, "rotation": 34.55751918948774, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -26, "y": 1, "z": -43, "rotation": 36.12831551628264, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -25, "y": 1, "z": -44, "rotation": 36.12831551628264, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -23, "y": 1, "z": -45, "rotation": 39.26990816987244, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -21, "y": 1, "z": -44, "rotation": 40.840704496667335, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -17, "y": 1, "z": -44, "rotation": 40.840704496667335, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -13, "y": 1, "z": -44, "rotation": 40.840704496667335, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -9, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -5, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -1, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 3, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 7, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 11, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 15, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 19, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 23, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 27, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 31, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 35, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 39, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 43, "y": 1, "z": -44, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 1, "z": -42, "rotation": 42.411500823462234, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 1, "z": -38, "rotation": 42.411500823462234, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 1, "z": -34, "rotation": 42.411500823462234, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 1, "z": -30, "rotation": 42.411500823462234, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 2.4000000000000012, "z": -26, "rotation": 42.411500823462234, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 4.100000000000002, "z": -22, "rotation": 42.411500823462234, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 5.399999999999998, "z": -18, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 5.399999999999998, "z": -14, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 5.399999999999998, "z": -10, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 5.399999999999998, "z": -6, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 5.399999999999998, "z": -2, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 5.399999999999998, "z": 2, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 4.999999999999999, "z": 6, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 4.000000000000003, "z": 10, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 2.8000000000000016, "z": 14, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 1.4000000000000004, "z": 18, "rotation": 45.55309347705203, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 1, "z": 22, "rotation": 48.69468613064183, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 44, "y": 1, "z": 26, "rotation": 48.69468613064183, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 42, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 38, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 34, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 30, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 26, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 22, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 18, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 14, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 11, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 7, "y": 1, "z": 28, "rotation": 50.265482457436725, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 6, "y": 1, "z": 28, "rotation": 53.40707511102652, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": 30, "rotation": 54.97787143782142, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 6, "y": 1, "z": 20, "rotation": 56.54866776461632, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 10, "y": 1, "z": 20, "rotation": 56.54866776461632, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 14, "y": 1, "z": 20, "rotation": 56.54866776461632, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 18, "y": 1, "z": 20, "rotation": 56.54866776461632, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 22, "y": 1, "z": 20, "rotation": 56.54866776461632, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 26, "y": 1, "z": 20, "rotation": 56.54866776461632, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 30, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 34, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 1.4000000000000004, "z": 18, "rotation": 58.11946409141122, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 2.8000000000000016, "z": 14, "rotation": 58.11946409141122, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 4.000000000000003, "z": 10, "rotation": 58.11946409141122, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 4.999999999999999, "z": 6, "rotation": 58.11946409141122, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 5.399999999999998, "z": 2, "rotation": 58.11946409141122, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 5.399999999999998, "z": -2, "rotation": 58.11946409141122, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 5.399999999999998, "z": -6, "rotation": 58.11946409141122, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -6, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -10, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -14, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -18, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -22, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -26, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -30, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -34, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -38, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -42, "y": 1, "z": 20, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -44, "y": 1, "z": 18, "rotation": 61.261056745001014, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -44, "y": 1, "z": 14, "rotation": 61.261056745001014, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -44, "y": 1, "z": 10, "rotation": 61.261056745001014, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -50, "y": 1, "z": 27, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -51, "y": 1, "z": 25, "rotation": 67.54424205218059, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -50, "y": 1, "z": 27, "rotation": 70.68583470577038, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -44, "y": 1, "z": 6, "rotation": 70.68583470577038, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -42, "y": 1, "z": 4, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -38, "y": 1, "z": 4, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -34, "y": 1, "z": 4, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -30, "y": 1, "z": 4, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -26, "y": 1, "z": 4, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -23, "y": 1, "z": 3, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -21, "y": 1, "z": 2, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": 1, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -19, "y": 1, "z": 0, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -19, "y": 1, "z": -1, "rotation": 72.25663103256527, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": -2, "rotation": 73.82742735936016, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -18, "y": 1, "z": -4, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -14, "y": 1, "z": -4, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -10, "y": 1, "z": -4, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -6, "y": 1, "z": -4, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -5, "y": 1, "z": -12, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -9, "y": 1, "z": -12, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -13, "y": 1, "z": -12, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -17, "y": 1, "z": -12, "rotation": 75.39822368615505, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -18, "y": 1, "z": -12, "rotation": 78.53981633974483, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": -14, "rotation": 80.11061266653972, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": -18, "rotation": 80.11061266653972, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": -22, "rotation": 80.11061266653972, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": -26, "rotation": 80.11061266653972, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": -30, "rotation": 80.11061266653972, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -20, "y": 1, "z": -34, "rotation": 80.11061266653972, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -18, "y": 1, "z": -36, "rotation": 81.68140899333461, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -14, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -10, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -6, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -2, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 2, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 6, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 10, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 14, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 18, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 22, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 26, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 30, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 34, "y": 1, "z": -36, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 1, "z": -34, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 1, "z": -30, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 2.4000000000000012, "z": -26, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 4.100000000000002, "z": -22, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 5.399999999999998, "z": -18, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 5.399999999999998, "z": -14, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 36, "y": 5.399999999999998, "z": -10, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": 18, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": 14, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": 10, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": 6, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 3.0000000000000018, "z": 2, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 4.100000000000002, "z": -2, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 5.299999999999998, "z": -6, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 5.299999999999998, "z": -10, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 4.100000000000002, "z": -14, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 3.0000000000000018, "z": -18, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": -22, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -4, "y": 1, "z": -26, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": -26, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": -22, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 3.0000000000000018, "z": -18, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 4.100000000000002, "z": -14, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 5.299999999999998, "z": -10, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 5.299999999999998, "z": -6, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 4.100000000000002, "z": -2, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 3.0000000000000018, "z": 2, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": 6, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": 10, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": 14, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 4, "y": 1, "z": 18, "rotation": 83.2522053201295, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -1, "y": 1, "z": -5, "rotation": 84.8230016469244, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 3, "y": 1, "z": -5, "rotation": 84.8230016469244, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": -1, "y": 1, "z": -12, "rotation": 84.8230016469244, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 3, "y": 1, "z": -12, "rotation": 84.8230016469244, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 7, "y": 1, "z": -12, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 6, "y": 1, "z": -4, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 10, "y": 1, "z": -4, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 14, "y": 1, "z": -4, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 18, "y": 1, "z": -4, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 22, "y": 1, "z": -4, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 26, "y": 1, "z": -4, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 11, "y": 1, "z": -12, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 15, "y": 1, "z": -12, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 18, "y": 1, "z": -12, "rotation": 0, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 20, "y": 1, "z": -14, "rotation": 89.53539062730907, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 20, "y": 1, "z": -18, "rotation": 89.53539062730907, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 20, "y": 1, "z": -22, "rotation": 89.53539062730907, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 20, "y": 1, "z": -26, "rotation": 89.53539062730907, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 22, "y": 1, "z": -28, "rotation": 91.10618695410396, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 26, "y": 1, "z": -28, "rotation": 91.10618695410396, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 28, "y": 1, "z": -26, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 28, "y": 1, "z": -22, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 28, "y": 1, "z": -18, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 28, "y": 1, "z": -14, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 28, "y": 1, "z": -10, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 28, "y": 1, "z": -6, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 27, "y": 1, "z": -6, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 26, "y": 1, "z": -5, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } },
    { "type": "invisibleWall", "x": 25, "y": 1, "z": -4, "rotation": 92.67698328089885, "scale": { "x": 1, "y": 1, "z": 1 } }
  ]
};

function backToVehicle() {
    const vSelection = document.getElementById('vehicle-selection');
    const dSelection = document.getElementById('difficulty-selection');
    if (dSelection) dSelection.classList.add('hidden');
    if (vSelection) {
        vSelection.classList.remove('hidden');
        vSelection.style.opacity = '1';
    }
}

// --- 물리 및 게임 상태 ---
let engine, scene, camera, carGroup;
let carPhysics = { x: 0, y: 0, z: 0, angle: 0, speed: 0, steer: 0 };
let gear = 'D'; // 'D' or 'R'
let roadMeshes = [];
let physicsWalls = [];
let parkingSpot = { x: 0, z: -35, w: 2.25, l: 4.5 };
let isGameOver = false;
let startTime = 0;

// 입력 상태
const inputs = { accel: false, brake: false, left: false, right: false };

/**
 * 게임 시작
 */
function startGame(difficulty) {
    currentDifficulty = difficulty;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    initGame();
}

/**
 * 초기화
 */
function initGame() {
    const canvas = document.createElement('canvas');
    canvas.id = 'renderCanvas';
    const container = document.getElementById('canvas-container');
    container.innerHTML = '';
    container.appendChild(canvas);

    if (!window.BABYLON) {
        alert("Babylon.js 라이브러리가 로드되지 않았습니다.");
        return;
    }

    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
    
    buildMap(currentDifficulty);
    createCar();
    setupControls();
    
    isGameOver = false;
    startTime = Date.now();
    
    engine.runRenderLoop(() => {
        if (!isGameOver) {
            updatePhysics();
            updateHUD();
        }
        scene.render();
    });

    // 화면 크기 변경 시 엔진 리사이즈 강제 실행
    const resize = () => {
        if (engine) engine.resize();
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 100); 
}

/**
 * 맵 생성
 */
function buildMap(difficulty) {
    const activeMap = (customMapData && customMapData.difficulty === difficulty) ? customMapData : null;
    roadMeshes = [];
    physicsWalls = [];

    let floorColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    let bgColor = new BABYLON.Color3(0.53, 0.81, 0.92);

    if (difficulty === 'EASY') {
        floorColor = new BABYLON.Color3(0.18, 0.29, 0.07);
    } else if (difficulty === 'MEDIUM') {
        floorColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        bgColor = new BABYLON.Color3(0.02, 0.02, 0.06);
    } else if (difficulty === 'DIFFICULT') {
        floorColor = new BABYLON.Color3(0.13, 0.02, 0);
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

    if (activeMap && activeMap.objects) {
        activeMap.objects.forEach(obj => {
            if (obj.type === 'invisibleWall') {
                const wallMesh = BABYLON.MeshBuilder.CreateBox("invisibleWall", { width: 4, height: 2, depth: 1 }, scene);
                wallMesh.position.set(obj.x, obj.y, obj.z);
                wallMesh.rotation.y = obj.rotation;
                if (obj.scale) {
                    wallMesh.scaling.set(obj.scale.x, obj.scale.y, obj.scale.z);
                }
                const mat = new BABYLON.StandardMaterial("v-wall-mat", scene);
                mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
                mat.alpha = 0.2; 
                wallMesh.material = mat;
                wallMesh.isVisible = false; 

                physicsWalls.push({
                    x: obj.x,
                    y: obj.y,
                    z: obj.z,
                    rotation: obj.rotation,
                    w: 4 * (obj.scale ? obj.scale.x : 1),
                    d: 1 * (obj.scale ? obj.scale.z : 1),
                    h: 2 * (obj.scale ? obj.scale.y : 1),
                    type: 'invisibleWall'
                });
            } else {
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

                    if (obj.walls) {
                        const wallHeight = 4;
                        const configs = [
                            { dx: 0, dz: 4, rot: 0, width: 6.4 },         
                            { dx: 0, dz: -4, rot: 0, width: 6.4 },        
                            { dx: -3.2, dz: 0, rot: Math.PI/2, width: 8.1 }, 
                            { dx: 3.2, dz: 0, rot: Math.PI/2, width: 8.1 }  
                        ];
                        obj.walls.forEach((enabled, i) => {
                            if (enabled) {
                                const conf = configs[i];
                                const cos = Math.cos(obj.rotation);
                                const sin = Math.sin(obj.rotation);
                                const worldX = obj.x + (conf.dx * cos + conf.dz * sin);
                                const worldZ = obj.z + (-conf.dx * sin + conf.dz * cos);
                                physicsWalls.push({
                                    x: worldX,
                                    y: (obj.y || 0.05) + wallHeight / 2,
                                    z: worldZ,
                                    rotation: obj.rotation + conf.rot,
                                    w: conf.width,
                                    d: 0.2,
                                    h: wallHeight
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    if (activeMap) {
        parkingSpot = activeMap.parkingSpot;
        carPhysics.x = activeMap.startPos.x;
        carPhysics.z = activeMap.startPos.z;
        carPhysics.angle = activeMap.startPos.rotation;
    }

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
    setupMobileCamera();
}

function setupControls() {
    window.onkeydown = (e) => {
        if (e.key === 'ArrowUp' || e.key === 'w') inputs.accel = true;
        if (e.key === 'ArrowDown' || e.key === 's') inputs.brake = true;
        if (e.key === 'ArrowLeft' || e.key === 'a') inputs.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') inputs.right = true;
    };
    window.onkeyup = (e) => {
        if (e.key === 'ArrowUp' || e.key === 'w') inputs.accel = false;
        if (e.key === 'ArrowDown' || e.key === 's') inputs.brake = false;
        if (e.key === 'ArrowLeft' || e.key === 'a') inputs.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') inputs.right = false;
    };

    const btnGas = document.getElementById('btn-gas');
    const btnBrake = document.getElementById('btn-brake');
    if (btnGas) {
        btnGas.ontouchstart = () => inputs.accel = true;
        btnGas.ontouchend = () => inputs.accel = false;
        btnGas.onmousedown = () => inputs.accel = true;
        btnGas.onmouseup = () => inputs.accel = false;
    }
    if (btnBrake) {
        btnBrake.ontouchstart = () => inputs.brake = true;
        btnBrake.ontouchend = () => inputs.brake = false;
        btnBrake.onmousedown = () => inputs.brake = true;
        btnBrake.onmouseup = () => inputs.brake = false;
    }
    
    const wheel = document.getElementById('steering-wheel');
    let isDragging = false, startAngle = 0, currentWheelRotation = 0;
    if (wheel) {
        const handleStart = (e) => {
            isDragging = true;
            const rect = wheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startAngle = Math.atan2(clientY - centerY, clientX - centerX) - currentWheelRotation;
            if (e.cancelable) e.preventDefault();
        };
        const handleMove = (e) => {
            if (!isDragging) return;
            const rect = wheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let angle = Math.atan2(clientY - centerY, clientX - centerX) - startAngle;
            const maxWheelRotation = Math.PI * 1.5;
            angle = Math.max(-maxWheelRotation, Math.min(maxWheelRotation, angle));
            currentWheelRotation = angle;
            wheel.style.transform = `rotate(${angle}rad)`;
            inputs.left = angle < -0.2;
            inputs.right = angle > 0.2;
            carPhysics.steer = (angle / maxWheelRotation) * 0.5;
        };
        const handleEnd = () => {
            isDragging = false;
            currentWheelRotation = 0;
            wheel.style.transform = 'rotate(0deg)';
            inputs.left = false; inputs.right = false; carPhysics.steer = 0;
        };
        wheel.addEventListener('touchstart', handleStart);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        wheel.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
    }
}

function setGear(g) {
    gear = g;
    document.querySelectorAll('#gear-selector .gear-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === g);
    });
}

function updatePhysics() {
    const v = currentVehicle;
    if (!v) return;
    if (inputs.accel) {
        const moveDir = (gear === 'D') ? -1 : 1; 
        carPhysics.speed += moveDir * v.accel;
    } else if (inputs.brake) {
        carPhysics.speed *= 0.92;
    } else {
        carPhysics.speed *= 0.98;
    }
    const maxS = v.maxSpeed;
    carPhysics.speed = Math.max(-maxS * 0.5, Math.min(maxS, carPhysics.speed));
    if (Math.abs(carPhysics.speed) > 0.01) {
        const steerFactor = carPhysics.steer || (inputs.left ? -0.05 : (inputs.right ? 0.05 : 0));
        carPhysics.angle += steerFactor * (carPhysics.speed / maxS);
    }
    carPhysics.x += Math.sin(carPhysics.angle) * carPhysics.speed;
    carPhysics.z += Math.cos(carPhysics.angle) * carPhysics.speed;
    if (isCollidingWithWalls()) {
        carPhysics.speed *= -0.5;
        carPhysics.x += Math.sin(carPhysics.angle) * carPhysics.speed * 2;
        carPhysics.z += Math.cos(carPhysics.angle) * carPhysics.speed * 2;
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
    const carY = carPhysics.y;
    const carH = currentVehicle ? currentVehicle.h : 0.5;
    for (let w of physicsWalls) {
        const wallY = w.y || 0, wallH = w.h || 2;
        const wallMinY = wallY - wallH / 2, wallMaxY = wallY + wallH / 2;
        if (carY + carH < wallMinY || carY > wallMaxY) continue;
        const cos = Math.cos(-w.rotation), sin = Math.sin(-w.rotation);
        const halfW = w.w / 2, halfD = (w.d || 0.2) / 2;
        for (let c of corners) {
            const lx = (c.x - w.x) * cos + (c.z - w.z) * sin;
            const lz = -(c.x - w.x) * sin + (c.z - w.z) * cos;
            if (Math.abs(lx) < halfW && Math.abs(lz) < halfD) return true;
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
    if (dist < 1.0 && Math.abs(carPhysics.speed) < 0.02) gameOver(true);
}

function updateHUD() {
    const time = Math.floor((Date.now() - startTime) / 1000);
    const timer = document.getElementById('timer');
    if (timer) timer.innerText = time.toString().padStart(2, '0');
    updateMinimap();
}

function updateMinimap() {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 120, 120);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.fillRect(0, 0, 120, 120);
    const centerX = 60, centerZ = 60, scale = 1.0;
    ctx.fillStyle = '#0f0';
    ctx.fillRect(centerX + parkingSpot.x * scale - 2, centerZ + parkingSpot.z * scale - 2, 4, 4);
    ctx.save();
    ctx.translate(centerX + carPhysics.x * scale, centerZ + carPhysics.z * scale);
    ctx.rotate(-carPhysics.angle);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -4, 4, 8);
    ctx.restore();
}

function gameOver(success) {
    isGameOver = true;
    const overlay = document.getElementById('game-overlay');
    const msg = document.getElementById('result-message');
    if (overlay && msg) {
        overlay.classList.remove('hidden');
        msg.innerText = success ? "PARKING SUCCESS!" : "CRASHED!";
        msg.style.color = success ? "#0f0" : "#f00";
    }
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
            camera.alpha -= dx * 0.005; camera.beta -= dy * 0.005;
            lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            camera.radius *= (startDist / dist);
            startDist = dist;
        }
    });
    canvas.addEventListener('touchend', () => isTouching = false);
}
