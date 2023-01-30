import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkScalarToRGBA from '@kitware/vtk.js/Common/Core/ScalarsToColors';
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';

// const cors = require('cors');
// const express = require('express');
// let app = express();
// app.use(cors());
// app.options('*', cors());

import controlPanel from './controller.html';

const { fetchBinary } = vtkHttpDataAccessHelper;

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
var isTextured = true
// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Download a series of VTP files in a time series, sort them by time, and
// then display them in a playback series.
// ----------------------------------------------------------------------------

const BASE_URL = 'https://github.com/minilabus/bdp_data/raw/main/'
// const TIME_FILES = ['sub-01_epo-01.xml', 'sub-01_epo-02.xml', 'sub-01_epo-03.xml',
//                     'sub-01_epo-04.xml', 'sub-01_epo-05.xml', 'sub-01_epo-06.xml',
//                     'sub-01_epo-07.xml', 'sub-01_epo-08.xml', 'sub-01_epo-09.xml',
//                     'sub-01_epo-10.xml', 'sub-01_epo-11.xml']
const TIME_FILES = ['sub-01_epo-01', 'sub-01_epo-02']

async function getData(i) {
  const response = await fetch(BASE_URL+TIME_FILES[i]+'.txt')
  const data = await response.text()
  return data.split('\n').map(Number)
}

const annotData = []
for(var i = 0; i < TIME_FILES.length; i++){
  let tmpData = await getData(i)
  const vtkAnnotArray = new Uint8Array(tmpData)
  annotData.push(vtkAnnotArray)
}

function downloadTimeSeries() {
  return Promise.all(
    TIME_FILES.map((filename) =>
      fetchBinary(BASE_URL+filename+'.xml').then((binary) => {
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

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rainbow(numOfSteps, step) {
  // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
  // Adam Cole, 2011-Sept-14
  // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
  var r, g, b;
  var h = step / numOfSteps;
  var i = ~~(h * 6);
  var f = h * 6 - i;
  var q = 1 - f;
  switch(i % 6){
      case 0: r = 1; g = f; b = 0; break;
      case 1: r = q; g = 1; b = 0; break;
      case 2: r = 0; g = 1; b = f; break;
      case 3: r = 0; g = q; b = 1; break;
      case 4: r = f; g = 0; b = 1; break;
      case 5: r = 1; g = 0; b = q; break;
  }
  var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
  return hexToRgb(c);
}

function setVisibleDataset(ds, id) {
  if (! isTextured) {
    console.log('not textured')
    // console.log(annotData[Number(timeslider.value)])
    // console.log(originalColor[Number(timeslider.value)])

    const oriAnnot = annotData[Number(timeslider.value)]
    const rgbaArray = new Uint8Array((oriAnnot.length-1) * 3);
    // LUT = vtk.vtkLookupTable()
    // LUT.SetTableRange(255)
    for (let idx = 0; idx < oriAnnot.length; idx++) {
      var currColor = rainbow(255, oriAnnot[idx])
      // console.log(idx, oriAnnot[idx], c)
      rgbaArray[(oriAnnot.length*0)+idx] = 255 * currColor['r'];
      rgbaArray[(oriAnnot.length*1)+idx] = 255 * currColor['g'];
      rgbaArray[(oriAnnot.length*2)+idx] = 255 * currColor['b'];
    }
    ds.getPointData().getArrayByName('RGB').setData(rgbaArray)
    // console.log(oriColors)
    // console.log(rgbaArray)
    // ds.getPointData().getArrayByName('RGB').setData(rgbaArray);
    // console.log(ds.getPointData().getArrayByName('RGB').getData())
  }
  else {
    const oriColors = originalColor[Number(timeslider.value)]
    ds.getPointData().getArrayByName('RGB').setData(oriColors)
    console.log('textured')
  }

  
  mapper.setInputData(ds);
  renderer.resetCamera();
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

[
  'Color',
].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    isTextured = !isTextured
    console.log(isTextured);
    const activeDataset = timeSeriesData[Number(timeslider.value)];
    if (activeDataset) {
      setVisibleDataset(activeDataset, Number(timeslider.value));
      timevalue.innerText = getDataTimeStep(activeDataset);
    }
    renderWindow.render();
  });
});

// -----------------------------------------------------------
// example code logic
// -----------------------------------------------------------

let timeSeriesData = [];

const timeslider = document.querySelector('#timeslider');
const timevalue = document.querySelector('#timevalue');

timeslider.addEventListener('input', (e) => {
  const activeDataset = timeSeriesData[Number(e.target.value)];
  if (activeDataset) {
    setVisibleDataset(activeDataset, Number(e.target.value));
    timevalue.innerText = getDataTimeStep(activeDataset);
  }
});

console.log('===============================')

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
  renderer.getActiveCamera().setPosition(0.40, 0., 0.)
  renderer.getActiveCamera().setViewUp(0.1, 0.3, 1.)

  setVisibleDataset(timeSeriesData[0], 0);
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