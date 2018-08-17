module.exports = function(lockState) {
  if (lockState !== 'locked') {
    return 'hidden';
  }
}