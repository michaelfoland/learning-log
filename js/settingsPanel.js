import settingsPanelTemplate from '../templates/settingsPanel.hbs';
import * as db from './database';
export const id = 'settings-panel';
export const buttonText = 'Settings';

export function render() {
  db.logDbContents();
  
  let dummyData = { time: Date.now() % 10000 };
  
  return new Promise((resolve, reject) => {
    resolve(settingsPanelTemplate(dummyData));
  })
  
  
  
  
  // return settingsPanelTemplate(dummyData);
}

export function postRender() {
  // nothing right now
  console.log('executing settingsPanel postRender()');
}