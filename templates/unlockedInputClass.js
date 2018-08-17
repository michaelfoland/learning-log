module.exports = function(lockState) {
  if (lockState === 'locked') {
    return 'hidden';
  }  
}

// FOR SOME REASON I CAN'T
// GET ES6 EXPORST TO WORK
/*
export function (lockedState) {
  if (lockedState === 'locked') {
    return 'hidden';
  }  
}
*/