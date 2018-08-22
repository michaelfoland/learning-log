import settingsPanelTemplate from '../templates/settingsPanel.hbs';
import * as db from './database';
export const id = 'settings-panel';
export const buttonText = 'Settings';
let settings;

export function render() {
  return db.getSettings().then(
    result => {
      // cache settings
      settings = result;
      
      // render template and return it to nav
      return settingsPanelTemplate(result);
    },
    err => {
      console.log('error in call to db.getSettings() from render() in settingsPanel.js');
    });
}

export function postRender() {
  // nothing right now
  console.log('executing settingsPanel postRender()');
  
  attachListeners();
  
  refreshSwatches();
}

export function preDestroy() {
  console.log('in settingsPanel.destroy()');

  gatherSettingsPropValues();
  // check whether any values have changed (viz see if current values are different from user values)
  
}

function attachListeners() {
  let settingsPanel = document.getElementById(id);
  
  settingsPanel.addEventListener('input',handleInput,false);
}

function refreshSwatch(targetSwatch,hue) {
  // get input
  // let input = document.getElementById('color-' + swatchNum + '-input');
  
  document.getElementById(targetSwatch + '-dark').style.background = getDarkColor(hue);
  
    document.getElementById(targetSwatch + '-light').style.background = getLightColor(hue);
}

function refreshSwatches() {
  let settingsPanel = document.getElementById(id);
  
  let colorInputs = settingsPanel.getElementsByClassName('theme-color-input');
  
  for (let i = 0; i < colorInputs.length; i++) {
    refreshSwatch(colorInputs[i].dataset.target,colorInputs[i].value);    
  }
}

function handleInput(e) {
  if (!e.target.matches('.theme-color-input')) return;
  
  // get value of target slider 
  let hue = e.target.value;
  let targetSwatch = e.target.dataset.target;
  document.getElementById(targetSwatch + '-dark').style.background = getDarkColor(hue);
  
  document.getElementById(targetSwatch + '-light').style.background = getLightColor(hue);
}
  
function getDarkColor(hue) {
  return 'hsl(' + hue + ', 70%, 30%)';
}

function getLightColor(hue) {
  return 'hsl(' + hue + ', 40%, 60%)';
}

function gatherSettingsPropValues() {
  let settingsPanel = document.getElementById(id);
  
  let inputEls = settingsPanel.querySelectorAll('[data-prop-name]');
  
  console.log('there are',inputEls.length,'inputs to go through');
}
