export function bundlePromises(promiseArray, nameArray) {
  let returnBundle;
  let promisesFinished = 0;
  
  if (nameArray) {
    returnBundle = {};
  } else {
    returnBundle = new Array(promiseArray.length);
  }
    
  return new Promise((resolve, reject) => {
  
    promiseArray.forEach((promise,index,array) => {
      promise
        .then(
          result => {
            if (Array.isArray(returnBundle)) {
              returnBundle[index] = result;
            } else {
              returnBundle[nameArray[index]] = result;
            }

            promisesFinished++;
            
            if (promisesFinished === array.length) {
              resolve(returnBundle);
            }
          },
          error => {
            if (Array.isArray(returnBundle)) {
              returnBundle[index] = error;
            } else {
              returnBundle[nameArray[index]] = error;
            }

            promisesFinished++;
            
            if (promisesFinished === array.length) {
              resolve(returnBundle);
            }            
          }
        )
    });
  });
}
