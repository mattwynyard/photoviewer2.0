import Cookies from 'js-cookie';

async function logout(e) {
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

  async function login(e) {  
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
    //console.log(body);
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
      this.setState({message: ""})
    } else {
      this.setState({message: "Username or password is incorrect!"});
    } 
     
  }

  /**
 * Fetches marker data from server using priority and filter
 * @param {String} project data to fetch
 */
async function filterLayer(project) {
    //console.log(this.state.priorities);
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/layer', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        filter: this.state.checkedFaults,
        priority: this.state.priorities,
      })
    }).then(async (response) => {
      if(!response.ok) {
        throw new Error(response.status);
      }
      else {
        const body = await response.json(); 
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession may have expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else {
          await this.addMarkers(body);
        }     
      }
    }).catch((error) => {
      console.log("error: " + error);
      alert(error);
      return;
    });   
  }    
}

async function loadCentreline(e) {
    if (this.state.login !== "Login") {
        await fetch('https://' + this.state.host + '/roads', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: "900",
          menu: e.target.id,
          user: this.state.login
        })
      })
      .then(async(response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession may have expired - user will have to login again`);
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

  async function loadFilters() {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/class', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession may have expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else {
          this.setState({faultClass: body});
          this.getFaultTypes(this.state.faultClass[0].code);
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }) 
    }
  }

  async function getFaultTypes(cls) {
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
          type: cls
        })
      })
      .then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}'\n'Session may have expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else {
          body.map(obj => obj["type"] = cls)
          this.setState({faultTypes: body});
        }  
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      })    
    }
  }

  export {getFaultTypes, loadFilters, loadCentreline, filterLayer, login, logout}