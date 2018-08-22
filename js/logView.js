import logViewTemplate from '../templates/logView.hbs';
import logViewDisplay from '../templates/logViewDisplay.hbs';
import { bundlePromises } from './promiseHelpers';
import { insertSpacers } from './fixed-spacer';

let db;
let settings;
let logView;
let fixedSpacerObserver = new MutationObserver(mutations => {
  if (mutations.some(mutation => {
    return mutation.attributeName === 'class' || mutation.attributeName === 'style';
  })) {
    // set size of fixed-spacer (which we don't have yet) to size of log-view-filter
    let spacer = logView.querySelector('.fixed-position-spacer'); // this assumes we'll have only one in the log-view, which is true for now
    
    spacer.style.height = document.getElementById(spacer.dataset.spacerTarget).getBoundingClientRect().height + 'px';
  }
});

// EXPORTED FUNCTIONS & VARS
export const id = 'log-view';
export const buttonText = 'View Log';

let subButtonAnchor = '';
let windowResizeTimeout;

export function init(database, initialSettings) {
  db = database;
  settings = initialSettings;
}

export function render() {
  return bundlePromises([
      db.getByFrequency('subject'),
      db.getByFrequency('source'),
      db.getEntries({},{date: -1},settings.entriesPerPage)
    ],
    ['subjects','sources','entries']
  )
    .then(
      result => {
        let dateBlocks = createDateBlocks(result.entries.docs);
        let myObj = {};
        myObj.sources = result.sources;
        myObj.subjects = result.subjects;
        myObj.dateBlocks = dateBlocks;
        
        return logViewTemplate(myObj);
      },
      err => console.log('in log-view.js .render(): bundlePromises promise was rejected')
    );
  }

export function postRender() {
  // get ref to logView
  logView = document.getElementById(id);
  
  // insert spacer under log-view-filter;
  insertSpacers('#log-view-filter');
  
  // 
  attachListeners();
  
  attachMutationObservers();
}

function attachMutationObservers() {
  // ATTACH FIXED SPACER OBSERVER
  let targetNode = logView.querySelector('#log-view-filter'); // need to observer the whole log-view-filter b/c changes to filter message can also affect spacer
  let config = { characterData: false, childList: false, attributes: true, subtree: true };
  
  fixedSpacerObserver.observe(targetNode, config);
  
  // ATTACH OBSERVER TO 
}

function attachListeners() {
  // add click handlers for .log-entry objects
  document.getElementById(id).addEventListener('click',handleClick,false);

  // add resize listener to window for keeping sub button rows in order
  // THIS WILL NEED TO BE REMOVED WHENEVER WE LEAVE 
  window.addEventListener('resize', checkSubButtonPosition, false);  

  // add the onBlur handlers for date-filter-inputs 
  // Remember the third arg (true) is necessary for the log-view element
  // to capture the event; otherwise it won't see it, since is doesn't bubble
  document.getElementById(id).addEventListener('blur',handleDateInputEvent,true); 
  document.getElementById(id).addEventListener('change',handleDateInputEvent,false);
  document.getElementById(id).addEventListener('input',handleDateInputEvent,false);

  // delegating at a lower level here, to avoid listening to bunches
  // of unnecessary transitions
document.getElementById(id).querySelector('#log-view-filter__sub-button-group').addEventListener('transitionend',updateSubButtonNav,false);
}


function handleDateInputEvent(e) {
  if (!e.target.matches('.date-filter-input') || !e.target.value) return; // bail if we're not looking at a date-filter-input
      
  // VALIDATE
  let startDate = document.getElementById('start-date-input');
  let endDate = document.getElementById('end-date-input');
  let today = getEndOfToday();
  
  if (!startDate || !endDate || !startDate.value || !endDate.value || startDate.valueAsDate > today || endDate.valueAsDate > today || startDate.valueAsDate > endDate.valueAsDate) {
    document.getElementById('custom-date-filter-button').classList.remove('highlight');
  } else {
    let filterButton = document.getElementById('custom-date-filter-button');
    
    filterButton.classList.add('highlight');
    filterButton.focus();
  }
}

function showTooltip(targetEl,content) {
  let tooltip = document.createElement('div');
  tooltip.textContent = content;
  tooltip.classList.add('tooltip');
  tooltip.classList.add('tooltip-hidden');
  tooltip.id = 'tooltip';
  let firstElement = document.getElementById('first-element');
  
  document.body.insertBefore(tooltip,firstElement);
  
  // check width of tooltip
  let targetRect = targetEl.getBoundingClientRect();
  let tooltipRect = tooltip.getBoundingClientRect();
  
  tooltip.style.left = (targetRect.left - ((tooltipRect.width- targetRect.width) / 2)) + 'px';
  tooltip.style.top = (targetRect.top - tooltipRect.height - 10) + 'px';
  
  tooltip.classList.remove('tooltip-hidden');
  
  /*
  targetEl.focus();
    
  setTimeout(() => {
    targetEl.value = '';
  }, 1000);
  */
  
  setTimeout(() => {
    hideTooltip(tooltip);
    
  }, 1500);
}

function hideTooltip(tooltip) {
  tooltip.style.opacity = 0;
  
  setTimeout(() => {
    document.body.removeChild(tooltip);  
  }, 300);
}

function checkSubButtonPosition() {
  
  // check whether any el has the .active-group class
  let logViewEl = document.querySelector('#' + id)
  
  // NOTE: This is necessary b/c the event listener is added to the window
  if (!logViewEl) return; // bail if we're not in the log-view; 
  
  let visibleSubButtonRow = logViewEl.querySelector('.active-group');
  
  if (!visibleSubButtonRow) return; // bail if no sub button row is visible
  
  // Cancel any previously set but unexecuted timeout
  if (windowResizeTimeout) {
    window.cancelAnimationFrame(windowResizeTimeout)
  }
    
  windowResizeTimeout = window.requestAnimationFrame(() => {
    // make sure subButtonAnchor is visible by setting the container's marginTop
    // equal to the difference between the top of the bounding rect of the sliding
    // container's first child and the top of the subButtonAnchor's bounding rect
    let slidingContainer = document.querySelector('.sub-button-group.active-group > .sub-button-group__button-container');
    let slidingContainerFirstChild = slidingContainer.children[0];
        
    let subButtonAnchorEl = document.querySelector('[data-target="' + subButtonAnchor + '"]');
    
    slidingContainer.style.marginTop = (slidingContainerFirstChild.getBoundingClientRect().top -
                                       subButtonAnchorEl.getBoundingClientRect().top) + 'px';
  });
}

function handleClick(e) {
  if (e.target.matches('.log-entry__source')) {
    unhighlightActiveSubButton();
    hideSubButtonRow();
    filterEntries('source',e.target.textContent);
  } else if (e.target.matches('.log-entry__subject')) {
    unhighlightActiveSubButton();
    hideSubButtonRow();
    filterEntries('subject',e.target.textContent);
  } else if (e.target.closest('.log-entry')) {
    toggleLogEntry(e);
  } else if (e.target.matches('.log-view__button')) {
    toggleSubButtonRow(e);
  } else if (e.target.matches('#log-view-filter__message-button')) {
    clearFilter();
  } else if (e.target.matches('.sub-button-nav')) {
    slideSubButtonRow(e);
  } else if (e.target.matches('#log-view__search-submit-button')) {
    unhighlightActiveSubButton();
    hideSubButtonRow();
    executeSearch(e);
  } else if (e.target.matches('#log-view-filter__search-submit-button')) {
    unhighlightActiveSubButton();
    hideSubButtonRow();
    executeSearch(e);
  } else if (e.target.matches('.sub-button') && !e.target.matches('#custom-date-filter-button')) {
    if (e.target.matches('.active-button')) return; // bail if this button is already active
    let closestSubButtonGroup = e.target.closest('.sub-button-group');
    toggleSubButton(e);
    filterEntries(closestSubButtonGroup.dataset.queryType,e.target.dataset.target);
    
  } else if (e.target.matches('#custom-date-filter-button')) {
    filterEntriesByDateRange(e);
  }
}

function executeSearch(e) {
  let searchInputId = e.target.dataset.searchInput;
  
  // check if search input has content
  let searchInputEl = document.getElementById(searchInputId);
  
  let searchInputValue = searchInputEl.value.trim();
  
  // clear search input
  searchInputEl.value = '';

  if (searchInputValue === '') return; // bail if search term is empty
  
  db.getBySearchString(searchInputValue)
    .then(
      result => {
        updateLogViewDisplay('search',searchInputValue,result);
      },
      err => {
        document.getElementById('log-view-display').textContent = 'Error executing search for \'' + searchInputValue + '\'';
      }
    );
}

function findFirstElementInNextSubButtonRow() {
  // find top subButtonAnchor el
  let currentSubButtonAnchor = document.querySelector('[data-target="' + subButtonAnchor + '"]');

  // get its top
  let currentSubButtonAnchorTop = currentSubButtonAnchor.getBoundingClientRect().top;
  
  // find its index in the array of the buttonContainer's children
  let buttonContainerChildArray = Array.from(document.querySelector('.sub-button-group.active-group > .sub-button-group__button-container').children);
  
  // let currentSubButtonAnchorIndex = buttonContainerChildArray.indexOf(currentSubButtonAnchor); // for some reason this line doesn't work
  let currentSubButtonAnchorIndex = 0;
  
  for (let i = 0; i < buttonContainerChildArray.length; i++) {
    if (buttonContainerChildArray[i].dataset.target === subButtonAnchor) {
      currentSubButtonAnchorIndex = i;
      break;
    }
  }
  
  // start from current sub button anchor index and continue until you find a child with a different top value
  let newAnchorButtonText;
  
  for (let i = currentSubButtonAnchorIndex; i < buttonContainerChildArray.length; i++) {
    if (buttonContainerChildArray[i].getBoundingClientRect().top !== currentSubButtonAnchorTop) {
      return buttonContainerChildArray[i].dataset.target;
    }
  }
}

function findFirstElementInPreviousSubButtonRow() {
  
  // find subButtonAnchor el
  let currentSubButtonAnchor = document.querySelector('[data-target="' + subButtonAnchor + '"]');

  // find its index in the array of the buttonContainer's children
  let buttonContainerChildArray = Array.from(document.querySelector('.sub-button-group.active-group > .sub-button-group__button-container').children);
  // let currentSubButtonAnchorIndex = buttonContainerChildArray.indexOf(currentSubButtonAnchor);
  
  // let currentSubButtonAnchorIndex = buttonContainerChildArray.indexOf(currentSubButtonAnchor); // for some reason this line doesn't work
  let currentSubButtonAnchorIndex = 0;
  
  for (let i = 0; i < buttonContainerChildArray.length; i++) {
    if (buttonContainerChildArray[i].dataset.target === subButtonAnchor) {
      currentSubButtonAnchorIndex = i;
      break;
    }
  }
  
  // get the LAST element of the previous row and its boundingRect top
  let prevRowLastEl = buttonContainerChildArray[currentSubButtonAnchorIndex - 1];
  let prevRowTop = prevRowLastEl.getBoundingClientRect().top;
  let newAnchorButtonTarget;
  
  // work backward through preceding siblings until you find one with a different bounding rect top
  for (let i = currentSubButtonAnchorIndex - 2; i >= 0; i--) {
    if (buttonContainerChildArray[i].getBoundingClientRect().top !== prevRowTop) {
      return buttonContainerChildArray[i + 1].dataset.target;    
    }
  }
  
  return buttonContainerChildArray[0].dataset.target;
}

function slideSubButtonRow(e) {
  let direction = e.target.dataset.navDirection;

  // check that we can move forward
  let frame = document.getElementById('log-view-filter__sub-button-group');
  let slidingContainer = document.querySelector('.sub-button-group.active-group > .sub-button-group__button-container');
  let currentTopMargin = Number.parseInt(slidingContainer.style.marginTop) || 0;

  if (direction === 'forward') {
  
    if (!lastElementIsInFrame(slidingContainer, frame)) {
      // find first element in next visible row
      subButtonAnchor = findFirstElementInNextSubButtonRow();
      
      slidingContainer.style.marginTop = (currentTopMargin - frame.clientHeight) + 'px';
    } 
    
  } else if (direction === 'backward') {
    
    if (currentTopMargin !== 0) {
      // find top subButtonAnchor el
      let currentSubButtonAnchor = document.querySelector('[data-target="' + subButtonAnchor + '"]');

      // this is not right (REALLY?), though it is ok for getting the appropriate height
      subButtonAnchor = findFirstElementInPreviousSubButtonRow();
      
      slidingContainer.style.marginTop = (currentTopMargin + frame.clientHeight) + 'px';
    }
  }
}

function lastElementIsInFrame(slidingContainer, frame) {
  let frameTop = frame.getBoundingClientRect().top;
  let frameBot = frameTop + frame.clientHeight;
  let lastElTop = slidingContainer.lastElementChild.getBoundingClientRect().top;
  let lastElBot = slidingContainer.lastElementChild.getBoundingClientRect().bottom;

  if (lastElTop >= frameTop &&
      lastElTop <= frameBot && 
      lastElBot <= frameBot &&
      lastElBot >= frameTop) {
    return true;
  }
  
  return false;
}

function clearFilter() {
  // Hide filter message
  document.getElementById('log-view-filter__message').style.display = 'none';
  
  // Clear any active sub button
  let activeButton = document.querySelector('.sub-button.active-button');
  if (activeButton) activeButton.classList.remove('active-button');
  
  // Get all entries in db
  getAllEntries()
    .then(
      result => {
        // Add content to DOM
        document.getElementById('log-view-display').innerHTML = result;
      },
      error => {
        // just log to console for now
        console.log('promise rejected by getAllEntries()');
      }
    )
}

function getAllEntries() {
  return db.getEntries({},{date: -1},settings.entriesPerPage)
    .then(
      result => {
        // Chunk and render content
        let dateBlocks = createDateBlocks(result.docs);
        return logViewDisplay(dateBlocks);
      },
      error => console.log('there was an error in db.getEntries' + error.message)
    );
}

function filterEntriesByDateRange(e) {
  let startDateEl = document.getElementById('start-date-input');
  let endDateEl = document.getElementById('end-date-input');
  let startDate = startDateEl.valueAsDate;
  let endDate = endDateEl.valueAsDate;
  
  let today = getEndOfToday();
  
  let errors = [];
  
  if (startDate > today) {
    errors.push(startDateEl);  
  }
  
  if (endDate > today) {
    errors.push(endDateEl);
  }
  
  // if either date is in the future
  if (errors.length > 0) {

    // ...display tooltip 
    let tooltipAnchor = document.getElementById('custom-date-search');
    showTooltip(tooltipAnchor,'Dates cannot be later than today!');
    
    // ...move focus to first error
    setTimeout(() => {
      errors[0].focus();
    }, 750);

    // ...clear inputs
    if (errors.includes(startDateEl)) {
      setTimeout(() => {
        startDateEl.value = '';
      }, 750);
    }
    
    if (errors.includes(endDateEl)) {
      setTimeout(() => {
        endDateEl.value = '';
      }, 750);
    }
    
    return; // ...and bail out
  }
  
  // if start date is earlier than end date
  if (startDate > endDate) {
    
    // ...display tooltip
    let tooltipAnchor = document.getElementById('custom-date-search');
    showTooltip(tooltipAnchor,'Start date cannot be later than end date!');
    
    // ...move focus to start date, clear inputs
    setTimeout(() => {
      startDateEl.focus();
      startDateEl.value = '';
      endDateEl.value = '';
    }, 750);
    
    return; // ...and bail out
  }
  
  // If everything's okay, execute query
  let query = {};
  query.date = {};
  query.date.$gte = startDate;
  query.date.$lte = endDate;

    // Execute query
  db.getEntries(query, {date: -1},settings.entriesPerPage)
    .then(
      result => {
        updateLogViewDisplay('date-range',{startDate: getDateString(startDate), endDate: getDateString(endDate)},result.docs);
      },
      error => {
        console.log('query failed');
        console.log(error);
        document.getElementById('log-view-display'.innerHTML = 'There was an error querying by date.  ALSO THIS ERROR MESSAGE NEEDS TO BE MADE MORE INFORMATIVE!');
      }
  )

  
}

function filterEntriesByDateKeyword(queryContent) {
  let oneDay = 86400000;
  let oneWeek = oneDay * 7;
  let twoWeeks = oneDay * 14;
  let oneMonth = oneDay * 31;
  let twoMonths = oneDay * 62;
  
  let query = {};
  query.date = {};
  
  switch (queryContent) {
    case 'this-week': 
      query.date.$gt = new Date(Date.now() - oneWeek); // This MUST be a date object
      break;
    case 'last-week':
      query.date.$lte = new Date(Date.now() - oneWeek);
      query.date.$gt = new Date(Date.now() - twoWeeks);
      break;
    case 'this-month':
      query.date.$gt = new Date(Date.now() - oneMonth);
      break;
    case 'last-month':
      query.date.$lte = new Date(Date.now() - oneMonth);
      query.date.$gt = new Date(Date.now() - twoMonths);
  }
  
  // Execute query
  db.getEntries(query, {date: -1},settings.entriesPerPage)
    .then(
      result => {
        updateLogViewDisplay('date-keyword',queryContent.replace('-',' '),result.docs);
      },
      error => {
        console.log('query failed');
        console.log(error);
        document.getElementById('log-view-display'.innerHTML = 'There was an error querying by date.  ALSO THIS ERROR MESSAGE NEEDS TO BE MADE MORE INFORMATIVE!');
      }
  )
  
}

function filterEntries(queryType, queryContent) {
  // Pass date filters to separate function
  if (queryType === 'date') {
    filterEntriesByDateKeyword(queryContent);
    return;
  }
  
  // Handle source/subject filters here
  // Make query
  let query = {};
  query[queryType] = queryContent;
  
  db.getEntries(query,{date: -1},settings.entriesPerPage)
    .then(
      result => {
        updateLogViewDisplay(queryType, queryContent, result.docs);
      },
      error => {
        document.getElementById('log-view-display'.innerHTML = 'There was an error fetching log entries whose <strong>' + queryType + '</strong> is <strong>' + queryContent + '</strong>. Please try again later!');
      }
    );
}


function toggleLogEntry(e) {
  let targetEntry = e.target.closest('.log-entry');

  if (!targetEntry) return;

  let targetIsVisible = Array.from(targetEntry.classList).includes('log-entry__selected');

  if (targetIsVisible) {
    targetEntry.classList.remove('log-entry__selected');
  } else {
    // hide all others
    let elsToHide = Array.from(document.querySelectorAll('.log-entry'));
    elsToHide.forEach(el => el.classList.remove('log-entry__selected'));

    // show target
    targetEntry.classList.add('log-entry__selected');
  }
}

function toggleSubButton(e) {
  // If button is already active...
  if (e.target.matches('.active-button')) {
    
    // ...make it inactive 
    e.target.classList.remove('active-button');
    
    // ...and clear the filter
    clearFilter();
  } else {
    // otherwise, remove active-button class from currently active button (if there is one)
    let currentActiveButton = document.querySelector('.sub-button.active-button');
    if (currentActiveButton) {
      currentActiveButton.classList.remove('active-button');  
    }
    
    // and add it to the clicked button
    e.target.classList.add('active-button');
  }
}

// Add a method to hide the sub-button-row and
// unhighlight any highlighted sub-button
function hideSubButtonRow() {
  let logView = document.getElementById(id);

  // unhighlight log-view__button
  let highlightedButton = logView.querySelector('.log-view__button.active-button');
  
  if (highlightedButton) {
    highlightedButton.classList.remove('active-button');
  }
  
  // hide sub-button-group
  let activeSubButtonGroup = logView.querySelector('.sub-button-group.active-group');
  
  if(activeSubButtonGroup) {
    activeSubButtonGroup.classList.remove('active-group');
  }
}

function unhighlightActiveSubButton() {
  let logView = document.getElementById(id);
  
  // unhighlight sub button
  let highlightedSubButton = logView.querySelector('.sub-button.active-button');
  
  if(highlightedSubButton) {
    highlightedSubButton.classList.remove('active-button');
  }

}

function toggleSubButtonRow(e) {
  let targetSubButtonRow = document.getElementById('log-view-filter__' + e.target.dataset.target + '-sub-buttons');
  
  if (!targetSubButtonRow) return;
  
  // 1 Shift .active-button class to correct log-view__button
  // If button is already active
  if (e.target.matches('.active-button')) {
    
    // make it inactive
    e.target.classList.remove('active-button');
  } else {
    // ...otherwise remove the active-button class from any currently active button
    let activeButton = document.querySelector('.log-view__button.active-button');
    if (activeButton) activeButton.classList.remove('active-button');
        
    // and add it to the clicked button
    e.target.classList.add('active-button');
  }
    
  let targetIsVisible = Array.from(targetSubButtonRow.classList).includes('active-group');
    
  if(targetIsVisible) {
    // Hide row 
    targetSubButtonRow.classList.remove('active-group');
    
    // If it contains a .sub-button-group__button-container element, reset its top margin and remove the mutation observer
    let slidingContainer = targetSubButtonRow.querySelector('.sub-button-group__button-container');
    if (slidingContainer) {
      let navButtons = Array.from(targetSubButtonRow.querySelectorAll('.sub-button-nav'));
      navButtons.forEach(button => button.style.display = '');

      slidingContainer.style.marginTop = '0px';

      // Empty anchor element
      subButtonAnchor = '';
    } 
    
  } else {
    let activeRow = document.getElementsByClassName('active-group')[0];
    
    if (activeRow) {
      let slidingContainer = activeRow.querySelector('.sub-button-group__button-container');
      
      if (slidingContainer) {
        let navButtons = Array.from(activeRow.querySelectorAll('.sub-button-nav'));
        navButtons.forEach(button => button.style.display = '');
        
        slidingContainer.style.marginTop = '0px';
      }
      
      activeRow.classList.remove('active-group');
      
      subButtonAnchor = '';
    }
        
    targetSubButtonRow.classList.add('active-group');
    
    // set anchor button 
    if (targetSubButtonRow.dataset.queryType === 'source' || 
       targetSubButtonRow.dataset.queryType === 'subject') {
      let slidingContainer = targetSubButtonRow.querySelector('.sub-button-group__button-container');
      subButtonAnchor = slidingContainer.firstElementChild.dataset.target;  
    }
  }
}

function updateLogViewDisplay(filterType, filterContent, logEntries) {
  // Get ref to element for displaying filter message
  let filterMessageEl = document.getElementById('log-view-filter__message-text');
  
  // Build appropriate filter message
  let filterMessageText = '';
  
  // Check whether there were any results
  if (logEntries.length === 0) {
    filterMessageText = 'Found no log entries ';
  } else {
    filterMessageText = 'Currently displaying log entries ';
  }

  switch(filterType) {
    case 'search':
      filterMessageText += 'containing "<strong>' + filterContent + '</strong>"';
      break;
    case 'subject':
    case 'source':
      filterMessageText += 'whose <strong>' + filterType + '</strong> is "<strong>' + filterContent + '</strong>"';
      break;
    case 'date-keyword':
      filterMessageText += 'created <strong>' + filterContent + '</strong>';
      break;
    case 'date-range':
      filterMessageText += 'created between <strong>' + filterContent.startDate + '</strong> and <strong>' + filterContent.endDate + '</strong>';
      break;
  }
  
  filterMessageEl.innerHTML = filterMessageText;
  filterMessageEl.className = '';
  filterMessageEl.classList.add(filterType);
  
  let dateBlocks = createDateBlocks(logEntries); 
  
  // if we're in a small screen size (<600px, hide sub button row)
  if (window.innerWidth < 600) {
    hideSubButtonRow();
  }
  
  document.getElementById('log-view-filter__message').style.display = 'block'; 
  
  document.getElementById('log-view-display').innerHTML = logViewDisplay(dateBlocks); 
}

function createDateBlocks(entries) {
  let dateBlocks = [];
  let currentDate;
  let currentBlock = -1;
  entries.forEach(entry => {
    if (!currentDate || !sameDay(currentDate, entry.date)) {
      currentDate = entry.date;
      dateBlocks.push({
        date: getDateString(new Date(entry.date)),
        entries: []
      });
      currentBlock++;
    } 
    
    dateBlocks[currentBlock].entries.push(entry);
  });

  return dateBlocks;
}

function getDateString(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric'})
}

function getEndOfToday() {
  // get tomorrow
  let tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setHours(0);
  tomorrow.setMinutes(0);
  tomorrow.setSeconds(0);
  tomorrow.setMilliseconds(0); 
  return tomorrow;
}

function getToday() {
  let todayLocale = new Date(Date.now());
    
  todayLocale.setHours(0);
  todayLocale.setMinutes(0);
  todayLocale.setSeconds(0);
  todayLocale.setMilliseconds(1);
  
  let today = new Date(todayLocale.getTime() - (todayLocale.getTimezoneOffset() * 60000));
  
  console.log('in getToday()');
  console.log('returning today =',today.toUTCString());
  return today;
}

function sameDay(date1, date2) {
  if (date1.getUTCDate() === date2.getUTCDate() &&
     date1.getUTCMonth() === date2.getUTCMonth() &&
     date1.getUTCFullYear() === date2.getUTCFullYear()) {
    return true;
  }
  
  return false;
}

function updateSubButtonNav(e) { 
  // listen only to events fired by sub-button-group
  if (!e.target.matches('.sub-button-group__button-container')) return;

  console.log('updating sub button nav');
  
  // log rects of target and parent
  let targetRect = e.target.getBoundingClientRect();
  let parentRect = e.target.parentElement.getBoundingClientRect();
  
  let upButton = e.target.parentElement.querySelector('.previous-row-button')
  let downButton = e.target.parentElement.querySelector('.next-row-button')
  
  console.log('target top | parent top:',targetRect.top,'|',parentRect.top);
  console.log('target bottom | parent bottom:',targetRect.bottom,'|',parentRect.bottom);
  
  upButton.style.display = Math.abs(targetRect.top - parentRect.top) < 1 ? 'none' : 'inline-block';
  downButton.style.display = Math.abs(targetRect.bottom - parentRect.bottom) < 1 ? 'none' : 'inline-block';
}
