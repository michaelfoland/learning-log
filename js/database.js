import Datastore from '../node_modules/nedb/browser-version/out/nedb'; // I think this is right

// load the db
let learningLog = new Datastore({filename: 'learningLog', autoload: true });


export function getAll(prop) {
  let query = {}
  query[prop] = {$exists: true};
  let projection = {};
  projection[prop] = 1;
  
  
  return new Promise((resolve, reject) => {
    learningLog.find(
      query,
      projection,
      (err, docs) => {
        if (err) {
          reject('error in finding the property \''+prop+'\'in learningLog');
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
          countArray.push({prop: key, count: countObject[key]});
        }
        
        countArray.sort((a,b) => b.count - a.count);
                
        resolve(countArray.map(obj => obj.prop));
      });
  });
}

export function logDbContents() {
  learningLog.find({}, (err, docs) => {
    if (err) console.log('can\'t log db contents for some reason');
    
    console.log('===============');
    
    docs.forEach((doc, index) => {
      console.log('doc ',(index + 1),':');
      
      for (let key in doc) {
        if (doc.hasOwnProperty(key)) {
          console.log('\t'+key+':\t'+doc[key]);
        }
      }
    })
  });
}

export function getBySearchString(searchString) {
  // split string and make sure there are no empty strings
  let terms = searchString.split(' ');
  
  terms = terms
    .filter(term => term.trim() !== '')
    .map(term => '\\b' + term + '\\b'); // Need to escape backslash, otherwise javascript understands it as \u0008

  // create queries from search terms
  let queries = [];
    
  terms.forEach(term => {
    queries.push({title: RegExp(term, 'i')});
    queries.push({details: RegExp(term, 'i')});
  });
  
  // execute queries on db
  return new Promise((resolve, reject) => {
    learningLog.find({ $or: queries}, (err, docs) => {
      if (err) {
        reject('error in getBySearchString(), searching for \''+searchString+'\'');
      }
      console.log('=== database.getBySearchString() ===');
      console.log('docs found:',docs);
      resolve(docs);
    });
  });
}

export function getByFrequency(prop) {
  let query = {}
  
  query[prop] = {$exists: true};
  let projection = {};
  projection[prop] = 1;

  return new Promise((resolve, reject) => {
    learningLog.find(query, projection, (err,docs) => {
      if (err) {
        reject('error in finding the property \''+prop+'\'in learningLog');
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
        countArr.push([property,counts[property]]);
      }
      
      countArr = countArr
        .sort((a,b) => {
          return a[1] < b[1];
        })
        .map(item => item[0]); 
            
      resolve(countArr);
    })
  })
}

export function getEntries(query, sortParam, limit) {
  console.log('=== database getEntries()');
  
  if (!sortParam) {
    return new Promise((resolve, reject) => {
      learningLog.find(query).limit(limit).exec((err, docs) => {
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
  } else {
    return new Promise((resolve, reject) => {
      learningLog.find(query).sort(sortParam).limit(limit).exec((err, docs) => {
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
  

}

export function add(newEntry) {
  console.log('=== database add()');
  
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
