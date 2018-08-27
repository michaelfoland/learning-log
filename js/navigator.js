import navTemplate from '../templates/navTemplate.hbs';

const buttonClass = 'nav__button';
const activeClass = 'nav__button-active'; // is this proper BEM naming?

export class Navigator {
  constructor(elementObjs, containerId) {
    this._navTargets = {};
    
    this._navTargets = elementObjs;
    this._containerId = containerId;
    this._currentlyVisibleId = '';
    this._currentNavTarget = {};
    this._renderedNavTarget = '';
    this._init();
  }
  
  _init() {
    document.getElementById(this._containerId).addEventListener('animationend',this._handleAnimationEnd.bind(this),false);
  }

  render() {
    let navData = {};

    navData.buttonClass = buttonClass;
    navData.navTargets = [];
    
    this._navTargets.forEach(target => {
      navData.navTargets.push({
        targetId: target.id,
        buttonText: target.buttonText
      });
    });
    
    return navTemplate(navData);
  }
  
  postRender() {
    // set up links to buttons for triggering navigation
    let navButtons = Array.from(document.getElementsByClassName(buttonClass));
    
    navButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (this._currentlyVisibleId !== button.dataset.navTarget) {
          this.navigateTo(button.dataset.navTarget);  
        }
      });
    });
  }

  navigateTo(newViewId) {
    // console.log('in navigateTo(), this._currentlyVisibleId =',this._currentlyVisibleId);
    
    // Get target and check that it exists
    let target = this._navTargets.filter(navTarget => {
      return navTarget.id === newViewId;
    })[0];

    if (!target) return; // bail if no target was found

    /*
    // NEW 8/22: run preDestroy on currently visible target
    let currentView = this._navTargets.filter((curr,prev) => {
      return curr.id = this._currentlyVisibleId;
    });
    
    if (currentView.length > 0) {
      console.log('about to call preDestroy()');
      currentView[0].preDestroy();
    }
    */
        
    this._currentNavTarget = target;

    // Fetch new view
    // console.log('DEBUG 1: navigator.js calling fetchNewView()');
    this.fetchNewView();
        
    // Update active class on nav buttons
    if (this._currentlyVisibleId !== '') {
      document.getElementById(this._currentlyVisibleId + '-button').classList.remove(activeClass);  
    }

    document.getElementById(newViewId + '-button').classList.add(activeClass);
    
    // Fade out container (and overlay, if necessary)
    document.getElementById(this._containerId).classList.add('fading-out');
        
    let overlay = document.getElementById('overlay');
    if (overlay.style.display === 'flex') {
      overlay.classList.add('fading-out');
    }
  }
  
  
  /*
  navigateTo(newViewId) {
    // Get target and check that it exists
    let target = this._navTargets.filter(navTarget => {
      return navTarget.id === newViewId;
    })[0];

    if (!target) return; // bail if no target was found
    
    if (this._currentlyVisibleId !== '') {
      document.getElementById(this._currentlyVisibleId + '-button').classList.remove(activeClass);  
    }

    document.getElementById(newViewId + '-button').classList.add(activeClass);

    this._currentNavTarget = target;

    let container = document.getElementById(this._containerId);
    container.classList.add('fading-out');
    
    let overlay = document.getElementById('overlay');
    
    if (overlay.style.display === 'flex') {
      overlay.classList.add('fading-out');
    }
  }
  */
  
  fetchNewView() {
    this._currentNavTarget.render()
      .then(
        result => {
          this._renderedNavTarget = result;
          // console.log('in fetchNewView: SUCCESS. Setting renderedNavTarget to',result.substring(0,500));
        },
        error => {
          this._renderedNavTarget = 'error loading ' + this._currentNavTarget.id; 
          // console.log('in fetchNewView: ERROR. Setting renderedNavTarget to',error);
        }
      );
  }
  
  changeViews() {
    // hide overlay: NOT SURE THESE LINES SHOULD BE HERE
    let overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    overlay.style.opacity = 1;
    overlay.classList.remove('fading-out');
    //    
    let container = document.getElementById(this._containerId);

    // Check whether renderedNavTarget has returned
    if (this._renderedNavTarget !== '') {
      container.innerHTML = this._renderedNavTarget;
      this._currentNavTarget.postRender();
    } else {
      container.innerHTML = this._generateErrorMessage(this._currentNavTarget);
    }
    
    container.classList.remove('fading-out');
    container.classList.add('fading-in');

    this._currentlyVisibleId = this._currentNavTarget.id;

    this._currentNavTarget = {};
    this._renderedNavTarget = '';
    
    
    this.scrollToTop();
  }
  
  scrollToTop() {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  }
  
  _handleAnimationEnd() {
    let container = document.getElementById(this._containerId);
    
    if (container.matches('.fading-in')) {
      container.classList.remove('fading-in');
    } else if (container.matches('.fading-out')) {
      /* container.classList.remove('fading-out'); */
      this.changeViews();
    }
  }
 
  _generateErrorMessage(navTarget) {
    return 'Error loading ' + navTarget;
  }
}