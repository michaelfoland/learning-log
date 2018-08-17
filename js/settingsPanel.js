import settingsPanelTemplate from '../templates/settingsPanel.hbs';

export const id = 'settings-panel';
export const buttonText = 'Settings';

export function render() {
  let dummyData = { time: Date.now() % 10000 };
  
  return settingsPanelTemplate(dummyData);
}

export function postRender() {
  // nothing right now
  console.log('executing settingsPanel postRender()');
}