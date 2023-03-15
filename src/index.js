import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';


import controlPanel from './controller.html';

const { fetchBinary } = vtkHttpDataAccessHelper;


const BASE_URL = 'https://github.com/minilabus/bdp_data/raw/main/'
const TIME_FILES = ['sub-01_epo-01', 'sub-01_epo-02', 'sub-01_epo-03',
                    'sub-01_epo-04', 'sub-01_epo-05', 'sub-01_epo-06']
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
  0: [255, 212, 121], // IFG (FFD479)
  1: [255, 147, 0], // MFG (FF9300)
  2: [148, 17, 0], // SFG (941100)
  3: [255, 38, 0], // PrCG (FF2600)
  4: [118, 214, 255], // ITG (76D6FF)
  5: [0, 150, 255], // MTG (0096FF)
  6: [4, 51, 255], // STG (0433FF)
  7: [0, 144, 81], // SPG (009051)
  8: [212, 251, 121], // SMG (D4FB79)
  9: [0, 249, 0], // PoCG (00F900)
};
var TractographyColored = false;

// location.reload(true);
const isToggled = {
  'CorticalToggle': true,
  'SubCorticalToggle': true,
  'TractographyToggle': true,
  'TractographyColorToggle': true
}

const isTextured = {
  'cor_White': true,
  'cor_AG': true,
  'cor_FrOrb': true,
  'cor_FuG': true,
  'cor_IFG': true,
  'cor_IOG': true,
  'cor_ITG': true,
  'cor_LG': true,
  'cor_MFG': true,
  'cor_MOG': true,
  'cor_MTG': true,
  'cor_PHG': true,
  'cor_PoCG': true,
  'cor_PrCG': true,
  'cor_SFG': true,
  'cor_SMG': true,
  'cor_SOG': true,
  'cor_SPG': true,
  'cor_STG': true,
  'cor_TP': true,
  'AG_MFG': true,
  'AG_SPG': true,
  'AG_PoCG': true,
  'AG_PrCG': true,
}

const isShown = {
  'asso_dorsal_AGWM_IFGWM_R': false,
  'asso_dorsal_AGWM_MFGWM_R': false,
  'asso_ventral_AGWM_SFGWM_R': false,
  'asso_dorsal_AGWM_PrCGWM_R': false,
  'asso_short_AGWM_ITGWM_R': false,
  'asso_short_AGWM_MTGWM_R': false,
  'asso_short_AGWM_STGWM_R': false,
  'asso_short_AGWM_SPGWM_R': false,
  'asso_short_AGWM_SMGWM_R': false,
  'asso_short_AGWM_PoCG_R': false
}
const tractoNames = Object.keys(isShown)
const textureNames = Object.keys(isTextured)
const toggleNames = Object.keys(isToggled)

// document.getElementById("yourSubTableId").display = "";  //Show the table
// document.getElementById("yourSubTableId").display = "none";  //Hide the table
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// Surface
const surfaceMapper = vtkMapper.newInstance();
surfaceMapper.setInputData(vtkPolyData.newInstance());
const surfaceActor = vtkActor.newInstance();
surfaceActor.getProperty().setInterpolationToPhong()
// surfaceActor.getProperty().setSpecular(0.2)
surfaceActor.getProperty().setAmbient(0.1)
surfaceActor.getProperty().setBackfaceCulling(true)
surfaceActor.setMapper(surfaceMapper);

// Tractography
var tractoMapperList = []
var tractoActorList = []
for (var i = 0; i < tractoNames.length; i++) {
  const tractoMapper = vtkMapper.newInstance();
  tractoMapper.setInputData(vtkPolyData.newInstance());
  tractoMapperList.push(tractoMapper)
  const tractoActor = vtkActor.newInstance();
  tractoActor.setMapper(tractoMapper);
  tractoActorList.push(tractoActor)
}

renderer.addActor(surfaceActor);
for (var i = 0; i < tractoNames.length; i++) {
  renderer.addActor(tractoActorList[i]);
}
renderer.resetCamera();
renderWindow.render();
// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Download a series of VTP files in a time series, sort them by time, and
// then display them in a playback series.
// ----------------------------------------------------------------------------


async function getAnnotData(i) {
  const response = await fetch(BASE_URL + TIME_FILES[i] + '.txt')
  const data = await response.text()
  return data.split('\n').map(Number)
}

const annotData = []
for (var i = 0; i < TIME_FILES.length; i++) {
  let tmpData = await getAnnotData(i)
  const vtkAnnotArray = new Uint8Array(tmpData)
  annotData.push(vtkAnnotArray)
}

function downloadTimeSeries() {
  return Promise.all(
    TIME_FILES.map((filename) =>
      fetchBinary(BASE_URL + filename + '.xml').then((binary) => {
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
      fetchBinary(BASE_URL + 'tracto/' + filename + '.xml').then((binary) => {
        const reader = vtkXMLPolyDataReader.newInstance();
        reader.parseAsArrayBuffer(binary);
        return reader.getOutputData(0);
      })
    )
  );
}

function getDataTimeStep(vtkObj) {
  const arr = vtkObj.getFieldData().getArrayByName('TimeValue');
  if (arr) {
    return arr.getData()[0];
  }
  return null;
}

function setVisibleDataset(ds) {
  const oriColors = originalMeshColor[Number(timeslider.value)]
  const oriAnnot = annotData[Number(timeslider.value)]
  const rgbaArray = new Uint8Array((oriAnnot.length - 1) * 3);

  for (let idx = 0; idx < oriAnnot.length; idx++) {
    const isCurrOn = isTextured[textureNames[oriAnnot[idx]]]
    if (!isCurrOn) {
      rgbaArray[(idx * 3)] = MESH_COLORMAP[oriAnnot[idx].toString()][0];
      rgbaArray[(idx * 3) + 1] = MESH_COLORMAP[oriAnnot[idx].toString()][1];
      rgbaArray[(idx * 3) + 2] = MESH_COLORMAP[oriAnnot[idx].toString()][2];
    }
    else {
      rgbaArray[(idx * 3)] = oriColors[(idx * 3)];
      rgbaArray[(idx * 3) + 1] = oriColors[(idx * 3) + 1];
      rgbaArray[(idx * 3) + 2] = oriColors[(idx * 3) + 2];
    }
  }
  ds.getPointData().getArrayByName('RGB').setData(rgbaArray)
  setVisibleTractoDataset()
  surfaceActor.getProperty().setOpacity(opacityslider.value / 10.0);
  surfaceMapper.setInputData(ds);
  renderWindow.render();
}

function setVisibleTractoDataset() {
  for (let idx = 0; idx < tractoNames.length; idx++) {
    tractoMapperList[idx].setInputData(tractoData[idx]);
    const isCurrOn = isShown[tractoNames[idx]]
    tractoActorList[idx].setVisibility(isCurrOn)

    tractoMapperList[idx].setScalarVisibility(!TractographyColored);
    tractoActorList[idx].getProperty().setColor(TRACTO_COLORMAP[idx][0] / 255,
      TRACTO_COLORMAP[idx][1] / 255,
      TRACTO_COLORMAP[idx][2] / 255)

    // console.log(isCurrOn)
    // if (isCurrOn) {
    //   tractoActorList[idx].setVisibility(1)
    // }
    // else {
    //   tractoActorList[idx].setVisibility(0)
    // }
  }
  renderWindow.render();
}

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

function uiUpdateSlider(max) {
  const timeslider = document.querySelector('#timeslider');
  timeslider.min = 0;
  timeslider.max = max - 1;
  timeslider.step = 1;
}

// -----------------------------------------------------------
// example code logic
// -----------------------------------------------------------

let timeSeriesData = [];
let tractoData = [];

const timeslider = document.querySelector('#timeslider');
const timevalue = document.querySelector('#timevalue');
const opacityslider = document.querySelector('#opacityslider');

timeslider.addEventListener('input', (e) => {
  const activeDataset = timeSeriesData[Number(e.target.value)];
  if (activeDataset) {
    setVisibleDataset(activeDataset);
    timevalue.innerText = getDataTimeStep(activeDataset);
  }
});

opacityslider.addEventListener('input', (e) => {
  const activeDataset = timeSeriesData[Number(timeslider.value)]
  setVisibleDataset(activeDataset)
});

toggleNames.forEach((ToggleButton) => {
  document.querySelector(`.${ToggleButton}`).addEventListener('click', (e) => {
    var activeDataset = timeSeriesData[Number(timeslider.value)];
    
    if (ToggleButton == 'CorticalToggle') {
      const tag = 'cor_'
      const toSet = !toggleNames[ToggleButton]
      toggleNames[ToggleButton] = toSet

      for (let idx = 0; idx < textureNames.length; idx++) {
        const buttonName = textureNames[idx]
        if (buttonName.slice(0, 4) != tag) {continue}
  
        isTextured[buttonName] = !toSet
        document.querySelector(`.${buttonName}`).checked = toSet
      };
    };

    if (ToggleButton == 'SubCorticalToggle')  {
      const tag = 'AG_'
      const toSet = !toggleNames[ToggleButton]
      toggleNames[ToggleButton] = toSet

      for (let idx = 0; idx < textureNames.length; idx++) {
        const buttonName = textureNames[idx]
        if (buttonName.slice(0, 3) != tag) {continue}
  
        isTextured[buttonName] = !toSet
        document.querySelector(`.${buttonName}`).checked = toSet
      };
    };
    
    if (ToggleButton == 'TractographyToggle') {
      const tag = 'asso_'
      const toSet = toggleNames[ToggleButton]
      toggleNames[ToggleButton] = !toSet

      for (let idx = 0; idx < tractoNames.length; idx++) {
        const buttonName = tractoNames[idx]
        if (buttonName.slice(0, 5) != tag) {continue}
  
        isShown[buttonName] = !toSet
        document.querySelector(`.${buttonName}`).checked = !toSet
      }
    };

    if (ToggleButton == 'TractographyColorToggle') {
      TractographyColored = !TractographyColored
    };

    // Reset Rendering
    if (timeslider.value == 0) {activeDataset = timeSeriesData[1]}
    else {activeDataset = timeSeriesData[Number(timeslider.value) - 1]}
    setVisibleDataset(activeDataset);
    activeDataset = timeSeriesData[Number(timeslider.value)]
    setVisibleDataset(activeDataset);
  })
  
});

const representationSelector = document.querySelector('.representations');
representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  const allTables = document.getElementsByTagName("table")

  allTables[1].style.display = "none"
  allTables[2].style.display = "none"
  allTables[3].style.display = "none"
  allTables[newRepValue].style.display = ""
});

textureNames.forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    var activeDataset = timeSeriesData[Number(timeslider.value)];

    // Reset Rendering
    if (timeslider.value == 0) {activeDataset = timeSeriesData[1]}
    else {activeDataset = timeSeriesData[Number(timeslider.value) - 1]}
    setVisibleDataset(activeDataset);
    activeDataset = timeSeriesData[Number(timeslider.value)]
    
    isTextured[propertyName] = !e.target.checked;
    if (activeDataset) {
      setVisibleDataset(activeDataset);
    }
  });
});

tractoNames.forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    isShown[propertyName] = e.target.checked;
    setVisibleTractoDataset()
  });
});

var originalMeshColor = []
downloadTimeSeries().then((downloadedData) => {
  timeSeriesData = downloadedData.filter((ds) => getDataTimeStep(ds) !== null);
  timeSeriesData.sort((a, b) => getDataTimeStep(a) - getDataTimeStep(b));

  timeSeriesData.forEach((ds) => {
    const arr = ds.getPointData().getArrayByName('RGB');
    originalMeshColor.push(arr.getData())
  });

  uiUpdateSlider(timeSeriesData.length);
  timeslider.value = 0;

  // set up camera
  renderer.getActiveCamera().setPosition(0.40, -0., 0.)
  renderer.getActiveCamera().setViewUp(0.1, 0.3, 1.)

  setVisibleDataset(timeSeriesData[0]);
  timevalue.innerText = getDataTimeStep(timeSeriesData[0]);
});

var originalTractoColor = []
downloadTracto().then((downloadedData) => {
  tractoData = downloadedData.filter((ds) => getDataTimeStep(ds) !== null);
  timeSeriesData.sort((a, b) => getDataTimeStep(a) - getDataTimeStep(b));

  timeSeriesData.forEach((ds) => {
    const arr = ds.getPointData().getArrayByName('RGB');
    originalTractoColor.push(arr.getData())
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.surfaceMapper = surfaceMapper;
global.surfaceActor = surfaceActor;
global.tractoMapperList = tractoMapperList;
global.tractoActorList = tractoActorList;
global.renderer = renderer;
global.renderWindow = renderWindow;