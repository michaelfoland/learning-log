// This will have more stuff in the future
let settings = {
  entryForm: {
    maxLengths: {
      source: 50,
      subject: 50,
      title: 100
    },
    maxButtons: {
      source: 0,
      subject: 5
    }
  },
  logView: {
    entriesPerPage: 10
  },
  global: {
    colors: [200, 40, 120]
  }
};

let pushSettings = null;

export function setPushSettingsCallback(callback) {
  pushSettings = callback;
}

export function getSettings(subset) {
  console.log('=== getSettings');
  
  if (!subset) { 
    return JSON.parse(JSON.stringify(settings));
  }
  
  if (settings[subset]) {
    console.log(JSON.parse(JSON.stringify(settings[subset])));
    return JSON.parse(JSON.stringify(settings[subset]));
  } else {
    return undefined; // is this best?
  }
}

function updateSettings() {
  if (!pushSettings) return;
  
  // clone settings object; is there a better way?  
  pushSettings(JSON.parse(JSON.stringifiy(settings)));
}