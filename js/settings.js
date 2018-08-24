// This will have more stuff in the future
export const defaultSettings = {
  sourceLengthMin: 20,
  sourceLengthDefault: 50,
  sourceLengthUser: 50,
  sourceLengthMax: 100,
  subjectLengthMin: 20,
  subjectLengthDefault: 50,
  subjectLengthUser: 50,
  subjectLengthMax: 100,  
  titleLengthMin: 50,
  titleLengthDefault: 100,
  titleLengthUser: 100,
  titleLengthMax: 200,
  sourcePromptsMin: 0,
  sourcePromptsDefault: 10,
  sourcePromptsUser: 10,
  sourcePromptsMax: 50,
  subjectPromptsMin: 0,
  subjectPromptsDefault: 10,
  subjectPromptsUser: 10,
  subjectPromptsMax: 50,
  entriesPerPageMin: 5,
  entriesPerPageDefault: 20,
  entriesPerPageUser: 20,
  entriesPerPageMax: 50,
  color0: 200,
  color1: 40,
  color2: 120
};

// export defaultSettings;

/* 
let pushSettings = null;

export function setPushSettingsCallback(callback) {
  pushSettings = callback;
}

export function getSettings(subset) {
  return JSON.parse(JSON.stringify(settings));
}

function updateSettings() {
  if (!pushSettings) return;
  
  // clone settings object; is there a better way?  
  pushSettings(JSON.parse(JSON.stringifiy(settings)));
}
*/