import Vector2D from './Vector2D';
import {LatLongToPixelXY, translateMatrix, scaleMatrix, pad, formatDate} from  './util.js';
import L from 'leaflet';
import './L.CanvasOverlay';

export default class GLEngine {
 

    constructor(canvas, leaflet) {
        this.canvas = canvas;
        this.leafletMap = leaflet;
        this.mouseclick = null;
        this.gl = null;
        this.intializeGL();
        
    }

    intializeGL() {
        if (this.gl == null) {
            this.glLayer = L.canvasOverlay()
            .addTo(this.leafletMap);
            this.canvas = this.glLayer.canvas();
            this.glLayer.canvas.width = this.canvas.width;
            this.glLayer.canvas.height = this.canvas.height;
        }
        this.gl = this.canvas.getContext('webgl2', { antialias: true }, {preserveDrawingBuffer: false}); 
        if (!this.gl) {
            this.gl = this.canvas.getContext('webgl', { antialias: true }, {preserveDrawingBuffer: false});
            console.log("Cannot load webgl2.0 using webgl instead");
          }  
          if (!this.gl) {
            this.gl = this.canvas.getContext('experimental-webgl', { antialias: true }, {preserveDrawingBuffer: false});
            console.log("Cannot load webgl1.0 using experimental-webgl instead");
          }  
          this.glLayer.delegate(this); 
          this.addEventListeners();
    }

    setAppDelegate(delegate) {
        this.appDelegate = delegate;
    }

      /**
     * adds various event listeners to the canvas
     */
    addEventListeners() {
        this.canvas.addEventListener("webglcontextlost", function(event) {
        event.preventDefault();
        console.log("CRASH--recovering GL")
        }, false);
        this.canvas.addEventListener("webglcontextrestored", function(event) {
            this.intializeGL();
        }, false);
    }

    
    reColorPoints(data) {
        let verts = new Float32Array(data);
        if (this.mouseclick === null) {
          if (this.appDelegate.state.selectedIndex === null) {
            return verts;
          } else {
            for (let i = 0; i < verts.length; i += 7) {
              if (verts[i + 6] === this.appDelegate.state.selectedIndex) {
                verts[i + 2] = 1.0;
                verts[i + 3] = 0;
                verts[i + 4] = 0;
                verts[i + 5] = 1.0;
              }
            }
          }
          
        } else {
          for (let i = 0; i < verts.length; i += 7) {
            let index = verts[i + 6];
            //calculates r,g,b color from index
            let r = ((index & 0x000000FF) >>  0) / 255;
            let g = ((index & 0x0000FF00) >>  8) / 255;
            let b = ((index & 0x00FF0000) >> 16) / 255;
            verts[i + 2] = r;
            verts[i + 3] = g;
            verts[i + 4] = b;
            verts[i + 5] = 1.0; //alpha
          }
        }
        return verts;
      }

    redraw(data) {
        this.glLayer.drawing(drawingOnCanvas); 
        let pixelsToWebGLMatrix = new Float32Array(16);
        this.mapMatrix = new Float32Array(16);  
            // -- WebGl setup
        let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, document.getElementById('vshader').text);
        this.gl.compileShader(vertexShader);
        let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        //let length = this.state.activeLayers.length - 1;
        this.gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
        this.gl.compileShader(fragmentShader);
        // link shaders to create our program
        let program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        this.gl.useProgram(program);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);
      // ----------------------------
        // look up the locations for the inputs to our shaders.
        let u_matLoc = this.gl.getUniformLocation(program, "u_matrix");
        let colorLoc = this.gl.getAttribLocation(program, "a_color");
        let vertLoc = this.gl.getAttribLocation(program, "a_vertex");
        this.gl.aPointSize = this.gl.getAttribLocation(program, "a_pointSize");
        // Set the matrix to some that makes 1 unit 1 pixel.
        pixelsToWebGLMatrix.set([2 / this.canvas.width, 0, 0, 0, 0, -2 / this.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.uniformMatrix4fv(u_matLoc, false, pixelsToWebGLMatrix); 
     
        let numPoints = data.length / 7 ; //[lat, lng, r, g, b, a, id]
        let vertBuffer = this.gl.createBuffer();
        let vertArray = this.reColorPoints(data);
        let fsize = vertArray.BYTES_PER_ELEMENT;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false, fsize*7, 0);
        this.gl.enableVertexAttribArray(vertLoc);
        // -- offset for color buffer
        this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, true, fsize*7, fsize*2);
        this.gl.enableVertexAttribArray(colorLoc);
        this.glLayer.redraw();
    
        function drawingOnCanvas(canvasOverlay, params) {
          if (this.delegate.gl == null)  {
            return;
          }
          this.delegate.gl.clearColor(0, 0, 0, 0);
          this.delegate.gl.clear(this.delegate.gl.COLOR_BUFFER_BIT);
          let pixelsToWebGLMatrix = new Float32Array(16);
          pixelsToWebGLMatrix.set([2 / params.canvas.width, 0, 0, 0, 0, -2 / params.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
          this.delegate.gl.viewport(0, 0, params.canvas.width, params.canvas.height);
          let pointSize = Math.max(this._map.getZoom() - 6.0, 1.0);
        //   if(this.delegate.state.login === "asm") {
        //     pointSize = Math.max(this._map.getZoom() - 0.0, 1.0);
        //   }
          this.delegate.gl.vertexAttrib1f(this.delegate.gl.aPointSize, pointSize);
          // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
          this.delegate.mapMatrix.set(pixelsToWebGLMatrix);
          var bounds = this._map.getBounds();
          var topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
          var offset = LatLongToPixelXY(topLeft.lat, topLeft.lng);
          // -- Scale to current zoom
          var scale = Math.pow(2, this._map.getZoom());
          scaleMatrix(this.delegate.mapMatrix, scale, scale);
          translateMatrix(this.delegate.mapMatrix, -offset.x, -offset.y);
          let u_matLoc = this.delegate.gl.getUniformLocation(program, "u_matrix");
          // -- attach matrix value to 'mapMatrix' uniform in shader
          this.delegate.gl.uniformMatrix4fv(u_matLoc, false, this.delegate.mapMatrix);
          this.delegate.gl.drawArrays(this.delegate.gl.POINTS, 0, numPoints);
          if (this.delegate.mouseclick !== null) {        
            let pixel = new Uint8Array(4);
            this.delegate.gl.readPixels(this.delegate.mouseclick.originalEvent.layerX, 
              this.canvas.height - this.delegate.mouseclick.originalEvent.layerY, 1, 1, this.delegate.gl.RGBA, this.delegate.gl.UNSIGNED_BYTE, pixel);
            let index = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;
            this.delegate.mouseclick = null;
            this.delegate.appDelegate.setIndex(index);
            this._redraw();
          }         
        }
      }

};