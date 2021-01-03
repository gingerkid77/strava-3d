// A basic project to Load a GPX file and visualise it as a line in 3D space using three.js
// Using the following for inspiration
//
// https://www.reddit.com/r/threejs/comments/fwkl8t/trying_to_render_model_from_gps_coordinates/
// https://github.com/supromikali/react-three-demo/tree/master/
// 


import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import './index.css';

const style = {
  height: 500 // we can control scene size by setting container dimensions
};

class App extends Component {

  state = {
    gpxData: {
      isValid: false
    }
  }

  constructor(props) {
    super(props);
    this.gpxData = {
      isValid: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    return { gpxData: props.gpxData };
  }

  // Called whenever the state changes. In this case when the GPS data is changed
  componentDidUpdate() {
    this.demolishScene();
    this.buildScene();
  }

  // called by React when the component is mounted
  componentDidMount() {
    this.demolishScene();
    this.buildScene();
  }

  // Called when the component is unmounted
  componentWillUnmount() {
    this.demolishScene();
  }

  demolishScene() {
    // If we have a requestID the scene has previously been built
    if (this.requestID != null) {
      window.removeEventListener('resize', this.handleWindowResize);
      window.cancelAnimationFrame(this.requestID);
      this.controls.dispose();
      this.scene = null;
      this.projector = null;
      this.camera = null;
      this.controls = null;
      // This is important to remove the three js elements
      while (this.mount.lastChild) this.mount.removeChild(this.mount.lastChild);
    }
  }

  buildScene() {
    this.sceneSetup();
    if (this.state.gpxData && this.state.gpxData.isValid) this.drawMapFromGPSData();
    this.addCustomSceneObjects();
    this.startAnimationLoop();
    window.addEventListener('resize', this.handleWindowResize);
  }

  // Standard scene setup in Three.js. Check "Creating a scene" manual for more information
  // https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
  sceneSetup = () => {
    // get container dimensions and use them for scene sizing
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, // fov = field of view
      width / height, // aspect ratio
      0.1, // near plane
      100000 // far plane
    );
    this.camera.position.z = 9; // is used here to set some distance from a cube that is located at z = 0
    // OrbitControls allow a camera to orbit around the object
    // https://threejs.org/docs/#examples/controls/OrbitControls
    this.controls = new OrbitControls(this.camera, this.mount);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    this.mount.appendChild(this.renderer.domElement); // mount using React ref
  };

  drawMapFromGPSData = () => {
    //create a blue LineBasicMaterial
    var material = new THREE.LineBasicMaterial({
      color: 0xfff836
    });

    // find centre lat / lon
    var minLat = null;
    var maxLat = null;
    var minLon = null;
    var maxLon = null;
    var minEle = null;
    var maxEle = null;

    var i = 0;
    var p = 0;
    let segment;

    // loop the segments
    for (i = 0; i < this.state.gpxData.segments.length; i++) {

      segment = this.state.gpxData.segments[i];

      // loop the track points
      for (p = 0; p < segment.length; p++) {

        //console.log(segment[p]['loc']);

        if (minLat == null || segment[p]['loc'][0] < minLat) minLat = segment[p]['loc'][0];
        if (maxLat == null || segment[p]['loc'][0] > maxLat) maxLat = segment[p]['loc'][0];


        if (minLon == null || segment[p]['loc'][1] < minLon) minLon = segment[p]['loc'][1];
        if (maxLon == null || segment[p]['loc'][1] > maxLon) maxLon = segment[p]['loc'][1];

        if (minEle == null || segment[p]['ele'] < minEle) minEle = segment[p]['ele'];
        if (maxEle == null || segment[p]['ele'] > maxEle) maxEle = segment[p]['ele'];

      }
    }

    //offset to center
    var offsetX = maxLat - ((maxLat - minLat) / 2);
    var offsetY = maxLon - ((maxLon - minLon) / 2);

    // geometry with verticals
    var points = [];

    for (i = 0; i < this.state.gpxData.segments.length; i++) {

      segment = this.state.gpxData.segments[i];

      // loop the track points
      for (p = 0; p < segment.length; p++) {

        var x = (segment[p]['loc'][0]) - offsetX;
        var z = (segment[p]['loc'][1]) - offsetY;
        var y = (segment[p]['ele'] - minEle) / 5000;

        points.push(new THREE.Vector3(x, y, z));
      }
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);

    // put points together
    var line = new THREE.Line(geometry, material);

    var scaleFactor = 100;
    line.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // render
    this.scene.add(line);
  }


  // Here should come custom code.
  // Code below is taken from Three.js BoxGeometry example
  // https://threejs.org/docs/#api/en/geometries/BoxGeometry
  addCustomSceneObjects = () => {

    const lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xcccccc, 1, 0);
    lights[2] = new THREE.PointLight(0xaaaaaa, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set(- 100, - 200, - 100);

    this.scene.add(lights[0]);
    this.scene.add(lights[1]);
    this.scene.add(lights[2]);
  };

  startAnimationLoop = () => {

    this.renderer.render(this.scene, this.camera);

    // The window.requestAnimationFrame() method tells the browser that you wish to perform
    // an animation and requests that the browser call a specified function
    // to update an animation before the next repaint
    // This is required for the camera controls to work and redraw the scene
    this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
  };

  handleWindowResize = () => {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;

    // Note that after making changes to most of camera properties you have to call
    // .updateProjectionMatrix for the changes to take effect.
    this.camera.updateProjectionMatrix();
  };

  render() {
    console.log('app render called');
    return <div style={style} ref={ref => (this.mount = ref)} />;
  }
}

class Container extends React.Component {
  state = {
    isMounted: true,
    dataSize: 0,
    routeData: {
      isValid: false,
      segments: []
    },
    gpxData: ''
  };

  constructor(props) {
    super(props)

    this.upload = this.upload.bind(this);
    this.openFile = this.openFile.bind(this);
  }

  upload() {
    this.dofileUpload.click()
  }

  /**
   * Process the file within the React app. We're NOT uploading it to the server!
   */
  openFile(evt) {
    const fileObj = evt.target.files[0];
    const reader = new FileReader();

    let fileloaded = e => {
      // e.target.result is the file's content as text
      const fileContents = e.target.result;

      this.setState(
        {
          dataSize: fileContents.length,
          routeData: this.getGPSDataFromGPX(fileContents)
        }
      );
    }

    // Mainline of the method
    fileloaded = fileloaded.bind(this);
    reader.onload = fileloaded;
    reader.readAsText(fileObj);
  }

  render() {
    const { isMounted = true } = this.state;
    return (
      <>
        <button onClick={() => this.setState(state => ({ isMounted: !state.isMounted }))}>
          {isMounted ? "Unmount" : "Mount"}
        </button>
        {isMounted && <App gpxData={this.state.routeData} />}
        {isMounted && <div>Scroll to zoom, drag to rotate</div>}

        <input type="file" className="hidden"
          multiple={false}
          accept=".gpx,text/xml"
          onChange={evt => this.openFile(evt)}
          ref={e => this.dofileUpload = e}
        />

        <p>Data size: {this.state.dataSize.length}</p>
        <p>Processing result: {this.state.gpxData.error}</p>
      </>
    )
  }

  getGPSDataFromGPX = (xmlData) => {
    var data = {
      isValid: false,
      error: '',
      segments: []
    };

    var xmlDoc = new DOMParser().parseFromString(xmlData, 'text/xml');

    if (xmlDoc.nodeName === 'parsererror') {
      data.error = xmlDoc.data;
    } else {
      data.segments = this.get_gpx_data(xmlDoc).segments;
      data.isValid = (data.segments.length > 0);
    }

    return data;
  }

  get_gpx_data = (node, result) => {
    if (!result)
      result = { segments: [] };

    switch (node.nodeName) {
      case "trkseg":
        var segment = [];
        result.segments.push(segment)
        for (var i = 0; i < node.childNodes.length; i++) {
          var snode = node.childNodes[i];
          if (snode.nodeName === "trkpt") {
            var trkpt = { loc: [parseFloat(snode.attributes["lat"].value), parseFloat(snode.attributes["lon"].value)] };
            for (var j = 0; j < snode.childNodes.length; j++) {
              var ssnode = snode.childNodes[j];
              switch (ssnode.nodeName) {
                case "time":
                  trkpt.time = new Date(ssnode.childNodes[0].data);
                  break;
                case "ele":
                  trkpt.ele = parseFloat(ssnode.childNodes[0].data);
                  break;
                default:
                  break;
              }
            }
            segment.push(trkpt)
          }
        }
        break;
      default:
        break;
    }

    for (var x = 0; x < node.childNodes.length; x++) {
      this.get_gpx_data(node.childNodes[x], result);
    }

    return result;
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Container />, rootElement);

