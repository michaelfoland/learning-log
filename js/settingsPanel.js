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
  settingsPanel.addEventListener('click',handleClick,false);
  
}

function refreshSwatch(targetSwatch,hue) {
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

function handleClick(e) {
  let target = e.target;
  if (!target.matches('.settings-panel-button')) return;
  
  let settingsPanel = document.getElementById(id);
  
  if (target.id === 'settings-panel__reset-button') {
    // reset theme color inputs to their original values
    settingsPanel.querySelector('#color-1-input').value = settings.color0;
    settingsPanel.querySelector('#color-2-input').value = settings.color1;
    settingsPanel.querySelector('#color-3-input').value = settings.color2;
    
    refreshSwatches();
    
    setAllCssVariables();
    
    // reset all other inputs to 0
    let nonColorInputs = Array.from(settingsPanel.querySelectorAll('input:not(.theme-color-input)'));
    
    nonColorInputs.forEach(input => input.value = '');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function handleInput(e) {
  if (!e.target.matches('.theme-color-input')) return;
  
  // get value of target slider 
  let hue = e.target.value;
  let targetSwatch = e.target.dataset.target;
  
  refreshSwatch(targetSwatch, hue);
  
  let colorId = targetSwatch.charAt(targetSwatch.length - 1);
  
  setCssVariable(colorId, hue);
}
  
function setAllCssVariables() {
  setCssVariable(1, document.getElementById('color-1-input').value);
  setCssVariable(2, document.getElementById('color-2-input').value);
  setCssVariable(3, document.getElementById('color-3-input').value);
  
}

function setCssVariable(colorId, hue) {
  document.documentElement.style.setProperty('--color-' + colorId, getLightColor(hue));
  document.documentElement.style.setProperty('--color-' + colorId + '-dark', getDarkColor(hue));
}

function getDarkColor(hue) {
  return 'hsl(' + hue + ', 65%, 35%)';
}

function getLightColor(hue) {
  return 'hsl(' + hue + ', 50%, 50%)';
}

function gatherSettingsPropValues() {
  let settingsPanel = document.getElementById(id);
  
  let inputEls = settingsPanel.querySelectorAll('[data-prop-name]');
  
  console.log('there are',inputEls.length,'inputs to go through');
}
