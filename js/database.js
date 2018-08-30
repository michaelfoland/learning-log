import Datastore from '../node_modules/nedb/browser-version/out/nedb';

// load the collections
let learningLog = new Datastore({
  filename: 'learningLog',
  autoload: true,
  onload: onload,
  timestampData: true
});
let settings = new Datastore({ filename: 'settings', autoload: true, onload: onload });

// startup vars
let dbReady = false;
let maxChecks = 3;
let timeBetweenChecks = 1000; // check db every 1000 ms

// callbacks for whenever settings are updated
let settingsUpdateCallbacks = [];

function onload(err) {
  if (settings && learningLog) dbReady = true;

  if (err) console.log(err);
}

export function isReady(checkNum) {
  if (checkNum == null) checkNum = 0;

  return new Promise((resolve, reject) => {
    if (dbReady) {
      resolve(true);
    } else if (checkNum === maxChecks) {
      reject("db didn't load after " + maxChecks + ' checks');
    } else {
      setTimeout(() => {
        isReady(checkNum + 1).then(result => resolve(true), err => reject(err));
      }, timeBetweenChecks);
    }
  });
}

export function getSettings() {
  return new Promise((resolve, reject) => {
    settings.findOne({}, (err, doc) => {
      if (err) reject('error querying settings');

      resolve(doc);
    });
  });
}

export function updateSettings(newSettings) {
  sanitizeSettingsObject(newSettings);

  return new Promise((resolve, reject) => {
    settings.update({}, newSettings, { multi: false, upsert: true }, (err, num, docs, upsert) => {
      if (err) {
        reject('db error: unable to update settings');
      } else {
        settingsUpdateCallbacks.forEach((callback, index) => {
          console.log('=== database.updateSettings; calling callback #', index + 1);
          callback(newSettings);
        });

        resolve(docs);
      }
    });
  });
}

function sanitizeSettingsObject(newSettings) {
  let settingTypes = [
    'sourceLength',
    'subjectLength',
    'titleLength',
    'sourcePrompts',
    'subjectPrompts',
    'entriesPerPage'
  ];

  // confirm that all user values are between min and max,
  // if not, set to default
  settingTypes.forEach(type => {
    if (
      !(newSettings[type + 'User'] <= newSettings[type + 'Max']) ||
      !(newSettings[type + 'User'] >= newSettings[type + 'Min'])
    ) {
      newSettings[type + 'User'] = newSettings[type + 'Default'];
    }
  });

  let colors = ['color0', 'color1', 'color2'];

  colors.forEach(color => {
    if (!(newSettings[color + 'User'] >= 0) || !(newSettings[color + 'User'] < 360)) {
      newSettings[color + 'User'] = newSettings[color + 'Default'];
    }
  });
}

export function getAll(prop) {
  let query = {};
  query[prop] = { $exists: true };
  let projection = {};
  projection[prop] = 1;

  return new Promise((resolve, reject) => {
    learningLog.find(query, projection, (err, docs) => {
      if (err) {
        reject("error in finding the property '" + prop + "'in learningLog");
      }
      let countObject = {};

      docs.forEach(doc => {
        if (countObject.hasOwnProperty(doc[prop])) {
          countObject[doc[prop]]++;
        } else {
          countObject[doc[prop]] = 1;
        }
      });

      let countArray = [];

      for (let key in countObject) {
        countArray.push({ prop: key, count: countObject[key] });
      }

      countArray.sort((a, b) => b.count - a.count);

      resolve(countArray.map(obj => obj.prop));
    });
  });
}

export function logDbContents() {
  learningLog.find({}, (err, docs) => {
    if (err) {
      console.log(err);
    } else {
      docs.forEach((doc, index) => {
        console.log('doc ', index + 1, ':');

        for (let key in doc) {
          if (doc.hasOwnProperty(key)) {
            console.log('\t' + key + ':\t' + doc[key]);
          }
        }
      });
    }
  });
}

export function getBySearchString(searchString) {
  // split string and make sure there are no empty strings
  let terms = searchString.split(' ');

  terms = terms.filter(term => term.trim() !== '').map(term => '\\b' + term + '\\b'); // Need to escape \b, otherwise javascript understands it as \u0008

  // create queries from search terms
  let queries = [];

  terms.forEach(term => {
    queries.push({ title: RegExp(term, 'i') });
    queries.push({ details: RegExp(term, 'i') });
  });

  // execute queries on db
  return new Promise((resolve, reject) => {
    getEntries({ $or: queries }).then(result => resolve(result), err => reject(err));
  });
}

export function getByFrequency(prop) {
  let query = {};

  query[prop] = { $exists: true };
  let projection = {};
  projection[prop] = 1;

  return new Promise((resolve, reject) => {
    learningLog.find(query, projection, (err, docs) => {
      if (err) {
        reject("error in finding the property '" + prop + "'in learningLog");
      }

      // Calculate how many of each prop there all
      let counts = {};

      docs.forEach(doc => {
        if (counts.hasOwnProperty(doc[prop])) {
          counts[doc[prop]]++;
        } else {
          counts[doc[prop]] = 1;
        }
      });

      let countArr = [];

      for (var property in counts) {
        countArr.push([property, counts[property]]);
      }

      countArr = countArr
        .sort((a, b) => {
          return a[1] < b[1];
        })
        .map(item => item[0]);

      resolve(countArr);
    });
  });
}

export function getAllEntries() {
  return new Promise((resolve, reject) => {
    getEntries({}).then(result => resolve(result), err => reject(err));
  });
}

export function getEntries(query) {
  console.log('=== database getEntries()');
  return new Promise((resolve, reject) => {
    learningLog
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .exec((err, docs) => {
        if (err) {
          reject({
            message: 'error executing query',
            query: query
          });
        } else {
          resolve({
            message: 'successfully executed query',
            query: query,
            docs: docs
          });
        }
      });
  });
}

export function add(newEntry) {
  return new Promise((resolve, reject) => {
    learningLog.insert(newEntry, (err, doc) => {
      if (err) {
        reject({
          message: 'error inserting doc',
          doc: doc
        });
      } else {
        resolve({
          message: 'successfully inserted doc',
          doc: doc
        });
      }
    });
  });
}

export function addSettingsUpdateCallback(callback) {
  settingsUpdateCallbacks.push(callback);
}
