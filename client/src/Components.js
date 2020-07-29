
export default class CustomNav extends React.Component {

LayerNav(props) {
    if (props.layers.length > 0) {
      return (
        <Nav>          
        <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
          <CustomMenu title="Add Layer" className="navdropdownitem" projects={props.projects} onClick={props.loadLayer}/>
          <NavDropdown.Divider />
          {/* <NavDropdown.Item className="navdropdownitem" href="#centreline" onClick={(e) => this.removeLayer(e)}>Remove Layer </NavDropdown.Item>
          <NavDropdown.Divider /> */}
          <CustomMenu title="Remove Layer" className="navdropdownitem" projects={props.layers} onClick={props.removeLayer}/>
          <NavDropdown.Divider />
          <NavDropdown.Item className="navdropdownitem" href="#centreline" onClick={props.addCentreline}>Add centreline </NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item className="navdropdownitem" href="#filter"  onClick={props.clickFilter}>Filter Layer</NavDropdown.Item>
        </NavDropdown>
      </Nav>
      );
    } else {
      return (
        <Nav>          
        <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
          <CustomMenu title="Add Layer" className="navdropdownitem" projects={props.projects} layers={props.layers} onClick={props.loadLayer}/>
          {/* <NavDropdown.Divider />
          <NavDropdown.Item title="Remove Layer" className="navdropdownitem" href="#centreline" onClick={(e) => this.removeLayer(e)}>Remove layer</NavDropdown.Item> */}
          {/* <NavDropdown.Divider />
          <NavDropdown.Item className="navdropdownitem" href="#filter"  onClick={(e) => this.clickFilter(e)}>Filter Layer</NavDropdown.Item> */}
        </NavDropdown>
      </Nav>
      );
    }
  }
}