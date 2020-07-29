import React from 'react';
import {Nav, NavDropdown}  from 'react-bootstrap';

export default class CustomNav extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "Login",
            onClick: null,
        }
    }

    setTitle = (user) => {
      this.setState({title: user});
    }

    setOnClick(func) {
      this.setState({onClick: func});
    }
    
    componentDidMount() {
    }
    
    componentWillUnmount() {

    }

    render() {
        if (this.state.title === 'Login') {
            return (
              <Nav className="ml-auto">
                <Nav.Link  id="Login" href="#login" onClick={this.state.onClick}>{this.state.title} </Nav.Link>
              </Nav>);
          } else {
            return (
            <Nav className="ml-auto"><NavDropdown className="navdropdown" title={this.state.title} id="basic-nav-dropdown">
              <NavDropdown.Item className="navdropdownitem" onClick={this.state.onClick}>Logout</NavDropdown.Item>
            </NavDropdown></Nav>);
          }
    }
}

