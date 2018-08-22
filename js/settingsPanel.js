import settingsPanelTemplate from '../templates/settingsPanel.hbs';
import * as db from './database';
export const id = 'settings-panel';
export const buttonText = 'Settings';

export function render() {
  return db.getSettings().then(
    result => {
      let myObj = {};
      myObj.color0 = result.global.colors[0];
      myObj.color1 = result.global.colors[1];
      myObj.color2 = result.global.colors[2];
      console.log('myObj =',myObj);      
      return settingsPanelTemplate(myObj);
    },
    err => {
      console.log('error in call to db.getSettings() from render() in settingsPanel.js');
    });
}

export function postRender() {
  // nothing right now
  console.log('executing settingsPanel postRender()');
  
  attachListeners();
  
  refreshSwatch(1);
  refreshSwatch(2);
  refreshSwatch(3);
}

function attachListeners() {
  let settingsPanel = document.getElementById(id);
  
  settingsPanel.addEventListener('input',handleInput,false);
}

function refreshSwatch(swatchNum) {
  // get input
  let input = document.getElementById('color-' + swatchNum + '-input');
  
  document.getElementById('swatch-' + swatchNum + '-dark').style.background = getDarkColor(input.value);
  
    document.getElementById('swatch-' + swatchNum + '-light').style.background = getLightColor(input.value);

  
  
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
