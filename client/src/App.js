import React from 'react';
import { Map as LMap, TileLayer, Popup, ScaleControl, LayerGroup}  from 'react-leaflet';
import {Navbar, Nav, NavDropdown, Dropdown, Modal, Button, Image, Form}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import CustomNav from './CustomNav.js';
import Cookies from 'js-cookie';
import './L.CanvasOverlay';
import './PositionControl';
import DynamicDropdown from './DynamicDropdown.js';
import CustomModal from './CustomModal.js';
import PhotoModal from './PhotoModal.js';
import GLEngine from './GLEngine.js';
import Vector2D from './Vector2D';

import {LatLongToPixelXY, pad, formatDate} from  './util.js'

class App extends React.Component {

  constructor(props) {
    super(props);
    this.customNav = React.createRef();
    this.menu = React.createRef();
    this.customModal = React.createRef();
    this.photoModal = React.createRef();
    this.state = {
      location: {
        lat: -41.2728,
        lng: 173.2995,
      },
      latitude: null,
      longtitude: null,
      high : true,
      med : true,
      low : true,
      admin : false,
      filter: [], //filter for db request
      priorityDropdown: null,
      priorityMode: "Priority",
      priorities: [], 
      ages: [],
      filterDropdowns: [],
      filterPriorities: [],
      filterAges: [],
      host: this.getHost(),
      token: Cookies.get('token'),
      login: this.getUser(),
      loginModal: this.getLoginModal(this.getUser()),
      zIndex: 900,
      key: process.env.REACT_APP_MAPBOX,
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      osmThumbnail: "satellite64.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      mode: "map",
      zoom: 8,
      index: null,
      centreData: [],
      objData: [],
      fault: [],
      priority: [],
      sizes: [],
      photos: [],
      currentPhoto: null,
      currentFault: [],
      layers: [],
      bounds: {},
      show: false,
      showLogin: false,
      showContact: false,
      showTerms: false,
      showAbout: false,
      showAdmin: false,
      modalPhoto: null,
      popover: false,
      activeSelection: "Fault Type",
      photourl: null,
      amazon: null,
      user: this.getUser(),
      password: null,
      projects: this.getProjects(), //all foootpath and road projects for the user
      faultClass: [],
      activeProject: null,
      activeLayers: [], //layers displayed on the
      activeLayer: null, //the layer in focus
      bucket: null,
      clearDisabled: true,
      message: "",
      lineData: null,
      mouse: null,
      coordinates: null, //coordinates of clicked marker
      glpoints: null,
      selectedIndex: null,
      mouseclick: null,
      objGLData: [],
      selectedGLMarker: [],
      selectedStatus: null,
      projectMode: null, //the type of project being displayed footpath or road     
      newUser: null,
      newPassword: null,
    };   
  }

  componentDidMount() {
    // Call our fetch function below once the component mounts
    this.customNav.current.setTitle(this.state.user);
    this.customNav.current.setOnClick(this.state.loginModal);
    this.callBackendAPI()
    .catch(err => alert(err));
    //this.setPriorities();
    this.initialize();
    this.customModal.current.delegate(this);
    this.photoModal.current.delegate(this);
  }

  componentDidUpdate() {   

  }

  initialize() {
    this.leafletMap = this.map.leafletElement;
    this.GLEngine = new GLEngine(this.leafletMap); 
    this.GLEngine.setAppDelegate(this);

    //this.glLayer.delegate(this);
    this.position = L.positionControl();
    this.leafletMap.addControl(this.position);
    this.addEventListeners(); 
    if (this.state.login === 'asm') {
      this.setState({priorityMode: "Priority"});
    } else {
      this.setState({priorityMode: "Grade"});
    }  
    //}  
  }
  /**
   * Fires when user clicks on map.
   * Redraws gl points when user selects point
   * @param {event - the mouse event} e 
   */
  clickMap(e) {
    if (this.state.glpoints !== null) {
      this.setState({selectedIndex: null});
      this.setState({selectedGLMarker: []});
      //this.setState({mouseclick: e})
      this.GLEngine.mouseclick = e;
      this.GLEngine.redraw(this.state.lineData, this.state.glpoints);
    }
  }
  /**
   * 
   * @param {int - calculates the index from r,g,b color} color 
   */
  getIndex(color) { 
    return color[0] + color[1] * 256 + color[2] * 256 * 256 + color[3] * 256 * 256 * 256;
  }

  /**
   * Called from drawing callback in L.CanvasOverlay by delegate
   * Sets the selected point and redraw
   * @param {the point the user selected} index 
   */
  setIndex(index) {
    if (index !== 0) {
      this.setState({selectedIndex: index});
      this.setState({selectedGLMarker: [this.state.objGLData[index - 1]]}); //0 is black ie the screen
      let bucket = this.getGLFault(index - 1, 'inspection');
      if (this.state.projectMode === "road") {
        if (bucket !== null) {
          let suffix= this.state.amazon.substring(this.state.amazon.length - 8,  this.state.amazon.length - 1);
          if (suffix !== bucket) {
            let prefix = this.state.amazon.substring(0, this.state.amazon.length - 8);
            console.log(prefix + bucket + "/")
            this.setState({amazon: prefix + bucket + "/"});
          }
        }
      } else {
      }
      
    } else {//user selected screen only - no marker
      this.setState({selectedIndex: null});
      this.setState({selectedGLMarker: []});
    }
    this.GLEngine.redraw(this.stte.lineData, this.state.glpoints);
  }

  buildGLMarker(point, type) {
    if (type === "diamond") {
      console.log(point);
      let pointA = {x: point.x, y: point.y + 0.00001}
      let pointB = {x: point.x + 0.00001, y: point.y}
      let pointC = {x: point.x, y: point.y - 0.00001}
      let pointD = {x: point.x - 0.00001, y: point.y}
      return [pointA, pointB, pointC, pointD];
    }
  }

  /**
 * Loops through json objects and extracts fault information
 * Builds object containing fault information and calls redraw
 * @param {JSON array of fault objects received from db} data 
 * @param {String type of data ie. road or footpath} type
 */
addGLMarkers(project, data, type, zoomTo) {
  this.setState({amazon: this.state.activeLayer.amazon});
  let obj = {};
  let faults = [];
  let latlngs = [];
  let points = []; //TODO change to Float32Array to make selection faster
  let high = null;
  let med = null;
  let low = null;

  if(this.state.login === "asm") {    
    high = 1;
    med = 2;
    low = 3;
  } else {
    high = 5;
    med = 4;
    low = 3;
  }
  for (var i = 1; i < data.length; i++) { //start at one index 0 reserved for black
    const position = JSON.parse(data[i].st_asgeojson);
    const lng = position.coordinates[0];
    const lat = position.coordinates[1];
    let latlng = L.latLng(lat, lng);
    let point = LatLongToPixelXY(lat, lng);
    let alpha = 0.9;
    if (type === "road") {
      let bucket = data[i].inspection;
      if (bucket != null) {
        let suffix = this.state.amazon.substring(this.state.amazon.length - 8,  this.state.amazon.length - 1);
        if (bucket !== suffix) {
          alpha = 0.5;
        }
      }
      
      if(data[i].priority === high) {
        points.push(point.x, point.y, 1.0, 0, 1.0, alpha, i);
      } else if (data[i].priority === med) {
        points.push(point.x, point.y, 1.0, 0.5, 0, alpha, i);
      } else if (data[i].priority === 99) {
        points.push(point.x, point.y, 0, 0, 1, alpha, i);
      } else {
        points.push(point.x, point.y, 0, 0.8, 0, alpha, i);
      }
    } else {
      if (data[i].status === "active") {
        if(data[i].grade === high) {
          points.push(point.x, point.y, 1.0, 0, 1.0, 1, i);
        } else if (data[i].grade === med) {
          points.push(point.x, point.y, 1.0, 0.5, 0, 1, i);
        } else if (data[i].grade === low) {
          points.push(point.x, point.y, 0, 0.8, 0, 1, i);
        } else {
          points.push(point.x, point.y, 0, 0.8, 0.8, 1, i);
        }
      } else {
        points.push(point.x, point.y, 0.5, 0.5, 0.5, 0.8, i);
      }
      
    }    
    latlngs.push(latlng);
    if (type === "footpath") {
      let id = data[i].id.split('_');
      obj = {
        type: type,
        id: id[id.length - 1],
        roadid: data[i].roadid,
        footapthid: data[i].footpathid,
        roadname: data[i].roadname,        
        location: data[i].location,
        asset:  data[i].asset,
        fault: data[i].fault,
        cause: data[i].cause,
        size: data[i].size,
        grade: data[i].grade,
        photo: data[i].photoid,
        datetime: data[i].faulttime,
        latlng: latlng,
        status: data[i].status,
        datefixed: data[i].datefixed
      };
    } else {
      let id = data[i].id.split('_');
      obj = {
        type: type,
        id: id[id.length - 1],
        roadid: data[i].roadid,
        carriage: data[i].carriagewa,
        inspection: data[i].inspection,
        location: data[i].location,
        fault: data[i].fault,
        repair: data[i].repair,
        comment: data[i].comment,
        size: data[i].size,
        priority: data[i].priority,
        photo: data[i].photoid,
        datetime: data[i].faulttime,
        latlng: latlng,
        status: data[i].status,
        datefixed: data[i].datefixed
      };
    }   
    faults.push(obj);          
  }
  if (zoomTo) {
    this.centreMap(latlngs);
  }

  this.setState({objGLData: faults});
  this.setState({glpoints: points}); //Immutable reserve of original points
  //console.log(points);
  //this.GLEngine.redraw(points, null);
  this.loadCentreline(this.state.activeProject);
}

addCentrelines(data) {
  let lines = [];
  let indices = []
  for (var i = 0; i < data.length; i++) {
    const linestring = JSON.parse(data[i].st_asgeojson);
    const rcClass = data[i].onrcclass; 
    if(linestring !== null) {       
      let segment = linestring.coordinates[0];
      indices.push(segment.length);
      var points = [];
      //let pixelSegment = null; 
      for (let j = 0; j < segment.length; j++) {
        let point = segment[j];
        let xy = LatLongToPixelXY(point[1], point[0]);     
        points.push(xy);
      }
      //pointBefore += points.length;
      if (points.length > 2) {
        //pixelSegment = RDP(points, 0.00000000001); //Douglas-Peckam simplify line
        let seg = {segment: points, class: rcClass};
        lines.push(seg);
        //pointAfter += points.length;
      }  else {
        let seg = {segment: points, class: rcClass};
        lines.push(seg);
        //pointAfter += points.length;
      }           
    }       
  } 
  this.setState({lineData: lines});
  let numPoints = this.state.glpoints.length / 7;  
  this.GLEngine.redraw(lines, this.state.glpoints);
  
} 

  /**
   * adds various event listeners to the canvas
   */
  addEventListeners() {
    this.leafletMap.addEventListener('mousemove', (event) => {
      this.onMouseMove(event);
    });
  }

  onMouseMove(e) {
    let lat = Math.round(e.latlng.lat * 100000) / 100000;
    let lng = Math.round(e.latlng.lng * 100000) / 100000;
    this.position.updateHTML(lat, lng);
  }

  callBackendAPI = async () => {
    const response = await fetch("https://" + this.state.host + '/api'); 
    const body = await response.json();
    if (response.status !== 200) {
      alert(body);   
      throw Error(body.message) 
    } else {
      console.log(body.express);
    }
    return body;
  };

  /**
   * Gets the development or production host 
   * @return {string} the host name
   */
  getHost() {
    if (process.env.NODE_ENV === "development") {
      return "localhost:8443";
    } else if (process.env.NODE_ENV === "production") {
      return "osmium.nz";
    } else {
      return "localhost:8443";
    }
   }

  getProjects() {
    let cookie = Cookies.get('projects');
    if (cookie === undefined) {
      return [];
    } else {
      return JSON.parse(cookie);
    }    
  }
  /**
   * Checks if user has cookie. If not not logged in.
   * Returns username in cookie if found else 'Login'
   */
  getUser() {
    let cookie = Cookies.get('user');
    if (cookie === undefined) {
      return "Login";
    } else {
      return cookie;
    }    
  }

  getLoginModal(user) {
    if (user === "Login") {
      return (e) => this.clickLogin(e);
    } else {
      return (e) => this.logout(e);
    }
  }
  /**
   * 
   * @param {array of late lngs} latlngs 
   */
  centreMap(latlngs) {
    if (latlngs.length !== 0) {
      let bounds = L.latLngBounds(latlngs);
      if (bounds.getNorthEast() !== bounds.getSouthWest()) {
        const map = this.map.leafletElement;
        map.fitBounds(bounds);
      }    
    } else {
      return;
    }
  }
  /**
   * toogles between satellite and map view by swapping z-index
   * @param {the control} e 
   */
  toogleMap(e) {
    if (this.state.login === "Login") {
      return;
    }
    if (this.state.mode === "map") {
      this.setState({zIndex: 1000});
      this.setState({mode: "sat"});
      this.setState({osmThumbnail: "map64.png"});
      //this.setState({url: "https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=" + this.state.key});
      this.setState({url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=" + this.state.key});
      this.setState({attribution: 
        "&copy;<a href=https://www.mapbox.com/about/maps target=_blank>MapBox</a>&copy;<a href=https://www.openstreetmap.org/copyright target=_blank>OpenStreetMap</a> contributors"})
    } else {
      this.setState({zIndex: 900});
      this.setState({mode: "map"});
      this.setState({osmThumbnail: "satellite64.png"});
      this.setState({url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"});
      this.setState({attribution: '&copy; <a href="https://www.openstreetmap.org/copyright target=_blank>OpenStreetMap</a> contributors'})
    }
  }

  closePopup(e) {
    if (!this.state.show) {
      this.setState({selectedGLMarker: []});
      this.setIndex(0); //simulate user click black screen
    } 
  }

  /**
   * fires when user scrolls mousewheel
   * param - e the mouse event
   **/
  onZoom(e) {
    this.setState({zoom: e.target.getZoom()});
    this.setState({bounds: e.target.getBounds()});
  }

  /**
   * Fired when user clciks photo on thumbnail
   * @param {event} e 
   */
  clickImage(e) {   
    
    let photo = this.getGLFault(this.state.selectedIndex - 1, 'photo');
    this.setState({currentPhoto: photo});
    //this.photoModal.current.delegate(this);
    this.photoModal.current.setModal(true, this.state.selectedGLMarker, this.state.amazon, photo);
    //this.setState({show: true});
  }

  getPhoto(direction) {
    let photo = this.state.currentPhoto;
    let intSuffix = (parseInt(photo.slice(photo.length - 5, photo.length)));
    let n = null;
    if (direction === "prev") {
      n = intSuffix - 1;
    } else {
      n = intSuffix + 1;
    }
    let newSuffix = pad(n, 5);
    let prefix = photo.slice(0, photo.length - 5);
    let newPhoto = prefix + newSuffix;
    this.setState({currentPhoto: newPhoto});
    return newPhoto;
  }

  
  /**
   * resets to null state when user logouts
   */
  reset() {
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('projects');
    this.customNav.current.setOnClick((e) => this.clickLogin(e));
    this.customNav.current.setTitle("Login");
    this.setState({
      activeProject: null,
      projects: [],
      objData: [],
      login: "Login",
      priorites: [],
      objGLData: null,
      glpoints: [],
      activeLayers: [],
      filterDropdowns: [],
      ages: []
    }, function() {
      this.GLEngine.redraw([]);
    })
  }

  /**
   * loops through project array received from db and sets
   * project array in the state. Sets project cookie
   * @param {Array} projects 
   */
  buildProjects(projects) {    
    let obj = {road : [], footpath: []}
    for(var i = 0; i < projects.length; i += 1) {
      if (projects[i].surface === "road") {
        obj.road.push(projects[i]);
      } else {
        obj.footpath.push(projects[i]);
      }
    }
    Cookies.set('projects', JSON.stringify(obj), { expires: 7 })
    this.setState({projects: obj});
  }

  async logout(e) {
    e.preventDefault();
    const response = await fetch("https://" + this.state.host + '/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
      })
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);    
    } 
    this.reset();  
  }

  async login(e) {  
    e.preventDefault();
    const response = await fetch('https://' + this.state.host + '/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.userInput.value,
        key: this.passwordInput.value
      })
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);   
    }  
    if (body.result) {
      Cookies.set('token', body.token, { expires: 7 });
      Cookies.set('user', body.user, { expires: 7 });
      this.setState({login: body.user});
      this.setState({token: body.token}); 
      this.buildProjects(body.projects);   
      this.customNav.current.setTitle(body.user);
      this.customNav.current.setOnClick((e) => this.logout(e));
      this.setState({showLogin: false});
      this.setState({message: ""});
      if(this.state.login === 'admin') {
        this.setState({admin: true});
      }
      if (this.state.login === 'asm') {
        this.setState({priorityMode: "Priority"});
      } else {
        this.setState({priorityMode: "Grade"});
      }
    } else {
      this.setState({message: "Username or password is incorrect!"});
    }      
  }
  
  /**
   * checks if layer loaded if not adds layer to active layers
   * calls fetch layer
   * @param {event} e 
   * @param {string} type - the type of layer to load i.e. road or footpath
   */
  async loadLayer(e, type) { 
    e.persist();
    this.setState({projectMode: type})
    for(let i = 0; i < this.state.activeLayers.length; i += 1) { //check if loaded
      if (this.state.activeLayers[i].code === e.target.attributes.code.value) {  //if found
        return;
      }
    }
    let projects = null;
    let project = e.target.attributes.code.value; 
    let dynamicDropdowns = [];
    if (type === "road") {
      projects = this.state.projects.road;
      await this.loadFilters(project);
     
      for (let i = 0; i < this.state.faultClass.length; i++) {
        let dropdown = new DynamicDropdown(this.state.faultClass[i].description);
        dropdown.setCode(this.state.faultClass[i].code);
        let result = await this.requestFaults(project, this.state.faultClass[i].code);
        dropdown.setData(result);
        dropdown.initialiseFilter();     
        dynamicDropdowns.push(dropdown);
      }
      this.rebuildFilter();
      
    } else {
      projects = this.state.projects.footpath;
      let filters = ["Asset", "Fault", "Type", "Cause"];
      for (let i = 0; i < filters.length; i++) {
        let dropdown = new DynamicDropdown(filters[i]);
        let result = await this.requestDropdown(project, filters[i]);
        //console.log(result);
        dropdown.setData(result);
        dropdown.initialiseFilter();    
        dynamicDropdowns.push(dropdown);
      }
    }
    let layers = this.state.activeLayers;
    for (let i = 0; i < projects.length; i++) { //find project
      if (projects[i].code === e.target.attributes.code.value) {  //if found
        let project = {code: projects[i].code, description: projects[i].description, amazon: projects[i].amazon, 
          date: projects[i].date, surface: projects[i].surface, visible: true} //build project object
        this.setState({amazon: projects[i].amazon});
        layers.push(project);
        this.setState({activeLayer: project});
        break;
        }
    }
    
    this.setState(() => ({
      filterDropdowns: dynamicDropdowns,
      activeLayers: layers,
      activeProject: e.target.attributes.code.value,
      bucket: this.buildBucket(project)
    }), async function() { 
      await this.requestPriority(project);
      if (type === "road") {
        await this.requestAge(project); 
      }
      this.filterLayer(project, true); //fetch layer  
    });
  }

  async requestDropdown(project, code) {
    let result = null
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/dropdown', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        code: code
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            result = body;   
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
    return result;
  }

  async requestFaults(project, code) {
    let result = null
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/faults', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        code: code
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            result = body;     
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
    return result;
  }

  async requestAge(project) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/age', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            console.log(body.result);
            this.buildAge(body.result);              
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }); 
    }
  }

  async requestPriority(project) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/priority', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            this.buildPriority(body.priority);      
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }); 
    }
  }

  buildAge(ages) {
    console.log(ages);
    let arr = [];
    let arrb = [];
    if (ages[0].inspection === null) {
      console.log(this.state.bucket);
      let filter = [];
      this.setState({filterAges: filter});
      return;
    }
    for (let i = 0; i < ages.length; i++) {
      let inspection = ages[i].inspection; 
      if (inspection !== null) {
        arrb.push(inspection);       
        if(inspection === this.state.bucket ) {
          arr.push(formatDate(inspection));  
        } else {
          arr.push("pre-" + formatDate(this.state.bucket));  
        }
      }          
    }
    console.log(arrb);
    this.setState({filterAges: arrb})
    this.setState({ages: arr});
  }

  /**
   * Sets default bucket suffix for the project
   * @param {the current project} project 
   */
  buildBucket(project) {
    let bucket = project.split("_")[2];
    let month = bucket.substring(0, 2);
    let year = null;
    if (bucket.length === 4) {
      year = "20" + bucket.substring(2, 4)
    } else {
      year = bucket.substring(2, bucket.length);
    }
    return year + "_" + month;
  }

  buildPriority(priority) {
    let arr = [];
    let arrb = [];
    for (let i = 0; i < priority.length; i++) {
      if (priority[i] === 99) {
        arr.push("Signage");
        arrb.push(99);
      } else {
        arr.push(this.state.priorityMode + " " + priority[i]);
        arrb.push(priority[i]);
      }
    }
    arr.sort();
    arr.push("Completed");
    arrb.push(98);
    this.setState({filterPriorities: arrb});
    this.setState({priorities: arr});
  }

  /**
   * 
   * @param {event} e  - the menu clicked
   */
  removeLayer(e) {
    this.setState({objGLData: null});
    this.setState({glpoints: []});
    this.GLEngine.redraw([]);
    let layers = this.state.activeLayers;
    for(var i = 0; i < layers.length; i += 1) {     
      if (e.target.attributes.code.value === layers[i].code) {
        layers.splice(i, 1);
        break;
      }
    }
    //TODO clear the filter
    this.setState({priorities: []});
    this.setState({filter: []});
    this.setState({filterDropdowns: []})
    this.setState({filterPriorities: []})
    this.setState({activeLayers: layers}); 
    this.setState({ages: layers});    
  }

  getBody(project) {
    if (this.state.projectMode === "road") {
      return JSON.stringify({
        user: this.state.login,
        project: project,
        filter: this.state.filter,
        priority: this.state.filterPriorities,
        inspection: this.state.filterAges
      })   
    } else {
      let filterObj = [];

      for (let i = 0; i <  this.state.filterDropdowns.length; i++) {
        let obj = {name: this.state.filterDropdowns[i].name, filter: this.state.filterDropdowns[i].filter}
        filterObj.push(obj)
      }
      //console.log(this.state.filterDropdowns[0].name);
      return JSON.stringify({
        user: this.state.login,
        project: project,
        filter: this.state.filter,
        //TODO temp hack should be dymnic array to hold footpath filters
        priority: this.state.filterPriorities,
        assets: this.state.filterDropdowns[0].filter,
        faults: this.state.filterDropdowns[1].filter,
        types: this.state.filterDropdowns[2].filter,
        causes: this.state.filterDropdowns[3].filter})
    }
  }

  async sendData(project, data) {
    //console.log(data);
    let json = JSON.stringify({data: data});
    //console.log(json);
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/import', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: data,
        project: project
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const result = await response.json();
          
          if (response.error != null) {
            alert(`Error: ${response.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            alert(result.rows + '\n' + result.errors);
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });   
    }    
  }

/**
 * Fetches marker data from server using priority and filter
 * @param {String} project data to fetch
 */
  async filterLayer(project, zoomTo) {
    let body = this.getBody(project);
    //console.log(body);
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/layer', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            //console.log(body)
            if (body.type === "road") {
              await this.addGLMarkers(project, body.geometry, body.type, zoomTo);
            } else {
              await this.addGLMarkers(project, body.geometry, body.type, zoomTo);
            }
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });   
    }    
  }

  async loadCentreline(project) {
    if (this.state.login !== "Login") {
        await fetch('https://' + this.state.host + '/roads', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: "058",
          menu: project,
          user: this.state.login
        })
      })
      .then(async(response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);  
        } else {
          await this.addCentrelines(body);   
        }
      })
      .catch((error) => {
      console.log("error: " + error);
      alert(error);
      return;
    });   
    }
  }

  async loadFilters(project) {
    if (this.state.login !== "Login") {
      if (this.state.projectMode === "footpath") {
        return;
      } else {
        await fetch('https://' + this.state.host + '/class', {
          method: 'POST',
          headers: {
            "authorization": this.state.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: this.state.login,
            project: project
          })
        }).then(async (response) => {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            this.setState({faultClass: body});
          }   
        })
        .catch((error) => {
          console.log("error: " + error);
          alert(error);
          return;
        }) 
       
      }
    }      
  }

  async addNewUser(user, password) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/user', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "insert",
          user: user,
          password: password
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("New user created")
          }
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  getClient = async () => {
    console.log("get client")
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/usernames', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "select",
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            console.log(body);
            this.customModal.current.setUsernames(body.usernames);
          }
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  selectProjects = async (client) => {
    console.log("get projects")
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/selectprojects', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "select",
          client: client
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            console.log(body);
            //this.customModal.current.setUsernames(body.usernames);
          }
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  async deleteCurrentUser(user) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/user', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "delete",
          user: user
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("User deleted")
          }
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  async deleteCurrentProject(project) {
    console.log(project);
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/project', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "delete",
          project: project
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("Project deleted")
          }
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  async addNewProject(code, client, description, date, tacode, amazon, surface) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/project', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "insert",
          code: code,
          client: client,
          description: description,
          date: date,
          tacode: tacode,
          amazon: amazon,
          surface: surface
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("New project created")
          }
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  async updateStatusAsync(marker, status, date) {
    if (date === "") {
      date = null;
    }

    if (status === "active") {
      date = null;
    }
    
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/status', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login,
          project: this.state.activeProject,
          status: status,
          marker: marker,
          date: date
        })
      }).then(async (response) => {
        const body = await response.json();
        //console.log(body);
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.rows != null) {
            this.filterLayer(this.state.activeProject, false);
          }
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  getArray(value) {
    if (value === "Asset") {
      return this.state.assetCheckboxes;
    } else if (value === "Zone") {
      return this.state.zoneCheckboxes;
    } else if (value === "Priority") {
      return this.state.priorityCheckboxes;
    } else if (value === "Cause") {
      return this.state.causeCheckboxes;
    } else { //type
      return this.state.typeCheckboxes;
    }
  }

  getQueryArray(value) {
    if (value === 0) {
      return this.state.assets;
    } else if (value === 1) {
      return this.state.zones;
    } else if (value === 2) {
      return this.state.types;
    } else {
      return this.state.causes;
    }
  }

  clickLogin(e) {
    e.preventDefault();
    this.setState({showLogin: true});   
  }

  clickAbout(e) {
    this.setState({showAbout: true});  
  }

  clickTerms(e) {
    this.setState({showTerms: true});  
  }

  clickContact(e) {
    this.setState({showContact: true});  
  }

  clickClose(e) {
    this.setState({showContact: false});
    this.setState({showAbout: false});    
    this.setState({showTerms: false});    
  }

  clickPage(index) {
    this.setState({pageActive: index});
    this.getFaultTypes(this.state.faultClass[index].code);
  }

  /**
   * adds or removes fault to array  which keeps track of which faults are checked in the filter modal
   * @param {event} e 
   */
  clickCheck(e, value) {
    //if checked true we are adding values to arr
    if (value.filter.length <= 1 && e.target.checked) {
      return;
    }
    value.updateFilter(e.target.id, e.target.checked); 
    if (!e.target.checked) {
      value.setActive(true);
    }
    this.rebuildFilter();
  }

  clickActive(e, index) {
    e.target.checked ? this.state.filterDropdowns[index].setActive(false) : this.state.filterDropdowns[index].setActive(true);

  }

  changeCheck(e) {
    //console.log("change")
  }

/**
 * checks if each fault is checked by searching checkedFault array
 * @param {the dropdown} value 
 * * @param {the index of the fault within the dropdown} index 
 * @return {}
 */
  isChecked(value, index) {
    return value.isChecked(value.data.result[index]);
  }

  isActive(value, index) {
    return this.state.filterDropdowns[index].isActive();
  }

  changeActive(e, index) {
    console.log(e.target);
  }

  /**
   * Copies the lat lng from photo modal to users clipboard
   * @param {*} e button lcick event
   * @param {*} latlng Leaflet latlng object
   */
  copyToClipboard(e, latlng) {
    e.preventDefault();
    const position = latlng.lat + " " + latlng.lng
    navigator.clipboard.writeText(position);
  }

  

  changeLayer(e) {
    console.log("redraw");
  }

  selectLayer(e, index) {
    console.log(this.state.activeLayers[index]);
    this.setState({activeLayer: this.state.activeLayers[index]});
  }
/**
 * Clears all the checkboxes and filter for that dropdown
 * @param {event} e 
 * @param {DynmaicDropdown} value 
 */
  onClear(e, value) {
    value.clearFilter();
  }

  /**
   * Checks is dropdown box is checked or unchecked
   * @param {DynmaicDropdown} value 
   */
  isInputActive(value) {
    return value.active
  }

  /**
 * Selects all the checkboxes and filter for that dropdown
 * @param {event} e 
 * @param {DynmaicDropdown} value 
 */
  onSelect(e, value) {
    value.initialiseFilter();
  }

  /**
   * Fires when user clicks apply button. 
   * @param {event} e 
   */
  clickApply(e) {
    this.filterLayer(this.state.activeProject, false);
  }

  clickSelect(e, value) {
    if (e.target.checked) {
      this.onClear(e, value);
      value.setActive(false);
    } else {
      this.onSelect(e, value);
      value.setActive(true);
    }
    this.rebuildFilter();
  }

  rebuildFilter() {
    let filter = [];
    for (let i = 0; i < this.state.filterDropdowns.length; i++) {
      for (let j = 0; j < this.state.filterDropdowns[i].filter.length; j++) {
        filter.push(this.state.filterDropdowns[i].filter[j]);
      }
    }
    this.setState({filter: filter})
  }

  clickAges(e, index) {
    let query = this.state.filterAges;
    let date = null;
    if (index === 1) {
      console.log(e.target.id);
      date = this.state.bucket;
    } else {
      date = '2020_02';
    }
    if (query.length === 1) {
      if (e.target.checked) {
        query.push(date);
      } else {
        e.target.checked = true; 
      }
    } else {
      if (e.target.checked) {
        query.push(date);
      } else {
        query.splice(query.indexOf(date), 1 );
      }
    }
    console.log(this.state.filterAges);
    this.filterLayer(this.state.activeProject, false); //fetch layer  
  }

  /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
  clickPriority(e) {
    if (this.state.login === "Login") {
      return;
    }
    let query = this.state.filterPriorities;
    let priority = null;
    if (e.target.id === "Signage") {
      priority = 99;
    } else if (e.target.id === "Completed") {
      priority = 98;
    } else {
      let p = e.target.id.substring(e.target.id.length - 1, e.target.id.length)
      priority = parseInt(p);
    }
    if (query.length === 1) {
      if (e.target.checked) {
        query.push(priority);
      } else {
        e.target.checked = true;      
      }
    } else {
      if (e.target.checked) {
        query.push(priority);
      } else {     
        query.splice(query.indexOf(priority), 1 );
      }
    }
    this.setState({filterPriorities: query})
    this.filterLayer(this.state.activeProject, false);
  }

  /**
 * gets the requested attribute from the fault object array
 * @param {the index of marker} index 
 * @param {the property of the fault} attribute 
 */
getGLFault(index, attribute) {
  if (this.state.selectedGLMarker.length !== 0 && index !== null) {
    switch(attribute) {
      case "type":
        return  this.state.objGLData[index].type;
      case "fault":
        return  this.state.objGLData[index].fault;
      case "priority":        
        return  this.state.objGLData[index].priority;
      case "inspection":        
        return  this.state.objGLData[index].inspection;
      case "location":
        return  this.state.objGLData[index].location;
      case "size":
        return  this.state.objGLData[index].size;
      case "datetime":
        return  this.state.objGLData[index].datetime;
      case "photo":
        return  this.state.objGLData[index].photo;
      case "repair":
          return  this.state.objGLData[index].repair;
      case "comment":
          return  this.state.objGLData[index].comment;
      case "latlng":
          return  this.state.objGLData[index].latlng;
      default:
        return this.state.objGLData[index]
    }
  } else {
    return null;
  }
}

// Admin

addUser(e) {
  this.customModal.current.setShow(true);
  this.customModal.current.setState({name: 'user'});
}

addProject(e) {
  this.customModal.current.setState({name: 'project'});
  this.customModal.current.setShow(true);

}

importData(e) {
  this.customModal.current.setState({name: 'import'});
  this.customModal.current.setShow(true);
  //this.customModal.current.delegate(this);
}

fileLoaded(project, data, info) {
  console.log(project);
  this.customModal.current.setShow(false);
  this.sendData(project, data);
}


createUser = (name, password) => {
  this.addNewUser(name, password);
  this.customModal.current.setShow(false);

}

deleteUser = (name) => {
  this.deleteCurrentUser(name);
  this.customModal.current.setShow(false);

}

deleteProject = (project) => {
  this.deleteCurrentProject(project);
  this.customModal.current.setShow(false);

}

createProject = (code, client, description, date, tacode, amazon, surface) => {
  this.addNewProject(code, client, description, date, tacode, amazon, surface);
  this.customModal.current.setShow(false);

}

updateStatus(marker, status) {
  this.updateStatusAsync(marker, status);
}

  render() {

    const centre = [this.state.location.lat, this.state.location.lng];
    const { fault } = this.state.fault;
    let mode = this.state.projectMode; 
    const LayerNav = function LayerNav(props) { 

      if (props.user === 'admin') {
        return (
          <Nav>          
          <NavDropdown className="navdropdown" title="Tools" id="basic-nav-dropdown">
              <NavDropdown.Item  
              className="adminitem" 
                title="Add New User" 
                onClick={props.addUser}>
              Manage User     
              </NavDropdown.Item>
              <NavDropdown.Divider />
            <NavDropdown.Item
              title="Add New Project" 
              className="adminitem" 
              onClick={props.addProject}>
              Manage Projects 
              </NavDropdown.Item>
              <NavDropdown.Divider /> 
            <NavDropdown.Item  
              title="Import" 
              className="adminitem" 
              projects={props.layers} 
              admin={props.admin}
              onClick={props.importData}>
              Import Data    
            </NavDropdown.Item>
            <NavDropdown.Divider />
          </NavDropdown>
        </Nav>
        );
      } else {
        if (props.layers.length > 0) {
          if(mode === "road") {
            return (
              <Nav>          
              <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
                <CustomMenu 
                  title="Add Roading Layer" 
                  className="navdropdownitem" 
                  type={'road'} 
                  projects={props.projects.road} 
                  onClick={props.loadLayer}/>
                <NavDropdown.Divider />
                <CustomMenu 
                  title="Add Footpath Layer" 
                  className="navdropdownitem" 
                  type={'footpath'} 
                  projects={props.projects.footpath} 
                  onClick={props.loadFootpathLayer}/>
                <NavDropdown.Divider />
                
                <CustomMenu 
                  title="Remove Layer" 
                  className="navdropdownitem" 
                  projects={props.layers} 
                  onClick={props.removeLayer}/>
                <NavDropdown.Divider />
              </NavDropdown>
            </Nav>
            );
          } else {
            return (
              <Nav>          
              <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
                <CustomMenu 
                  title="Add Roading Layer" 
                  className="navdropdownitem" 
                  type={'road'} 
                  projects={props.projects.road} 
                  onClick={props.loadLayer}/>
                <NavDropdown.Divider />
                <CustomMenu 
                  title="Add Footpath Layer" 
                  className="navdropdownitem" 
                  type={'footpath'} 
                  projects={props.projects.footpath} 
                  onClick={props.loadFootpathLayer}/>
                   <NavDropdown.Divider />
                  <CustomMenu 
                  title="Add Centrelines" 
                  className="navdropdownitem" 
                  projects={props.projects.footpath} 
                  type={'centreline'} 
                  onClick={props.addCentreline}/>
                <NavDropdown.Divider />
                <CustomMenu 
                  title="Remove Layer" 
                  className="navdropdownitem" 
                  projects={props.layers} 
                  onClick={props.removeLayer}/>
                <NavDropdown.Divider />
              </NavDropdown>
            </Nav>
            );
          }
          
        } else {
          return (
            <Nav>          
            <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
              <CustomMenu 
                title="Add Roading Layer" 
                className="navdropdownitem" 
                type={'road'} 
                projects={props.projects.road} 
                layers={props.layers} 
                onClick={props.loadRoadLayer}/>
              <NavDropdown.Divider/>
              <CustomMenu 
                title="Add Footpath Layer" 
                className="navdropdownitem" 
                type={'footpath'}
                projects={props.projects.footpath} 
                layers={props.layers} 
                onClick={props.loadFootpathLayer}/>
            </NavDropdown>        
          </Nav>
          );
        }
      }
      
    }
    const CustomMenu = function(props) {
      if (typeof props.projects === 'undefined' || props.projects.length === 0) {
          return (  
            <div></div>  
            );
      } else {  
        if (props.type === "centreline") {
          return (        
            <NavDropdown title={props.title} className="navdropdownitem">   
              <NavDropdown.Item className="navdropdownitem"
                onClick={props.onClick}>
                <NavDropdown.Divider />
              </NavDropdown.Item>
            </NavDropdown>
            );
        } else {
          return (        
            <NavDropdown title={props.title} className="navdropdownitem" drop="right">
            {props.projects.map((value, index) =>      
              <NavDropdown.Item className="navdropdownitem"
                key={`${index}`}
                index={index}
                title={value.code}
                code={value.code}
                onClick={props.onClick}>
                {value.description + " " + value.date}
                <NavDropdown.Divider />
              </NavDropdown.Item>
            )}
            </NavDropdown>
            );
        }
        
      }
    }

    const CustomPopup = function(props) {
      let location = props.data.location;
      if (props.data.type === "footpath") {
        location = props.data.roadname;
      }
      return (
        <Popup className="popup" position={props.position}>
          <div>
            <p className="faulttext">
            <b>{"ID: "}</b>{props.data.id}<br></br>
              <b>{"Type: "}</b>{props.data.fault}<br></br>
              <b>{"Location: "}</b>{location}<br></br>
              <b>{"Date: "}</b>{props.data.datetime} 
            </p>
            <div>
              <Image className="thumbnail" 
                src={props.src}
                onClick={props.onClick} 
                thumbnail={true}>
              </Image >
            </div>          
          </div>
        </Popup>  
      );      
    }

    const CustomSVG = function(props) {
      if (props.value === "Grade 5" || props.value === "Priority 1") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="magenta" fill="magenta">
            <circle cx="5" cy="5" r="3" />
          </svg>
          );
      } else if (props.value === "Grade 4" || props.value === "Priority 2") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="darkorange" fill="darkorange">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Grade 3" || props.value === "Priority 3") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="limegreen" fill="limegreen">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Signage") {
        return (
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="blue" fill="blue">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Completed") {
        return (
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="grey" fill="grey" opacity="0.8">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else {
        if (props.value === props.bucket) {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} fill={props.color}>
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} opacity="0.4" fill={props.color}>
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        }
        
      }
    }

    return (   
      <> 
        <div>
          <Navbar bg="light" expand="lg"> 
            <Navbar.Brand href="#home">
            <img
                src="logo.png"
                width="122"
                height="58"
                className="d-inline-block align-top"
                alt="logo"
              />
            </Navbar.Brand>
            <LayerNav 
              project={this.state.activeProject} 
              projects={this.state.projects} 
              layers={this.state.activeLayers}
              user={this.state.login}
              removeLayer={(e) => this.removeLayer(e)} 
              loadRoadLayer={(e) => this.loadLayer(e, 'road')} 
              loadFootpathLayer={(e) => this.loadLayer(e, 'footpath')}
              addCentreline={(e) => this.loadCentreline(e)} 
              addUser={(e) => this.addUser(e)} 
              addProject={(e) => this.addProject(e)} 
              importData={(e) => this.importData(e)} 
              >
            </LayerNav>
            <Nav>
              <NavDropdown className="navdropdown" title="Help" id="basic-nav-dropdown">
                <NavDropdown.Item className="navdropdownitem" onClick={(e) => this.clickTerms(e)} >Terms of Use</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" onClick={(e) => this.clickContact(e)} >Contact</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" id="Documentation" onClick={(e) => this.documentation(e)}>Documentation</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" onClick={(e) => this.clickAbout(e)} >About</NavDropdown.Item>             
              </NavDropdown>         
            </Nav>
            <CustomNav ref={this.customNav} className="navdropdown"/>
          </Navbar>         
        </div>      
        <div className="map">
        <LMap        
          ref={(ref) => { this.map = ref; }}
          className="map"
          worldCopyJump={true}
          boxZoom={true}
          center={centre}
          zoom={this.state.zoom}
          // onZoom={(e) => this.onZoom(e)}
          onClick={(e) => this.clickMap(e)}
          onPopupClose={(e) => this.closePopup(e)}>
          <TileLayer className="mapLayer"
            attribution={this.state.attribution}
            url={this.state.url}
            zIndex={998}
            maxNativeZoom={19}
            maxZoom={22}
          />
          <ScaleControl className="scale"/>

          <Dropdown
            className="Priority">
          <Dropdown.Toggle variant="light" size="sm" >
              {this.state.priorityMode}
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu">
            {this.state.priorities.map((value, index) =>
                <div key={`${index}`}>
                 <CustomSVG 
                 value={value}
                 >
                 </CustomSVG>
                  <input
                    key={`${index}`} 
                    id={value} 
                    type="checkbox" 
                    defaultChecked 
                    onClick={(e) => this.clickPriority(e)}>
                  </input>{" " + value}
                  <br></br>
                </div> 
                )}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown
            className="Age">
          <Dropdown.Toggle variant="light" size="sm" >
              Inspection Date
            </Dropdown.Toggle>
            <Dropdown.Menu className="agemenu">
            {this.state.ages.map((value, index) =>
                <div key={`${index}`}>
                 <CustomSVG 
                  value={value}
                  color={"magenta"}
                  bucket={formatDate(this.state.bucket)}>
                 </CustomSVG>
                 <CustomSVG 
                  value={value}
                  color={"darkorange"}
                  bucket={formatDate(this.state.bucket)}>
                 </CustomSVG>
                 <CustomSVG 
                  value={value}
                  color={"limegreen"}
                  bucket={formatDate(this.state.bucket)}>
                </CustomSVG>
                <CustomSVG 
                  value={value}
                  color={"blue"}
                  bucket={formatDate(this.state.bucket)}> 
                 </CustomSVG>
                  <input
                    key={`${index}`} 
                    id={value} 
                    type="checkbox" 
                    defaultChecked 
                    onClick={(e) => this.clickAges(e, index)}>
                  </input>{" " + value}
                  <br></br>
                </div> 
                )}
            </Dropdown.Menu>
          </Dropdown>
          <div className="btn-group">
          {this.state.filterDropdowns.map((value, indexNo) =>
            <Dropdown 
              className="button"
              key={`${indexNo}`}     
              >                
              <Dropdown.Toggle variant="light" size="sm">
                <input
                  key={`${indexNo}`} 
                  id={value} 
                  type="checkbox" 
                  checked={this.isInputActive(value)} 
                  onChange={(e) => this.changeActive(e, indexNo)}
                  onClick={(e) => this.clickSelect(e, value)}
                  >
                </input>
                {value.name}         
              </Dropdown.Toggle>
              <Dropdown.Menu className="custommenu">
                {value.data.result.map((input, index) =>
                  <div key={`${index}`}>
                    <input
                      key={`${index}`} 
                      id={input} 
                      type="checkbox" 
                      checked={this.isChecked(value, index)} 
                      
                      onClick={(e) => this.clickCheck(e, value)}
                      onChange={(e) => this.changeCheck(e)}
                      >
                    </input>{" " + input}<br></br>
                  </div> 
                  )}
                <Dropdown.Divider />
              </Dropdown.Menu>
            </Dropdown>
          )}
          </div>
          <Image 
            className="satellite" 
            src={this.state.osmThumbnail} 
            onClick={(e) => this.toogleMap(e)} 
            thumbnail={true}
          />
          <LayerGroup >
            {this.state.selectedGLMarker.map((obj, index) =>  
            <CustomPopup 
              key={`${index}`} 
              data={obj}
              position={obj.latlng}
              src={this.state.amazon + obj.photo + ".jpg"} 
              onClick={(e) => this.clickImage(e)}>
            </CustomPopup>
            )}
          </LayerGroup>
          <Button 
            className="applyButton" 
            variant="light" 
            size="sm"
            onClick={(e) => this.clickApply(e)}
            >Apply Filter
          </Button>
      </LMap >    
      </div>
       {/* admin modal     */}
       <CustomModal 
        name={'user'}
        show={this.state.showAdmin} 
        ref={this.customModal}
        token={this.state.token}
        host={this.state.host}
        callbackUser={this.createUser} //insert user
        callbackDeleteUser={this.deleteUser}
        callbackProject={this.createProject}
        callbackDeleteProject={this.deleteProject}
        callbackImportData={this.importData}
        callbackGetClient={this.getClient}
        callbackGetProjects={this.selectProjects}
        >
       </CustomModal>
      <Modal className="termsModal" show={this.state.showTerms} size={'md'} centered={true}>
        <Modal.Header>
          <Modal.Title><h2>Road Inspection Viewer</h2></Modal.Title>
        </Modal.Header>
        <Modal.Body >	
          By using this software you confirm you have read and agreed to the Onsite Developments Ltd. <a href={"https://osmium.nz/?#terms"}> Click for terms of use.</a><br></br>
          All data on this site from Land Information New Zealand is made available under a Creative Commons Attribution Licence.<br></br>
          <span >&copy; 2019 Onsite Developments Ltd. All rights reserved.</span><br></br>
		    </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary" 
            type="submit" 
            onClick={(e) => this.clickClose(e)}>
              Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal 
        className="aboutModal" 
        show={this.state.showAbout} 
        size={'md'} centered={true}>
        <Modal.Header>
          <Modal.Title><h2>About</h2> </Modal.Title>
        </Modal.Header>
        <Modal.Body >	
          <b>Road Inspection Version 1.3</b><br></br>
          Relased: 23/04/2020<br></br>
          Company: Onsite Developments Ltd.<br></br>
          Software Developer: Matt Wynyard <br></br>
          <img src="logo192.png" alt="React logo"width="24" height="24"/> React: 16.12.0<br></br>
          <img src="webgl.png" alt="WebGL logo" width="60" height="24"/> WebGL: 1.0<br></br>
          <img src="bootstrap.png" alt="Bootstrap logo" width="24" height="24"/> Bootstrap: 4.4.0<br></br>
          <img src="leafletlogo.png" alt="Leaflet logo" width="60" height="16"/> Leaflet: 1.6.0<br></br>
          <img src="reactbootstrap.png" alt="React-Bootstrap logo" width="24" height="24"/> React-bootstrap: 1.0.0-beta.16<br></br>
          React-leaflet: 2.6.0<br></br>
		    </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" size='sm' type="submit" onClick={(e) => this.clickClose(e)}>
            Close
          </Button>
        </Modal.Footer>
      {/* login modal     */}
      </Modal>
      <Modal show={this.state.showLogin} size={'sm'} centered={true}>
        <Modal.Header>
          <Modal.Title><img src="padlock.png" alt="padlock" width="42" height="42"/> Login </Modal.Title>
        </Modal.Header>
        <Modal.Body >	
        <Form>
          <Form.Group controlId="userName">
            <Form.Label>Username</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Enter username" 
              ref={user => this.userInput = user} />
          </Form.Group>
          <Form.Text className= "message">{this.state.message}</Form.Text>
          <Form.Group controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>           
            <Form.Control 
              type="password" 
              placeholder="Password" 
              ref={(key=> this.passwordInput = key)}/>
          </Form.Group>
          <Button 
            variant="primary" 
            type="submit" 
            onClick={(e) => this.login(e)}>
            Submit
          </Button>
        </Form>
		    </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      {/*photo modal */}    
      <PhotoModal
        ref={this.photoModal}
        show={this.state.show} 
        marker={this.state.selectedGLMarker}
        amazon={this.state.amazon}
        currentPhoto={this.state.currentPhoto}
        callbackUpdateStatus={this.updateStatus}
      >
      </PhotoModal>
      </>
    );
  }
}
export default App;

