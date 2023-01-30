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

const COLORMAP = [
  [1, 1, 1, 1],
  [0.19215686, 0.50980392, 0.74117647, 1.],
  [0.41960784, 0.68235294, 0.83921569, 1.],
  [0.61960784, 0.79215686, 0.88235294, 1.],
  [0.77647059, 0.85882353, 0.9372549, 1.],
  [0.90196078, 0.33333333, 0.05098039, 1.],
  [0.99215686, 0.55294118, 0.23529412, 1.],
  [0.99215686, 0.68235294, 0.41960784, 1.],
  [0.99215686, 0.81568627, 0.63529412, 1.],
  [0.19215686, 0.63921569, 0.32941176, 1.],
  [0.45490196, 0.76862745, 0.4627451, 1.],
  [0.63137255, 0.85098039, 0.60784314, 1.],
  [0.78039216, 0.91372549, 0.75294118, 1.],
  [0.45882353, 0.41960784, 0.69411765, 1.],
  [0.61960784, 0.60392157, 0.78431373, 1.],
  [0.7372549, 0.74117647, 0.8627451, 1.],
  [0.85490196, 0.85490196, 0.92156863, 1.],
  [0.38823529, 0.38823529, 0.38823529, 1.],
  [0.58823529, 0.58823529, 0.58823529, 1.],
  [0.74117647, 0.74117647, 0.74117647, 1.],
  [0.85098039, 0.85098039, 0.85098039, 1.]]

console.log(COLORMAP.length)

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



function setVisibleDataset(ds, id) {
  if (!isTextured) {
    console.log('not textured')
    // console.log(annotData[Number(timeslider.value)])
    // console.log(originalColor[Number(timeslider.value)])

    const oriAnnot = annotData[Number(timeslider.value)]
    const rgbaArray = new Uint8Array((oriAnnot.length - 1) * 3);
    // LUT = vtk.vtkLookupTable()
    // LUT.SetTableRange(255)
    for (let idx = 0; idx < oriAnnot.length; idx++) {

      // console.log(idx, oriAnnot[idx], c)
      // console.log(currColor)
      rgbaArray[(idx * 3)] = 255 * COLORMAP[oriAnnot[idx]][0];
      rgbaArray[(idx * 3) + 1] = 255 * COLORMAP[oriAnnot[idx]][1];
      rgbaArray[(idx * 3) + 2] = 255 * COLORMAP[oriAnnot[idx]][2];
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
  renderer.getActiveCamera().setPosition(0.40, -0., 0.)
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