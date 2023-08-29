import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import "@kitware/vtk.js/Rendering/Profiles/Geometry";

import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkPolyData from "@kitware/vtk.js/Common/DataModel/PolyData";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkXMLPolyDataReader from "@kitware/vtk.js/IO/XML/XMLPolyDataReader";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkHttpDataAccessHelper from "@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper";
import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";

import controlPanel from "./controller.html";
const {
    fetchBinary
} = vtkHttpDataAccessHelper;
// -----------------------------------------------------------
// Global variables
// -----------------------------------------------------------

const BASE_URL = "https://github.com/minilabus/bdp_data/raw/main/";
const BASE_SUBJ = "sub-02_";
const TIME_FILES = [];
for (let i = 1; i <= 11; i++) {
    const paddedNumber = String(i).padStart(2, '0');
    TIME_FILES.push(`${BASE_SUBJ}epo-${paddedNumber}`);
}

const MESH_COLORMAP = {
    0: [255, 255, 255], // WHITE (FFFFFF)
    1: [142, 250, 0], // AG (8EFA00)
    2: [255, 251, 0], // FrOrb (FFFB00)
    3: [1, 25, 196], // FuG (0119C4)
    4: [255, 212, 121], // IFG (FFD479)
    5: [255, 138, 216], // IOG (FF8AD8)
    6: [118, 214, 255], // ITG (76D6FF)
    7: [118, 183, 196], // LG (76B7C4)
    8: [255, 147, 0], // MFG (FF9300)
    9: [255, 64, 255], // MOG (FF40FF)
    10: [0, 150, 255], // MTG (0096FF)
    11: [0, 145, 207], // PHG (0091CF)
    12: [0, 249, 0], // PoCG (00F900)
    13: [255, 38, 0], // PrCG (FF2600)
    14: [148, 17, 0], // SFG (941100)
    15: [212, 251, 121], // SMG (D4FB79)
    16: [148, 55, 255], // SOG (9437FF)
    17: [0, 144, 81], // SPG (009051)
    18: [4, 51, 255], // STG (0433FF)
    19: [0, 113, 255], // TP (0071FF)
    20: [255, 147, 0], // MFG (FF9300) sub
    21: [0, 144, 81], // SPG (009051) sub
    22: [0, 249, 0], // PoCG (00F900) sub
    23: [255, 38, 0], // PrCG (FF2600) sub
};

const TRACTO_COLORMAP = {
    'asso_AGWM_IFGWM': [255, 212, 121],
    'asso_AGWM_ITGWM': [118, 214, 255],
    'asso_AGWM_MFGWM': [255, 147, 0],
    'asso_AGWM_MTGWM': [0, 150, 255],
    'asso_AGWM_PoCGWM': [0, 249, 0],
    'asso_AGWM_PrCGWM': [255, 38, 0],
    'asso_AGWM_SMGWM': [212, 251, 121],
    'asso_AGWM_SPGWM': [0, 144, 81],
    'asso_AGWM_STGWM': [4, 51, 255],
};


var TractographyColored = false;

const isToggled = {
    CorticalToggle: true,
    SubCorticalToggle: true,
    TractographyToggle: true,
    TractographyColorToggle: true,
};

const isTextured = {
    cor_White: true,
    cor_AG: true,
    cor_FrOrb: true,
    cor_FuG: true,
    cor_IFG: true,
    cor_IOG: true,
    cor_ITG: true,
    cor_LG: true,
    cor_MFG: true,
    cor_MOG: true,
    cor_MTG: true,
    cor_PHG: true,
    cor_PoCG: true,
    cor_PrCG: true,
    cor_SFG: true,
    cor_SMG: true,
    cor_SOG: true,
    cor_SPG: true,
    cor_STG: true,
    cor_TP: true,
    AG_MFG: true,
    AG_SPG: true,
    AG_PoCG: true,
    AG_PrCG: true,
};

const isShown = {
    'asso_AGWM_IFGWM': false,
    'asso_AGWM_ITGWM': false,
    'asso_AGWM_MFGWM': false,
    'asso_AGWM_MTGWM': false,
    'asso_AGWM_PoCGWM': false,
    'asso_AGWM_PrCGWM': false,
    'asso_AGWM_SMGWM': false,
    'asso_AGWM_SPGWM': false,
    'asso_AGWM_STGWM': false,
}

const availableTractography = {
    "sub-01_": ["asso_AGWM_IFGWM", "asso_AGWM_MFGWM", "asso_AGWM_PrCGWM",
        "asso_AGWM_PoCGWM", "asso_AGWM_SMGWM", "asso_AGWM_SPGWM",
        "asso_AGWM_MTGWM"
    ],
    "sub-02_": ["asso_AGWM_MFGWM", "asso_AGWM_PoCGWM", "asso_AGWM_SMGWM",
        "asso_AGWM_SPGWM", "asso_AGWM_STGWM", "asso_AGWM_MTGWM",
        "asso_AGWM_ITGWM"
    ]
};

const tractoNames = availableTractography[BASE_SUBJ]
const textureNames = Object.keys(isTextured)
const toggleNames = Object.keys(isToggled)

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const canv = document.createElement("canvas");
canv.id = "loading";

const body = document.body;
const html = document.documentElement;

const height = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
);
const width = Math.max(
    body.scrollWidth,
    body.offsetWidth,
    html.clientWidth,
    html.scrollWidth,
    html.offsetWidth
);
canv.height = height;
canv.width = width;
document.body.appendChild(canv);

const canvas = document.getElementById("loading");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);
var fsize = width / 20;
ctx.font = `bold ${fsize}px Arial`;
ctx.fillStyle = "white";
ctx.textAlign = "center";
ctx.fillText(
    "Downloading, please be patient...",
    canvas.width / 2,
    canvas.height / 2
);

fsize = width / 40;
ctx.font = `${fsize}px Arial`;
ctx.fillStyle = "white";
ctx.textAlign = "center";
ctx.fillText(
    "Will be slow for the first 10-20 seconds, buttons won't work until then.",
    canvas.width / 2,
    canvas.height * 2 / 3
);

// -----------------------------------------------------------
// Data fetcher
// -----------------------------------------------------------

async function getAnnotData(i) {
    const response = await fetch(BASE_URL + TIME_FILES[i] + ".txt");
    const data = await response.text();
    return data.split("\n").map(Number);
}

const annotData = [];
for (var i = 0; i < TIME_FILES.length; i++) {
    let tmpData = await getAnnotData(i);
    const vtkAnnotArray = new Uint8Array(tmpData);
    annotData.push(vtkAnnotArray);
}

function downloadTimeSeries() {
    return Promise.all(
        TIME_FILES.map((filename) =>
            fetchBinary(BASE_URL + filename + ".xml").then((binary) => {
                const reader = vtkXMLPolyDataReader.newInstance();
                reader.parseAsArrayBuffer(binary);
                return reader.getOutputData(0);
            })
        )
    );
}

function downloadTracto() {
    return Promise.all(
        tractoNames.map((filename) =>
            fetchBinary(BASE_URL + BASE_SUBJ + "tracto/" + filename + ".xml").then((binary) => {
                const reader = vtkXMLPolyDataReader.newInstance();
                reader.parseAsArrayBuffer(binary);
                return reader.getOutputData(0);
            })
        )
    );
}

function getDataTimeStep(vtkObj) {
    const arr = vtkObj.getFieldData().getArrayByName("TimeValue");
    if (arr) {
        return arr.getData()[0];
    }
    return null;
}

// Fake first
const binary = await fetchBinary(BASE_URL + BASE_SUBJ + "epo-01.xml");
const reader = vtkXMLPolyDataReader.newInstance();
reader.parseAsArrayBuffer(binary);
var timeSeriesData = [reader.getOutputData(0)];
const arr = timeSeriesData[0].getPointData().getArrayByName("RGB");
var originalMeshColor = [arr.getData()];

var tractoData = [];
var originalTractoColor = [];
downloadTracto().then((downloadedData) => {
    tractoData = downloadedData.filter((ds) => getDataTimeStep(ds) !== null);
    timeSeriesData.sort((a, b) => getDataTimeStep(a) - getDataTimeStep(b));

    timeSeriesData.forEach((ds) => {
        const arr = ds.getPointData().getArrayByName("RGB");
        originalTractoColor.push(arr.getData());
    });
});

// Launch the scene
const surfaceMapper = vtkMapper.newInstance();
surfaceMapper.setInputData(vtkPolyData.newInstance());
const surfaceActor = vtkActor.newInstance();
surfaceActor.getProperty().setInterpolationToPhong();
surfaceActor.getProperty().setAmbient(0.1);
surfaceActor.getProperty().setBackfaceCulling(true);
surfaceActor.setMapper(surfaceMapper);

// Support left and right
var FLIP = 1;
var SHIFT = 0.05;
if (BASE_SUBJ == "sub-02_") {
    var FLIP = -1;
    var SHIFT = 0.01;
}

// Tractography
var tractoMapperList = [];
var tractoActorList = [];
for (var i = 0; i < tractoNames.length; i++) {
    const tractoMapper = vtkMapper.newInstance();
    tractoMapper.setInputData(vtkPolyData.newInstance());
    tractoMapperList.push(tractoMapper);
    const tractoActor = vtkActor.newInstance();
    tractoActor.setMapper(tractoMapper);
    tractoActor.setPosition(0.0, SHIFT * FLIP, 0);
    tractoActorList.push(tractoActor);
}

function uiUpdateSlider(max) {
    const timeslider = document.querySelector("#timeslider");
    timeslider.min = 0;
    timeslider.max = max;
    timeslider.step = 1;
}

function init_scene() {
    uiUpdateSlider(0);
    timeslider.value = 0;

    // set up camera
    renderer.getActiveCamera().setPosition(0.45 * FLIP, 0, 0);
    renderer.getActiveCamera().setViewUp(0, 0, 1);


    setVisibleDataset(timeSeriesData[0]);
    timevalue.innerText = getDataTimeStep(timeSeriesData[0]);

    // Off-center
    surfaceActor.setPosition(0.0, SHIFT * FLIP, 0);
    renderer.addActor(surfaceActor);
    for (var i = 0; i < tractoNames.length; i++) {
        renderer.addActor(tractoActorList[i]);
    }
    renderWindow.render();
}

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
});
document.body.removeChild(canv);

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

global.surfaceMapper = surfaceMapper;
global.surfaceActor = surfaceActor;
global.tractoMapperList = tractoMapperList;
global.tractoActorList = tractoActorList;
global.renderer = renderer;
global.renderWindow = renderWindow;

// UI initialization
fullScreenRenderer.addController(controlPanel);
const timeslider = document.querySelector("#timeslider");
const timevalue = document.querySelector("#timevalue");
const opacityslider = document.querySelector("#opacityslider");
init_scene();

const axes = vtkAnnotatedCubeActor.newInstance();
axes.setDefaultStyle({
    fontStyle: "bold",
    fontFamily: "Arial",
    fontColor: "black",
    fontSizeScale: (res) => res / 2,
    edgeThickness: 0.1,
    edgeColor: "white",
    resolution: 400,
});
axes.setXPlusFaceProperty({
    text: "R",
    faceRotation: 90,
    faceColor: "#FF3357",
});
axes.setXMinusFaceProperty({
    text: "L",
    faceRotation: 270,
    faceColor: "#FF3357",
});
axes.setYPlusFaceProperty({
    text: "A",
    faceRotation: 180,
    faceColor: "#A4BE5C",
});
axes.setYMinusFaceProperty({
    text: "P",
    faceRotation: 0,
    faceColor: "#A4BE5C",
});
axes.setZPlusFaceProperty({
    text: "S",
    faceRotation: 90,
    faceColor: "#3368FF",
});
axes.setZMinusFaceProperty({
    text: "I",
    faceRotation: 90,
    faceColor: "#3368FF",
});

// create orientation widget
const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: renderWindow.getInteractor(),
});
orientationWidget.setEnabled(true);
orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
);
orientationWidget.setViewportSize(0.15);
orientationWidget.setMinPixelSize(100);
orientationWidget.setMaxPixelSize(300);

// Download the remaining data
downloadTimeSeries().then((downloadedData) => {
    timeSeriesData = downloadedData.filter((ds) => getDataTimeStep(ds) !== null);
    timeSeriesData.sort((a, b) => getDataTimeStep(a) - getDataTimeStep(b));

    // var originalMeshColor = []
    timeSeriesData.forEach((ds) => {
        const arr = ds.getPointData().getArrayByName("RGB");
        if (originalMeshColor[0].length != arr.getData().length) {
            originalMeshColor.push(arr.getData());
        }
    });
    uiUpdateSlider(timeSeriesData.length - 1);
});

// -----------------------------------------------------------
// Rendering and visibility
// -----------------------------------------------------------

function setVisibleDataset(ds) {
    const oriColors = originalMeshColor[Number(timeslider.value)];
    const oriAnnot = annotData[Number(timeslider.value)];
    const rgbaArray = new Uint8Array((oriAnnot.length - 1) * 3);

    for (let idx = 0; idx < oriAnnot.length; idx++) {
        const isCurrOn = isTextured[textureNames[oriAnnot[idx]]];
        if (!isCurrOn) {
            rgbaArray[idx * 3] = MESH_COLORMAP[oriAnnot[idx].toString()][0];
            rgbaArray[idx * 3 + 1] = MESH_COLORMAP[oriAnnot[idx].toString()][1];
            rgbaArray[idx * 3 + 2] = MESH_COLORMAP[oriAnnot[idx].toString()][2];
        } else {
            rgbaArray[idx * 3] = oriColors[idx * 3];
            rgbaArray[idx * 3 + 1] = oriColors[idx * 3 + 1];
            rgbaArray[idx * 3 + 2] = oriColors[idx * 3 + 2];
        }
    }
    ds.getPointData().getArrayByName("RGB").setData(rgbaArray);
    setVisibleTractoDataset();
    surfaceActor.getProperty().setOpacity(opacityslider.value / 10.0);
    surfaceMapper.setInputData(ds);
    renderWindow.render();
}

function setVisibleTractoDataset() {
    for (let idx = 0; idx < tractoNames.length; idx++) {
        var curr_name = tractoNames[idx]
        tractoMapperList[idx].setInputData(tractoData[idx]);
        const isCurrOn = isShown[curr_name]
        tractoActorList[idx].setVisibility(isCurrOn)

        tractoMapperList[idx].setScalarVisibility(!TractographyColored);
        tractoActorList[idx].getProperty().setColor(TRACTO_COLORMAP[curr_name][0] / 255,
            TRACTO_COLORMAP[curr_name][1] / 255,
            TRACTO_COLORMAP[curr_name][2] / 255)
    }
    renderWindow.render();
}

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

timeslider.addEventListener("input", (e) => {
    const activeDataset = timeSeriesData[Number(e.target.value)];
    if (activeDataset) {
        setVisibleDataset(activeDataset);
        timevalue.innerText = getDataTimeStep(activeDataset);
    }
});

opacityslider.addEventListener("input", (e) => {
    const activeDataset = timeSeriesData[Number(timeslider.value)];
    setVisibleDataset(activeDataset);
});

toggleNames.forEach((ToggleButton) => {
    document.querySelector(`.${ToggleButton}`).addEventListener("click", (e) => {
        var activeDataset = timeSeriesData[Number(timeslider.value)];
        if (timeSeriesData.length != TIME_FILES.length) {
            return;
        }
        if (ToggleButton == "CorticalToggle") {
            const tag = "cor_";
            const toSet = !toggleNames[ToggleButton];
            toggleNames[ToggleButton] = toSet;

            for (let idx = 0; idx < textureNames.length; idx++) {
                const buttonName = textureNames[idx];
                if (buttonName.slice(0, 4) != tag) {
                    continue;
                }

                isTextured[buttonName] = !toSet;
                document.querySelector(`.${buttonName}`).checked = toSet;
            }
        }

        if (ToggleButton == "SubCorticalToggle") {
            const tag = "AG_";
            const toSet = !toggleNames[ToggleButton];
            toggleNames[ToggleButton] = toSet;

            for (let idx = 0; idx < textureNames.length; idx++) {
                const buttonName = textureNames[idx];
                if (buttonName.slice(0, 3) != tag) {
                    continue;
                }

                isTextured[buttonName] = !toSet;
                document.querySelector(`.${buttonName}`).checked = toSet;
            }
        }

        if (ToggleButton == "TractographyToggle") {
            const tag = "asso_";
            const toSet = toggleNames[ToggleButton];
            toggleNames[ToggleButton] = !toSet;

            for (let idx = 0; idx < tractoNames.length; idx++) {
                const buttonName = tractoNames[idx];
                if (buttonName.slice(0, 5) != tag) {
                    continue;
                }

                isShown[buttonName] = !toSet;
                document.querySelector(`.${buttonName}`).checked = !toSet;
            }
        }

        if (ToggleButton == "TractographyColorToggle") {
            TractographyColored = !TractographyColored;
        }

        // Reset Rendering
        if (timeslider.value == 0) {
            activeDataset = timeSeriesData[1];
        } else {
            activeDataset = timeSeriesData[Number(timeslider.value) - 1];
        }
        setVisibleDataset(activeDataset);
        activeDataset = timeSeriesData[Number(timeslider.value)];
        setVisibleDataset(activeDataset);
    });
});

const representationSelector = document.querySelector(".representations");
representationSelector.addEventListener("change", (e) => {
    const newRepValue = Number(e.target.value);
    const allTables = document.getElementsByTagName("table");

    allTables[1].style.display = "none";
    allTables[2].style.display = "none";
    allTables[3].style.display = "none";
    allTables[newRepValue].style.display = "";
});

textureNames.forEach((propertyName) => {
    document.querySelector(`.${propertyName}`).addEventListener("input", (e) => {
        if (timeSeriesData.length != TIME_FILES.length) {
            document.querySelector(`.${propertyName}`).checked = false;
            return;
        }
        var activeDataset = timeSeriesData[Number(timeslider.value)];

        // Reset Rendering
        if (timeslider.value == 0) {
            activeDataset = timeSeriesData[1];
        } else {
            activeDataset = timeSeriesData[Number(timeslider.value) - 1];
        }
        setVisibleDataset(activeDataset);
        activeDataset = timeSeriesData[Number(timeslider.value)];

        isTextured[propertyName] = !e.target.checked;
        if (activeDataset) {
            setVisibleDataset(activeDataset);
        }
    });
});

tractoNames.forEach((propertyName) => {
    document.querySelector(`.${propertyName}`).addEventListener("input", (e) => {
        if (timeSeriesData.length != TIME_FILES.length) {
            document.querySelector(`.${propertyName}`).checked = false;
            return;
        }
        isShown[propertyName] = e.target.checked;
        setVisibleTractoDataset();
    });
});

// ----------------------------------------------------------------------------
// Gray out buttons if not related to the current BASE_SUBJ
// ----------------------------------------------------------------------------

Object.keys(isShown).forEach((propertyName) => {
    if (!tractoNames.includes(propertyName)) {
        const buttonElement = document.querySelector(`.${propertyName}`);
        buttonElement.setAttribute("disabled", "disabled");
        buttonElement.style.color = "lightgray";

        // Navigate up to closest <tr> and then find the first <td> within it
        const parentTr = buttonElement.closest('tr');
        const firstTd = parentTr ? parentTr.querySelector('td:first-child') : null;

        if (firstTd) {
            firstTd.style.color = "lightgray"; // Gray out the td text
        }
    } else {
        const buttonElement = document.querySelector(`.${propertyName}`);
        buttonElement.removeAttribute("disabled");
    }
});