// imports
import * as db from './database';
import { bundlePromises } from './promiseHelpers';
import { Navigator } from './navigator';
import { insertSpacers } from './fixed-spacer';
import * as entryForm from './entryForm';
import * as logView from './logView';
import * as settingsPanel from './settingsPanel';
import { defaultSettings } from './settings';

// init db
db.isReady()
  .then(
    result => {
      checkSettings();
    },
    err => {
      // TO DO: display some sort of reload/retry message in main container
      console.log(err);
      console.log('\tonFailure callback of db.isReady() in app.js');
    }); 

function checkSettings() {
  db.getSettings()
    .then(
      settings => {
        if (settings) {
          setup(settings);
        } else {
          firstTimeSetup();
        }
      },
      err => console.log('error in checkSettings of app.js')
    )
}

function firstTimeSetup() {
  db.updateSettings(defaultSettings)
    .then(
      result => {
        console.log('successfully loaded settings, now calling setup()');
        setup(defaultSettings);
      },      err => {
        console.log('failed to loaded settings to db');
      }
    )
}

// SET UP NAVBAR
let myNav;

// called after db is good to go
function setup(settings) {
  // set up css variables 
  setupCssVariables(settings);
  
  myNav = new Navigator([logView, entryForm, settingsPanel], 'main-container');
  document.getElementById('nav-container').innerHTML = myNav.render();
  myNav.postRender();

  // insert a spacer 'under' the fixed-position nav-container element
  insertSpacers('#nav-container');

  // SET UP ENTRY FORM
  entryForm.init(db, myNav, settings);

  // SET UP LOG VIEW
  logView.init(db, settings);
  
  // SET UP SETTINGS PANEL
  settingsPanel.init(settings);

  // NAVIGATE TO LOG VIEW TO START
  myNav.navigateTo(logView.id);
}

function setupCssVariables(settings) {
  document.documentElement.style.setProperty('--color-1', 'hsl(' + settings.color0User + ', 50%, 50%)');
  document.documentElement.style.setProperty('--color-1-dark', 'hsl(' + settings.color0User + ', 65%, 35%)');
  document.documentElement.style.setProperty('--color-2', 'hsl(' + settings.color1User + ', 50%, 50%)');
  document.documentElement.style.setProperty('--color-2-dark', 'hsl(' + settings.color1User + ', 65%, 35%)');
  document.documentElement.style.setProperty('--color-3', 'hsl(' + settings.color2User + ', 50%, 50%)');
  document.documentElement.style.setProperty('--color-3-dark', 'hsl(' + settings.color2User + ', 65%, 35%)');
}