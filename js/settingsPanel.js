import settingsPanelTemplate from '../templates/settingsPanel.hbs';
import invalidInputFeedbackTemplate from '../templates/invalidInputFeedback.hbs';
import * as db from './database';
export const id = 'settings-panel';
export const buttonText = 'Settings';
let settingsPanel;
let settings;

export function init(initialSettings) {
  settings = initialSettings;
  
  db.addSettingsUpdateCallback(updateSettings);
}

export function render() {
  return new Promise((resolve, reject) => {
    if (settings) {
      resolve(settingsPanelTemplate(settings));
    } else {
      reject('settings not defined in settingsPanel.js');
    }
  });
}

export function postRender() {
  // get and cache ref to setting panel el
  settingsPanel = document.getElementById(id);
  
  attachListeners();
  
  refreshSwatches();
}

export function preDestroy() {
  console.log('in settingsPanel.destroy()');

  gatherInputValues();
  // check whether any values have changed (viz see if current values are different from user values)
  
}

function updateSettings(newSettings) {
  settings = newSettings;
}

function attachListeners() {
  settingsPanel.addEventListener('input',handleInput,false);
  settingsPanel.addEventListener('click',handleClick,false);
  settingsPanel.addEventListener('focus',handleFocus,true);
}

function handleFocus(e) {
  
  let row;
  
  if (e.target.closest('.setting-row')) {
    row = e.target.closest('.setting-row');
    
    e.preventDefault();
    
    window.scrollTo({
      top: getScrollTop() + row.getBoundingClientRect().top - getFixedPositionSpacerHeight(),
      behavior: 'smooth'
    });
  }
  
  
}

function refreshSwatch(targetSwatch,hue) {
  document.getElementById(targetSwatch + '-dark').style.background = getDarkColor(hue);
  document.getElementById(targetSwatch + '-light').style.background = getLightColor(hue);
}

function refreshSwatches() {
  let colorInputs = settingsPanel.getElementsByClassName('theme-color-input');
  
  for (let i = 0; i < colorInputs.length; i++) {
    refreshSwatch(colorInputs[i].dataset.target,colorInputs[i].value);    
  }
}

function handleClick(e) {
  let target = e.target;
  if (!target.matches('.settings-panel-button')) return;
  
  if (target.id === 'settings-panel__reset-button') {
    reset();
  } else if (target.id === 'settings-panel__save-button') {
    save();
  }
}

function save() {
  console.log('=== in save() ===');
  
  let inputEls = Array.from(settingsPanel.querySelectorAll('[data-prop-name]'));
  
  let updated = false;
  let fullyValid = true;
    
  inputEls.forEach(input => {
    if (input.value && 
        !Number.isNaN(parseInt(input.value, 10)) && 
        parseInt(input.value, 10) !== settings[input.dataset.propName]) {
      
      updated = true;
      
      if (input.validity.valid) {
        settings[input.dataset.propName] = parseInt(input.value, 10);        
      } else {
        fullyValid = false;
      }
    }
  });

  
  // case: not updated
  if (!updated) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return; 
  }
  
  // case: updated, but some invalid entries
  if (updated && !fullyValid) {
    displayInvalidInputOverlay();
    return;
  }
    
  // case: updated and valid
  db.updateSettings(settings)
    .then(
      result => {
        document.getElementById('main-container').innerHTML = settingsPanelTemplate(settings);
        window.scrollTo({ top: 0, behavior: 'smooth' });
          postRender(); // since we're re-rendering the entire view, we need to reattach event listeners, etc.
      },
      err => {
        console.log('error while trying to update settings');
      }
    )

}


function reset() {
  // reset theme color inputs to their original values
  settingsPanel.querySelector('#color-1-input').value = settings.color0User;
  settingsPanel.querySelector('#color-2-input').value = settings.color1User;
  settingsPanel.querySelector('#color-3-input').value = settings.color2User;
  
  // refresh swatches and css variables to match
  refreshSwatches();
  setAllCssVariables();

  // reset all other inputs to 0
  let nonColorInputs = Array.from(settingsPanel.querySelectorAll('input:not(.theme-color-input)'));
  nonColorInputs.forEach(input => input.value = '');

  // scroll back to the top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleInput(e) {
  if (!e.target.matches('.theme-color-input')) return;
  
  // get value of target slider 
  let hue = e.target.value;
  let targetSwatch = e.target.dataset.target;
  
  refreshSwatch(targetSwatch, hue);
 
  /* REMOVING THIS FOR NOW
  let colorId = targetSwatch.charAt(targetSwatch.length - 1);
  setCssVariable(colorId, hue);
  */
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

function displayInvalidInputOverlay() {
  let t = invalidInputFeedbackTemplate({});
  
  document.getElementById('overlay-content-panel').innerHTML = t;
  
  document.getElementById('invalid-input-feedback').addEventListener('click', hideOverlay, false);
  
  let target = document.getElementById('overlay');
  target.style.height = document.getElementsByTagName('body')[0].getBoundingClientRect().height + 'px';
  target.style.display = 'flex';
  
  setTimeout(hideOverlay, 2000);
}

function hideOverlay() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('overlay-content-panel').innerHTML = '';
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function getScrollTop() {
  let scrollTop = Math.floor(document.documentElement.scrollTop || document.body.scrollTop)
  console.log({scrollTop});
  return scrollTop;
}

function getFixedPositionSpacerHeight() {
  // find height of all spacers
  let spacers = Array.from(document.getElementsByClassName('fixed-position-spacer'));
  
  return spacers.reduce((acc, curr) => {
    return acc + curr.scrollHeight;
  }, 0);
}