import React from 'react';
import {Button}  from 'react-bootstrap';

export default class CustomButtons extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            length: props.length,
            onClear: props.onClear,
            onSelect: props.onSelect
        }
    }

    render() {
        if (this.state.length < 10) {
            return(<div></div>);
          } else {
            return (
              <div >
                <div className="select-div">
                  <Button 
                    size="sm"
                    onClick={this.state.onSelect}
                    >
                    Select
                  </Button>
                </div>
                <div className="clear-div">
                  <Button 
                    size="sm"
                    onClick={this.state.onClear}
                    >
                    Clear
                  </Button>
                </div>
              </div>
              );
          } 
    }
}
