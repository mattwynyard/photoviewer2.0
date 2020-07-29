import React from 'react';
import {Modal, Button}  from 'react-bootstrap';
import {pad} from  './util.js'

export default class PhotoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedGLMarker: props.marker,
            amazon: props.amazon,
            currentPhoto: props.currentPhoto,
            type: null,
            show: props.show,
            status: null,
            checked: null,
            repaired: null,
            callbackUpdateStatus: props.callbackUpdateStatus,
        }
    }

   

    setModal(show, marker, amazon, currentPhoto, type) {
        this.setState({show: show});
        this.setState({type: marker[0].type});
        this.setState({status: marker[0].status});
        this.setState({repaired:  marker[0].datefixed});
        this.setState({amazon: amazon});
        this.setState({currentPhoto: currentPhoto});
        this.setState({selectedGLMarker: marker});
        if (marker[0].status === "active") {
          this.setState({checked: true});
          this.setState({repaired:  ""});
        } else {
          this.setState({checked: false});
          this.setState({repaired:  marker[0].datefixed});
        }
    
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

    clickPrev(e) {
        e.preventDefault();
        const newPhoto = this.getPhoto("prev");
        this.setState({currentPhoto: newPhoto});
        const url = this.state.amazon + newPhoto + ".jpg";
        this.setState({photourl: url});
        }
        
    clickNext(e) {
        e.preventDefault();
        const newPhoto = this.getPhoto("next");
        this.setState({currentPhoto: newPhoto});
        const url = this.state.amazon + newPhoto + ".jpg";
        this.setState({photourl: url});
    }

    changeSlider = (e) => {
      
    }

    changeDate(e) {
      e.preventDefault();
      console.log(e.target.value);
      this.setState({repaired: e.target.value});
    }


    clickSlider(e) {
      if (this.state.repaired === "") {
        return;
      }
      if (!this.state.checked) {
        this.setState(() => ({
          status: "active", 
          checked: true
        }));  
      } else {
        this.setState(() => ({
          status: "completed", 
          checked: false
        }));    
      } 
    }
      
    closePhotoModal(e) {
        this.delegate.updateStatusAsync(this.state.selectedGLMarker, this.state.status, this.state.repaired);
        this.setState({show: false});     
    }

    delegate(parent) {
      this.delegate = parent;
    }

      /**
     * Copies the lat lng from photo modal to users clipboard
     * @param {*} e button lcick event
     * @param {*} latlng Leaflet latlng object
     */
    copyToClipboard(e, latlng) {
      //e.preventDefault();
      const position = latlng.lat + " " + latlng.lng
      navigator.clipboard.writeText(position);
    }

    
    render() {

      const DateBox = function(props) {
        if (props.status === "active") {
          return (
            <div>
              <label><b>{"Date Repaired: "} </b></label>
              <input
                value={props.repaired}
                type="date" 
                id="daterepaired"
                onChange={props.onChange}
                >
              </input>
            </div>     
          );
        } else {
          return (
            <div>
              <label><b>{"Date Repaired: "}</b> {props.repaired}</label>
            </div>     
          );
        }
        
      }

      const Slider = function(props) {
        return (
          <div>
            <label className="lbstatus">
              <b>Status:</b> {props.status}
            </label>
            <label 
              className="switch">
              <input 
                type="checkbox"
                checked={props.checked}
                onClick={props.onClick}
                onChange={props.onChange}

              >
              </input>
              <span className="slider round"></span>
            </label>
          </div>
        );
      }
  
      const CustomTable = function(props) {
        if(props.obj.type === "road") {
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-4">
                    <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                    <b>{"Location: "} </b> {props.obj.location}<br></br>
                    <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng}
                </div>
                <div className="col-md-4">
                  <b>{"Grade: "} </b> {props.obj.priority} <br></br>
                  <b>{"Repair: "}</b>{props.obj.repair}<br></br> 
                  <b>{"DateTime: "} </b> {props.obj.datetime}
                </div>
                <div className="col-md-4">
                <Slider
                  status={props.status}
                  checked={props.checked}
                  onClick={props.onClick}
                  onChange={props.onChange}              
                  >
                </Slider>
                <DateBox 
                  repaired={props.repaired}
                  onChange={props.onDateChange}
                  status={props.status}
                >
                </DateBox>
                </div>
              </div>
            </div>	 
          );
        } else if(props.obj.type === "footpath") {      
          return (
            <div className="container">
              <div className="row">
                <div className="col-md-4">
                  <b>{"Fault ID: "}</b> {props.obj.id} <br></br> 
                  <b>{"Grade: "} </b> {props.obj.grade} <br></br>
                  <b>{"Location: "} </b> {props.obj.roadname}<br></br>
                  <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}  
                  <Button variant="outline-secondary" 
                    size="sm" 
                    onClick={props.copy} 
                    active >Copy
                  </Button>
                </div>
                <div className="col-md-4">
                  <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                  <b>{"Cause: "}</b>{props.obj.cause} <br></br> 
                  <b>{"Size: "}</b> {props.obj.size} m<br></br> 
                  <b>{"DateTime: "} </b> {props.obj.datetime}
                </div>
                <div className="col-md-4">
                <Slider
                  status={props.status}
                  checked={props.checked}
                  onClick={props.onClick}
                  onChange={props.onChange}              
                  >
                </Slider>
                {/* <DatePicker
                  selected={props.repaired}
                  onChange={props.onDateChange}
                  status={props.status}
                /> */}
                <DateBox 
                  repaired={props.repaired}
                  onChange={props.onDateChange}
                  status={props.status}
                >
                </DateBox>
                </div>
              </div>
            </div>	 
          );
        }      
      }
        return (
        <Modal dialogClassName={"photoModal"} 
            show={this.state.show} 
            size='xl' 
            centered={true}
            onHide={(e) => this.closePhotoModal(e)}
        >
        <Modal.Body className="photoBody">	
          <div className="container">
          {this.state.selectedGLMarker.map((obj, index) => 
            <img
              key={`${index}`}  
              className="photo" 
              src={this.state.amazon + this.state.currentPhoto + ".jpg"} 
                >
            </img>
          )}
            <img 
              className="leftArrow" 
              src={"leftArrow_128.png"} 
              onClick={(e) => this.clickPrev(e)}/> 
            <img 
              className="rightArrow" 
              src={"rightArrow_128.png"} 
              onClick={(e) => this.clickNext(e)}/>         
          </div>
		    </Modal.Body >
        <Modal.Footer>
          <CustomTable 
            obj={this.state.selectedGLMarker[0]}
            status={this.state.status}
            repaired={this.state.repaired}
            checked={this.state.checked}
            onClick={(e) => this.clickSlider(e)}
            onChange={(e) => this.changeSlider(e)}
            onDateChange={(e) => this.changeDate(e)}
            //TODO copy not working
            // copy={(e) => this.copyToClipboard(e, () => this.getGLFault('latlng'))}
            >      
          </CustomTable >
        </Modal.Footer>
      </Modal>
    );
  }
}