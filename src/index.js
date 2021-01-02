import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import './index.css';

const style = {
    height: 1000 // we can control scene size by setting container dimensions
};

class App extends Component {
    componentDidMount() {
        this.sceneSetup();
        this.drawMapFromGPSData();
        this.addCustomSceneObjects();
        this.startAnimationLoop();
        window.addEventListener('resize', this.handleWindowResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
        window.cancelAnimationFrame(this.requestID);
        this.controls.dispose();
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
        this.controls = new OrbitControls( this.camera, this.mount );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( width, height );
        this.mount.appendChild( this.renderer.domElement ); // mount using React ref
    };

    drawMapFromGPSData = () => {

      //create a blue LineBasicMaterial
      var material = new THREE.LineBasicMaterial({
        color: 0xfff836
      });

      var gpsDataFromStrava = getGPSDataFromGPX();

      // find centre lat / lon
      // Default to the first point in the dataset
      // var minLat = gpsData[0][0];
      // var maxLat = gpsData[0][0];
      // var minLon = gpsData[0][1];
      // var maxLon = gpsData[0][1];

      var minLat = null;
      var maxLat = null;
      var minLon = null;
      var maxLon = null;
      var minEle = null;
      var maxEle = null;

      var i = 0;
      var p = 0;
      let segment;

      console.log('Total segments ' + gpsDataFromStrava.segments.length);

      // loop the segments
      for(i = 0; i<gpsDataFromStrava.segments.length;i++) {

        segment = gpsDataFromStrava.segments[i];

        console.log('Segment ' + segment.length);

        // loop the track points
        for(p = 0; p < segment.length; p++) {

          //console.log(segment[p]['loc']);

          if(minLat == null || segment[p]['loc'][0] < minLat) minLat = segment[p]['loc'][0];
          if(maxLat == null || segment[p]['loc'][0] > maxLat) maxLat = segment[p]['loc'][0];
  

          if(minLon == null || segment[p]['loc'][1] < minLon) minLon = segment[p]['loc'][1];
          if(maxLon == null || segment[p]['loc'][1] > maxLon) maxLon = segment[p]['loc'][1];

          if(minEle == null || segment[p]['ele']< minEle) minEle = segment[p]['ele'];
          if(maxEle == null || segment[p]['ele']> maxEle) maxEle = segment[p]['ele'];

        }
      }

      // // loop through the data to find the min / max lat & lon
      // for(i = 0; i < gpsData.length; i++) {

      //   if(gpsData[i][0] < minLat) minLat = gpsData[i][0];
      //   if(gpsData[i][0] > maxLat) maxLat = gpsData[i][0];

      //   if(gpsData[i][1] < minLon) minLon = gpsData[i][1];
      //   if(gpsData[i][1] > maxLon) maxLon = gpsData[i][1];
      // }

      //offset to center
      var offsetX = maxLat - ((maxLat - minLat) / 2);
      var offsetY = maxLon - ((maxLon - minLon) / 2);
      var offsetZ = maxLat - ((maxLat - minEle) / 2);

      console.log('OffsetZ ' + offsetZ);

      // geometry with verticals
      var points = [];
      
      // for (i = 0; i < gpsData.length; i++) {
      //   var x = (gpsData[i][0]) - offsetX;
      //   var y = (gpsData[i][1]) - offsetY;
      //   var z = 0;
      //   points.push(new THREE.Vector3(x,z,y));
      // }

      // loop the segments
      var prevHeight = null;

      for(i = 0; i<gpsDataFromStrava.segments.length;i++) {

        segment = gpsDataFromStrava.segments[i];

        // loop the track points
        for(p = 0; p < segment.length; p++) {

          var x = (segment[p]['loc'][0]) - offsetX;
          var z = (segment[p]['loc'][1]) - offsetY;
          var y = 0;

          points.push(new THREE.Vector3(x,y,z));
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
        // const geometry = new THREE.BoxGeometry(2, 2, 2);
        // const material = new THREE.MeshToonMaterial( {
        //     color: 0x156289,
        //     emissive: 0x072534,
        //     side: THREE.DoubleSide,
        //     flatShading: true
        // } );
        // this.cube = new THREE.Mesh( geometry, material );
        // this.scene.add( this.cube );

        const lights = [];
        lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 1 ] = new THREE.PointLight( 0xcccccc, 1, 0 );
        lights[ 2 ] = new THREE.PointLight( 0xaaaaaa, 1, 0 );

        lights[ 0 ].position.set( 0, 200, 0 );
        lights[ 1 ].position.set( 100, 200, 100 );
        lights[ 2 ].position.set( - 100, - 200, - 100 );

        this.scene.add( lights[ 0 ] );
        this.scene.add( lights[ 1 ] );
        this.scene.add( lights[ 2 ] );
    };

    startAnimationLoop = () => {
        // this.cube.rotation.x += 0.01;
        // this.cube.rotation.y += 0.01;

        this.renderer.render( this.scene, this.camera );

        // The window.requestAnimationFrame() method tells the browser that you wish to perform
        // an animation and requests that the browser call a specified function
        // to update an animation before the next repaint
        this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
    };

    handleWindowResize = () => {
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;

        this.renderer.setSize( width, height );
        this.camera.aspect = width / height;

        // Note that after making changes to most of camera properties you have to call
        // .updateProjectionMatrix for the changes to take effect.
        this.camera.updateProjectionMatrix();
    };

    render() {
        return <div style={style} ref={ref => (this.mount = ref)} />;
    }
}

class Container extends React.Component {
    state = {isMounted: true};

    render() {
        const {isMounted = true} = this.state;
        return (
            <>
                <button onClick={() => this.setState(state => ({isMounted: !state.isMounted}))}>
                    {isMounted ? "Unmount" : "Mount"}
                </button>
                {isMounted && <App />}
                {isMounted && <div>Scroll to zoom, drag to rotate</div>}
            </>
        )
    }
}



function getGPSDataFromGPX() {

  var xmlDoc = new DOMParser().parseFromString(xmlDataStr, 'text/xml');

  return get_gpx_data(xmlDoc);
}

function get_gpx_data(node, result) {
			if(!result)
				result = { segments: [] };
				
			switch(node.nodeName)
			{
				case "trkseg":
					var segment = [];
					result.segments.push(segment)
					for(var i=0; i<node.childNodes.length; i++)
					{
						var snode = node.childNodes[i];
						if(snode.nodeName === "trkpt")
						{
							var trkpt = { loc: [ parseFloat(snode.attributes["lat"].value), parseFloat(snode.attributes["lon"].value) ] };
							for(var j=0; j<snode.childNodes.length; j++)
							{
								var ssnode = snode.childNodes[j];
								switch(ssnode.nodeName)
								{
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
		
			for(var x=0; x<node.childNodes.length; x++)
			{
				get_gpx_data(node.childNodes[x], result);
      }
      
			return result;
    }
    
const rootElement = document.getElementById("root");
ReactDOM.render(<Container />, rootElement);
