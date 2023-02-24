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

const mapper = vtkMapper.newInstance();
mapper.setInputData(vtkPolyData.newInstance());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Download a series of VTP files in a time series, sort them by time, and
// then display them in a playback series.
// ----------------------------------------------------------------------------

const BASE_URL = 'https://github.com/minilabus/bdp_data/raw/main/'
const TIME_FILES = ['sub-01_epo-01', 'sub-01_epo-02']
const COLORMAP = {
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
};

const isToggled = {
  'CorticalToggle': true,
  'SubCorticalToggle': true,
  'TractographyToggle': true
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
}
const textureNames = Object.keys(isTextured)
const toggleNames = Object.keys(isToggled)

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

function getDataTimeStep(vtkObj) {
  const arr = vtkObj.getFieldData().getArrayByName('TimeValue');
  if (arr) {
    return arr.getData()[0];
  }
  return null;
}

function setVisibleDataset(ds) {
  const oriColors = originalColor[Number(timeslider.value)]
  const oriAnnot = annotData[Number(timeslider.value)]
  const rgbaArray = new Uint8Array((oriAnnot.length - 1) * 3);

  for (let idx = 0; idx < oriAnnot.length; idx++) {
    const isCurrOn = isTextured[textureNames[oriAnnot[idx]]]
    if (!isCurrOn) {
      rgbaArray[(idx * 3)] = COLORMAP[oriAnnot[idx].toString()][0];
      rgbaArray[(idx * 3) + 1] = COLORMAP[oriAnnot[idx].toString()][1];
      rgbaArray[(idx * 3) + 2] = COLORMAP[oriAnnot[idx].toString()][2];
    }
    else {
      rgbaArray[(idx * 3)] = oriColors[(idx * 3)];
      rgbaArray[(idx * 3) + 1] = oriColors[(idx * 3) + 1];
      rgbaArray[(idx * 3) + 2] = oriColors[(idx * 3) + 2];
    }
  }
  ds.getPointData().getArrayByName('RGB').setData(rgbaArray)
  mapper.setInputData(ds);
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

const timeslider = document.querySelector('#timeslider');
const timevalue = document.querySelector('#timevalue');

timeslider.addEventListener('input', (e) => {
  const activeDataset = timeSeriesData[Number(e.target.value)];
  if (activeDataset) {
    setVisibleDataset(activeDataset);
    timevalue.innerText = getDataTimeStep(activeDataset);
  }
});

toggleNames.forEach((ToggleButton) => {
  document.querySelector(`.${ToggleButton}`).addEventListener('click', (e) => {
    var activeDataset = timeSeriesData[Number(timeslider.value)];
    
    const toSet = !toggleNames[ToggleButton]
    toggleNames[ToggleButton] = toSet
    var tag = ""
    if (ToggleButton == 'CorticalToggle') {tag = 'cor_'};
    if (ToggleButton == 'SubCorticalToggle') {tag = 'sub_'};
    if (ToggleButton == 'TractographyToggle') {tag = 'tra_'};
    console.log(tag)
    for (let idx = 0; idx < textureNames.length; idx++) {
      const buttonName = textureNames[idx]
      if (buttonName.slice(0, 4) != tag) {continue}

      isTextured[buttonName] = !toSet
      document.querySelector(`.${buttonName}`).checked = toSet
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

var originalColor = []
downloadTimeSeries().then((downloadedData) => {
  timeSeriesData = downloadedData.filter((ds) => getDataTimeStep(ds) !== null);
  timeSeriesData.sort((a, b) => getDataTimeStep(a) - getDataTimeStep(b));

  timeSeriesData.forEach((ds) => {
    const arr = ds.getPointData().getArrayByName('RGB');
    originalColor.push(arr.getData())
  });
  uiUpdateSlider(timeSeriesData.length);
  timeslider.value = 0;

  // set up camera
  renderer.getActiveCamera().setPosition(0.40, -0., 0.)
  renderer.getActiveCamera().setViewUp(0.1, 0.3, 1.)

  setVisibleDataset(timeSeriesData[0]);
  timevalue.innerText = getDataTimeStep(timeSeriesData[0]);
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;