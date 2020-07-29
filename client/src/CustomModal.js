import React from 'react';
import {Modal, Button, Form, Dropdown, DropdownButton}  from 'react-bootstrap';
import CSVReader from 'react-csv-reader';


export default class CustomModal extends React.Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
        this.state = {
            name: props.name,
            show: props.show,
            user: null,
            password: null,
            project: null,
            path: null,
            callbackUser: props.callbackUser, //insert user
            callbackDeleteUser: props.callbackDeleteUser,
            callbackProject: props.callbackProject,
            callbackDeleteProject: props.callbackDeleteProject,
            callbackImportData: props.callbackImportData,
            callbackGetClient: props.callbackGetClient,
            callbackGetProjects: props.callbackGetProjects,
            mode: "Insert",
            client: null,
            usernames: [],
            currentUser: "client"
        } 
    }

    setShow(show) {
        this.setState({show: show})
    }

    setName(name) {
        this.setState({name: name});
    }

    setUsernames(users) {
        this.setState({usernames: users});
    }

    componentDidMount() {
    }
    
    componentWillUnmount() {
    }

    changeProject(e) {
        console.log(e.target.value);
        this.setState({project: e.target.value});
    }

    changeUser(e) {
        this.setState({user: e.target.value});
    }

    changePassword(e) {
        this.setState({password: e.target.value});
    }

    changeCode(e) {
        this.setState({code: e.target.value});
    }

    changeClient(e) {
        this.setState({client: e.target.value});
    }

    changeDescription(e) {
        this.setState({description: e.target.value});
    }

    changeDate(e) {
        this.setState({date: e.target.value});
    }

    changeTA(e) {
        this.setState({tacode: e.target.value});
    }

    changeAmazon(e) {
        this.setState({amazon: e.target.value});
    }

    changeSurface(e) {
        this.setState({surface: e.target.value});
    }
    
    createUser(e) {
        this.props.callbackUser(this.state.user, this.state.password);
    }

    deleteUser(e) {
        this.props.callbackDeleteUser(this.state.user);
    }

    createProject(e) {
        this.props.callbackProject(this.state.code, this.state.client, this.state.description, this.state.date, this.state.tacode, this.state.amazon, this.state.surface);
    }

    deleteProject(e) {
        this.props.callbackDeleteProject(this.state.project);
    }

    changePath(e) {
        console.log(this.inputRef.current.files[0]);
        this.setState({path: e.target.value});
    }

    importData(e) {
        console.log(this.state.path)
    }

    fileLoaded(data, info) {
        let project = this.state.project;
        this.delegate.fileLoaded(project, data, info);
    }

    delegate(parent) {
        this.delegate = parent;
    }

    changeMode(mode) {
        this.setState({mode: mode});
        if (mode === "Delete") {
            this.state.callbackGetClient();
        }
    }

    render() {
        if (this.state.name === 'user') {
            if(this.state.mode === 'Insert') {
                return (
                    <Modal 
                    show={this.state.show} 
                    size={'md'} 
                    centered={true}
                    onHide={() => this.setState({show: false})}>
                    <Modal.Header>
                        <Modal.Title>Add New User</Modal.Title>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {this.state.mode}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                            <Dropdown.Item
                                onClick={(e) => this.setState({mode: "Delete"})}
                                >
                                Delete
                            </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Modal.Header>
                    <Modal.Body >	
                        <Form>
                        <Form.Group controlId="userName">
                            <Form.Label>Username</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter username" 
                            onChange={(e) => this.changeUser(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Text className= "message"></Form.Text>
                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>           
                            <Form.Control 
                            type="password" 
                            placeholder="Password" 
                            onChange={(e) => this.changePassword(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            onClick={(e) => this.createUser(e)}>
                            Submit
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            } else if (this.state.mode === "Delete") {
                return (
                    <Modal 
                    show={this.state.show} 
                    size={'md'} 
                    centered={true}
                    onHide={() => this.setState({show: false})}>
                    <Modal.Header>
                        <Modal.Title>Delete User</Modal.Title>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {this.state.mode}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                            <Dropdown.Item
                                onClick={(e) => this.setState({mode: "Insert"})}
                                >
                                Insert
                            </Dropdown.Item>
                            </Dropdown.Menu>
                            </Dropdown>
                    </Modal.Header>
                    <Modal.Body >	
                        <Form>
                        <Form.Group controlId="userName">
                            <Form.Label>Username</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter username" 
                            onChange={(e) => this.changeUser(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Text className= "message"></Form.Text>
                        <Button 
                            variant="primary" 
                            onClick={(e) => this.deleteUser(e)}>
                            Submit
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            } else { //Update
               return (
                    <Modal 
                    show={this.state.show} 
                    size={'md'} 
                    centered={true}
                    onHide={() => this.setState({show: false})}>
                    <Modal.Header>
                        <Modal.Title>Update User</Modal.Title>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {this.state.mode}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                            <Dropdown.Item
                                onClick={(e) => this.setState({mode: "Insert"})}
                                >
                                Insert
                            </Dropdown.Item>
                            <Dropdown.Item
                                onClick={(e) => this.setState({mode: "Delete"})}
                                >
                                Delete
                            </Dropdown.Item>
                            
                            </Dropdown.Menu>
                        </Dropdown>
                    </Modal.Header>
                    <Modal.Body >	
                        <Form>
                        <Form.Group controlId="userName">
                            <Form.Label>Username</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter username" 
                            onChange={(e) => this.changeUser(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Text className= "message"></Form.Text>
                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>           
                            <Form.Control 
                            type="password" 
                            placeholder="Password" 
                            onChange={(e) => this.changePassword(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            onClick={(e) => this.createUser(e)}>
                            Submit
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            }
        } else if (this.state.name === 'project') {
            if(this.state.mode === 'Insert') {
                return (
                    <Modal 
                    show={this.state.show} 
                    size={'lg'} 
                    centered={true}
                    onHide={() => this.setState({show: false})}>
                    <Modal.Header>
                        <div>
                            <Modal.Title>Add New Project</Modal.Title>
                        </div>     
                        <Dropdown className="dropdownproject">
                                <Dropdown.Toggle variant="success" id="dropdown-basic">
                                    {this.state.mode}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                <Dropdown.Item
                                    onClick={(e) => this.changeMode("Delete")}
                                    >
                                    Delete
                                </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>	
                    </Modal.Header>
                    <Modal.Body >
                        <Form>
                        <Form.Group controlId="code">
                            <Form.Label>Code:</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter project code" 
                            onChange={(e) => this.changeCode(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Text className= "message"></Form.Text>
                        <Form.Group controlId="client">
                            <Form.Label>Client:</Form.Label>           
                            <Form.Control 
                            type="text" 
                            placeholder="Enter client name" 
                            onChange={(e) => this.changeClient(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="description">
                            <Form.Label>Description:</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter project description" 
                            onChange={(e) => this.changeDescription(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="date">
                            <Form.Label>Date:</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter date (MMM yyyy)" 
                            onChange={(e) => this.changeDate(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="tacode">
                            <Form.Label>TA Code:</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter ta code" 
                            onChange={(e) => this.changeTA(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="description">
                            <Form.Label>Surface:</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter surface (road/footpath)" 
                            onChange={(e) => this.changeSurface(e)}>
                            </Form.Control>
                        </Form.Group>

                        <Form.Group controlId="description">
                            <Form.Label>Amazon URL:</Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter amazon url" 
                            onChange={(e) => this.changeAmazon(e)}>
                            </Form.Control>
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            onClick={(e) => this.createProject(e)}>
                            Submit
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            } else {
                return (
                    <Modal 
                    show={this.state.show} 
                    size={'lg'} 
                    centered={true}
                    onHide={() => this.setState({show: false})}>
                    <Modal.Header>
                        <div>
                            <Modal.Title>Delete Project</Modal.Title>
                        </div>     
                        <Dropdown className="dropdownproject">
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {this.state.mode}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                            <Dropdown.Item
                                onClick={(e) => this.changeMode("Insert")}
                                >
                                Insert
                            </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>	
                    </Modal.Header>
                    <Modal.Body >
                        <Form>
                        <DropdownButton className="dropdownclient" title={this.state.currentUser}>
                            {this.state.usernames.map((value, index) =>
                            <Dropdown.Item 
                                key={`${index}`}
                                onClick={(e) => this.changeUser(e, value)}
                                >
                                {value}
                            </Dropdown.Item>
                            )}
                        </DropdownButton>	
                        <Form.Group controlId="code">
                            <Form.Label></Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter Project" 
                            onChange={(e) => this.changeProject(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            onClick={(e) => this.deleteProject(e)}>
                            Import
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            }
        } else {
            return (
                <Modal show={this.state.show} size={'md'} centered={true} onHide={() => this.setState({show: false})}>
                <Modal.Header>
                    <div>
                        <Modal.Title>Import Data</Modal.Title>
                    </div>     
                </Modal.Header>
                <Modal.Body >
                    <Form>
                        <Form.Group controlId="project">
                            <Form.Label>Project</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Enter Project Code"
                                onChange={(e) => this.changeProject(e)}>
                            </Form.Control>
                        </Form.Group>
                    </Form>
                    <CSVReader
                        cssClass="csv-reader-input"
                        label="Select CSV to import.  "
                        onFileLoaded={(data, fileInfo) => this.fileLoaded(data, fileInfo)}
                        inputStyle={{color: 'black'}}
                    />
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
            </Modal>
            );
        }
    }
}
