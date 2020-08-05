import Vector2D from './Vector2D';
import {LatLongToPixelXY, translateMatrix, scaleMatrix} from  './util.js';
import L from 'leaflet';
import './L.CanvasOverlay';

export default class GLEngine {
 
    constructor(leaflet) {
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

    redraw(data, points) {
        console.log(points);
        var numberOfPoints = points.length  / 7;
        this.glLayer.drawing(drawingOnCanvas); 
        let pixelsToWebGLMatrix = new Float32Array(16);
        this.mapMatrix = new Float32Array(16);  
            // -- WebGl setup
        let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, document.getElementById('vshader').text);
        this.gl.compileShader(vertexShader);
        let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, document.getElementById('fshader-square').text);
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
        let thickness = 0.00005;
        let vertices = this.buildVertices(data, points, thickness)
        let vertBuffer = this.gl.createBuffer();

        let vertArray = new Float32Array(vertices);
        let fsize = vertArray.BYTES_PER_ELEMENT;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false, fsize*7, 0);
        this.gl.enableVertexAttribArray(vertLoc);
        // -- offset for color buffer
        this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, fsize*7, fsize*2);
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
            let pointSize = Math.max(this._map.getZoom() - 4.0, 1.0);
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
            //this.delegate.gl.drawArrays(this.delegate.gl.POINTS, 0, numPoints);
    
            //let pointer = numPoints + 1;
            let pointer = numberOfPoints;
            let numPoints = 0;
            //console.log(this.delegate.indices);
            console.log(numberOfPoints * 7) ;
            this.delegate.gl.drawArrays(this.delegate.gl.POINTS, 0, numberOfPoints);
            for (var i = 0; i < data.length - 1; i += 1) {
                
                let numPoints = (data[i].segment.length - 1) * 6;
                this.delegate.gl.drawArrays(this.delegate.gl.TRIANGLES, pointer, numPoints);
                pointer += numPoints;
            } 
            //console.log(pointer);
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

      buildVertices(data, verts, thickness) {
        for (var i = 0; i < data.length; i += 1) {
            let red = null;
            let green = null;
            let blue = null;
            let mouseclick = null;
            if (mouseclick === null) {
              if (data[i].class === "Access") { //blue
              red = 0;
              green = 0;
              blue = 1;
              } else if (data[i].class === "Arterial") { //red
                red = 1;
                green = 0;
                blue = 0;
              } else if (data[i].class === "Primary Collector") { //orange
                red = 1;
                green = 0.5;
                blue = 0;
              } else if (data[i].class === "Low Volume") { //green
                red = 0;
                green = 1;
                blue = 0;
              } else if (data[i].class === "Secondary Collector") { //yellow
                red = 1;
                green = 1;
                blue = 0;
              }
              else if (data[i].class === "Regional") { //black
                red = 0;
                green = 0;
                blue = 0;
              }
              else if (data[i].class === "National") { //white
                red = 1;
                green = 1;
                blue = 1;
              }
              else { //null
                red = 1;
                green = 0;
                blue = 1;
              }
            } else {
              red = ((i & 0x000000FF) >>>  0) / 255;
              green = ((i & 0x0000FF00) >>>  8) / 255;
              blue = ((i & 0x00FF0000) >>> 16) / 255;
            }      
          
            for (var j = 0; j < data[i].segment.length; j += 1) {
        
                if (data[i].segment.length < 2) {
                  console.log(data[i]);
                  continue;
                }
                if(data[i].segment.length < 3 ) {
                  //console.log(data[i]);
                  const pixel0 = {x: data[i].segment[0].x, y: data[i].segment[0].y};   
                  const pixel1 = {x: data[i].segment[1].x, y: data[i].segment[1].y};
                  if (pixel0.x === pixel1.x || pixel0.y === pixel1.y) {
                    //console.log(data[i]);
                    continue;
                  }
                  let p0 = new Vector2D(pixel0.x, pixel0.y);
                  let p1 = new Vector2D(pixel1.x, pixel1.y);
                  let line = Vector2D.subtract(p1, p0);
                  let normal = new Vector2D(-line.y, line.x)
                  let normalized = normal.normalize();
                  let a = Vector2D.subtract(p0, Vector2D.multiply(normalized,thickness));
                  let b = Vector2D.add(p0,  Vector2D.multiply(normalized,thickness));
                  let c = Vector2D.subtract(p1, Vector2D.multiply(normalized,thickness));
                  let d =  Vector2D.add(p1, Vector2D.multiply(normalized,thickness));
                  let l = Vector2D.subtract(a, b).length();
                  if (l > thickness * 2.1) {
                    console.log(l);
                  }
                  verts.push(a.x, a.y, red, green, blue, 1, 1);
                  verts.push(b.x, b.y, red, green, blue, 1, 1);
                  verts.push(c.x, c.y, red, green, blue, 1, 1);
                  verts.push(c.x, c.y, red, green, blue, 1, 1); 
                  verts.push(d.x, d.y, red, green, blue, 1, 1);
                  verts.push(b.x, b.y, red, green, blue, 1, 1);
                  continue;
                } else {
                  if (j === 0) {
                    const pixel0 = {x: data[i].segment[j].x, y: data[i].segment[j].y};
                    const pixel1 = {x: data[i].segment[j + 1].x, y: data[i].segment[j + 1].y};
                    const pixel2 = {x: data[i].segment[j + 2].x, y: data[i].segment[j + 2].y};
                    let p0 = new Vector2D(pixel0.x, pixel0.y);
                    let p1 = new Vector2D(pixel1.x, pixel1.y);
                    let p2 = new Vector2D(pixel2.x, pixel2.y);
            
                    let line = Vector2D.subtract(p1, p0);
                    let normal = new Vector2D(-line.y, line.x)
                    let normalized = normal.normalize();
                    let a = Vector2D.subtract(p0, Vector2D.multiply(normalized,thickness));
                    let b = Vector2D.add(p0, Vector2D.multiply(normalized,thickness));
        
                    let miter = this.getMiter(p0, p1, p2, thickness);
                    if (miter.x === 0 && miter.y === 0) {
                      continue;
                    }
                    let c = Vector2D.subtract(p1, miter);
                    let d = Vector2D.add(p1, miter);  
                    let l = Vector2D.subtract(a, b).length();
                    if (l > thickness * 2) {
                      //console.log(l);
                    }
                    verts.push(a.x, a.y, red, green, blue, 1, 1);
                    verts.push(b.x, b.y, red, green, blue, 1, 1);
                    verts.push(c.x, c.y, red, green, blue, 1, 1);
                    verts.push(c.x, c.y, red, green, blue, 1, 1); 
                    verts.push(d.x, d.y, red, green, blue, 1, 1);
                    verts.push(b.x, b.y, red, green, blue, 1, 1);
        
                    } else if (j === data[i].segment.length - 2) {
                    const pixel0 = {x: data[i].segment[j -1].x, y: data[i].segment[j -1].y};
                    const pixel1 = {x: data[i].segment[j].x, y: data[i].segment[j].y};
                    const pixel2 = {x: data[i].segment[j + 1].x, y: data[i].segment[j + 1].y};
                    let p0 = new Vector2D(pixel0.x, pixel0.y);
                    let p1 = new Vector2D(pixel1.x, pixel1.y);
                    let p2 = new Vector2D(pixel2.x, pixel2.y);
                    let miter1 = this.getMiter(p0, p1, p2, thickness);
                    if (miter1.x === 0 && miter1.y === 0) {
                      break;
                    }
                    let a = Vector2D.add(p1, miter1);
                    let b = Vector2D.subtract(p1,  miter1);
                    let line = Vector2D.subtract(p2, p1);
                    let normal = new Vector2D(-line.y, line.x)
                    let normalized = normal.normalize();
                    let c = Vector2D.subtract(p2, Vector2D.multiply(normalized,thickness));
                    let d = Vector2D.add(p2, Vector2D.multiply(normalized,thickness));
                    let l = Vector2D.subtract(c, d).length();
                    if (l > thickness * 2.1) {
                      console.log(l);
                    }
                    verts.push(a.x, a.y, red, green, blue, 1, 1);
                    verts.push(b.x, b.y, red, green, blue, 1, 1);
                    verts.push(c.x, c.y, red, green, blue, 1, 1);
                    verts.push(c.x, c.y, red, green, blue, 1, 1); 
                    verts.push(d.x, d.y, red, green, blue, 1, 1);
                    verts.push(a.x, a.y, red, green, blue, 1, 1);
                    break;  
                    } else {
                    //console.log("middle");
                    const pixel0 = {x: data[i].segment[j -1].x, y: data[i].segment[j -1].y};
                    const pixel1 = {x: data[i].segment[j].x, y: data[i].segment[j].y};
                    const pixel2 = {x: data[i].segment[j + 1].x, y: data[i].segment[j + 1].y};
                    const pixel3 = {x: data[i].segment[j + 2].x, y: data[i].segment[j + 2].y};
                    let p0 = new Vector2D(pixel0.x, pixel0.y);
                    let p1 = new Vector2D(pixel1.x, pixel1.y);
                    let p2 = new Vector2D(pixel2.x, pixel2.y);
                    let p3 = new Vector2D(pixel3.x, pixel3.y);
                    //meter calc
                    let miter1 = this.getMiter(p0, p1, p2, thickness);
                    if (miter1.x === 0 && miter1.y === 0) {
                      continue;
                    }
                    p1 = new Vector2D(pixel1.x, pixel1.y);
                    p2 = new Vector2D(pixel2.x, pixel2.y);
                    p3 = new Vector2D(pixel3.x, pixel3.y);
                    let miter2 = this.getMiter(p1, p2, p3, thickness);
                    if (miter2.x === 0 && miter2.y === 0) {
                      continue;
                    }
                    let a = Vector2D.add(p1, miter1);
                    let b = Vector2D.subtract(p1,  miter1);
                    let c = Vector2D.add(p2, miter2);
                    let d = Vector2D.subtract(p2,  miter2);
                    verts.push(a.x, a.y, red, green, blue, 1, 1);
                    verts.push(b.x, b.y, red, green, blue, 1, 1);
                    verts.push(c.x, c.y, red, green, blue, 1, 1);
                    verts.push(c.x, c.y, red, green, blue, 1, 1);
                    verts.push(d.x, d.y, red, green, blue, 1, 1);
                    verts.push(b.x, b.y, red, green, blue, 1, 1);
                  }
                }
              }
            }
            return verts;
      }

      getMiter(p0, p1, p2, thickness) {
        let p2p1 = Vector2D.subtract(p2, p1);
        let p1p0 = Vector2D.subtract(p1, p0);
        let y = p2p1.y * -1;
        let normal = new Vector2D(y, p2p1.x);
        let normalized = normal.normalize();
        p2p1.normalize();
        p1p0.normalize();
        p2p1 = Vector2D.subtract(p2, p1);
        let tangent = Vector2D.add(p2p1, p1p0);    
        let nTangent = tangent.normalize();
        y = nTangent.y * -1;
        let miter = new Vector2D(-nTangent.y, nTangent.x);
        let length = thickness / Vector2D.dot(miter, normalized);
        if (length > thickness * 1.5 || length < thickness * 0.5) {
          return new Vector2D(0, 0);
        }
        let l = miter.multiply(length);
        return new Vector2D(l.x, l.y);  
      } 

};