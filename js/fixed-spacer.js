/*  This function creates a div that occupies the space
    under a fixed position element and automatically resizes
    on window resize. NOTE: This assumes that the element will NOT
    resize for any other reason, so this is not a solution
    for fixed position elements with dynamic content.   */
 
let resizeTimeout = null;

export function insertSpacers(targetSelector) {
  
  // Get target elements
  let targetElements = Array.from(document.querySelectorAll(targetSelector));
  
  // For each target element add an element into the document directly after it
  // to occupy the space that would otherwise be hidden under it
  let newDiv;
  
  targetElements.forEach((element) => {
    newDiv = document.createElement('div');
    newDiv.setAttribute('data-spacer-target',element.id);
    newDiv.classList.add('fixed-position-spacer');
    newDiv.style.height = element.getBoundingClientRect().height + 'px';
      
    element.insertAdjacentElement('afterend',newDiv);
  });
  
  window.addEventListener('resize', function(targetSelector) {
    // If there's a timeout set, cancel it
    if (resizeTimeout) {
      window.cancelAnimationFrame(resizeTimeout);
    }
    
    resizeTimeout = window.requestAnimationFrame(function() {
      let spacers = Array.from(document.getElementsByClassName('fixed-position-spacer'));      
      spacers.forEach((spacer) => {
        spacer.style.height = document.getElementById(spacer.dataset.spacerTarget).getBoundingClientRect().height + 'px';
      })
    })
    
  })
}
