// imports
import * as db from './database';
import { bundlePromises } from './promiseHelpers';
import { Navigator } from './navigator';
import { insertSpacers } from './fixed-spacer';
import * as entryForm from './entryForm';
import * as logView from './logView';
import * as settingsPanel from './settingsPanel';
import * as appSettings from './settings';

// SET UP NAVBAR
const myNav = new Navigator([logView, entryForm, settingsPanel], 'main-container');
document.getElementById('nav-container').innerHTML = myNav.render();
myNav.postRender();

// insert a spacer 'under' the fixed-position nav-container element
insertSpacers('#nav-container');

// SET UP ENTRY FORM
entryForm.init(db, myNav, appSettings.getSettings());

appSettings.setPushSettingsCallback(function(obj) {
  entryForm.updateSettings(obj.entryForm);
})

// SET UP LOG VIEW
logView.init(db, appSettings.getSettings());

// NAVIGATE TO LOG VIEW TO START
// myNav.navigateTo(logView.id);
myNav.navigateTo(settingsPanel.id);

