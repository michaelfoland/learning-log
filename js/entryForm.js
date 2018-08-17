import entryFormTemplate from '../templates/entryForm.hbs';
import newEntryFeedbackTemplate from '../templates/newEntryFeedback.hbs';
import { rowData } from './entryFormRowData.js';
import { bundlePromises } from './promiseHelpers';

// App.js will provide this
// let dbCallback = null;
let settings;  
let navigator;
let db;

// NOTE: Someday this could probably be replaced by
// something generated directly from rowData, so that
// it can be modified more easily
let entryFormFocusOrder = ['date','source','subject','title','details']

// EXPORTED FUNCTIONS/VARS
export const id = 'entry-form';
export const buttonText = 'Add Items';

export function init(database, theNavigator, initialSettings) {
  db = database;
  settings = initialSettings;
  navigator = theNavigator;
  
  getSourcesAndSubjects();
}

function getSourcesAndSubjects() {
  // Get sources and subjects from db
  return bundlePromises([db.getAll('source'),db.getAll('subject')], ['sources','subjects'])
  .then(
    result => {
      updateSources(result.sources);
      updateSubjects(result.subjects);
      console.log('ENTRY-FORM: leaving success callback of getSourcesAndSubjects()');
    },
    err => console.log('problem in bundlePromises()')
  );

}

export function render() {
  console.log('ENTRY-FORM: calling getSourcesAndSubjects()');
  return getSourcesAndSubjects()
    .then(
      result => entryFormTemplate({rows: rowData}),
      error => entryFormTemplate({rows: rowData})
    );
}

export function postRender() {
  // Set up all listeners/handlers
  attachListeners();
  initializeInputFields();
  initializeDate();
}

function addItemToDb(obj) {
  console.log('=== entry-form: adding item to db');
  
  
  db.add(obj)
    .then(
      result => console.log('ENTRY FORM: got result from promise'),
      error => console.log('ENTRY FORM: got error from promise')
    )
    .finally(() => {
      // Render the entryFormTemplate with rowData
      let t = newEntryFeedbackTemplate({});

      // Put rendered template into document
      document.getElementById('overlay-content').innerHTML = t;
    
      entryFeedbackTemplatePostRender();
    });
}

function entryFeedbackTemplatePostRender() {
  document.getElementById('new-entry-feedback').addEventListener('click', function(e) {
    if (e.target.dataset.navTarget === 'log-view') {
      // document.getElementById('overlay').style.display = 'none';
      navigator.navigateTo('log-view');
    } else if (e.target.dataset.navTarget === 'entry-form') {
      document.getElementById('overlay').style.display = 'none'; // necessary?
      navigator.navigateTo('entry-form'); // renavigating allows us to immediately get the new
                                          // sources and subjects into the clouds
    }
  });
}


export function updateSources(newSources) {
  // cloudItems.sources = newSources;
  rowData.filter(row => row.row === 'source')[0].promptCloudMembers = newSources;
}

export function updateSubjects(newSubjects) {
  // cloudItems.subjects = newSubjects;
  rowData.filter(row => row.row === 'subject')[0].promptCloudMembers = newSubjects;
}

export function updateSettings(newSettings) {
  settings = newSettings;
}

// END EXPORTED FUNCTIONS

function attachListeners() {
  document.getElementById('entry-form').addEventListener('click', handleClick, false);
  document.getElementById('entry-form').addEventListener('blur', handleBlur, true);
  document.getElementById('entry-form').addEventListener('focus', handleFocus, true);
  document.getElementById('entry-form').addEventListener('change', handleInputAndChange, false);
  document.getElementById('entry-form').addEventListener('input', handleInputAndChange, false);
}

function initializeInputFields() {
  document.getElementById('source-input').maxLength = settings.maxLengths.source;
  document.getElementById('source-input-chars').textContent = document.getElementById('source-input').textLength;
  document.getElementById('source-input-max-chars').textContent = settings.maxLengths.source;
  document.getElementById('subject-input').maxLength = settings.maxLengths.subject;
  document.getElementById('subject-input-chars').textContent = document.getElementById('subject-input').textLength;
  document.getElementById('subject-input-max-chars').textContent = settings.maxLengths.subject;
  document.getElementById('title-input').maxLength = settings.maxLengths.title;
  document.getElementById('title-input-chars').textContent = document.getElementById('title-input').textLength;
  document.getElementById('title-input-max-chars').textContent = settings.maxLengths.title;
}

function handleFocus(e) {
  if (e.target.matches('.unlocked-input-value')) {
    removeError(e);
  }
}

function handleClick(e) {
  if (e.target.matches('.locked-input-button')) {
    unlockInput(e);
  } else if (e.target.matches('.cloud-item')) {
    fillInputAndLock(e);
  } else if (e.target.matches('#reset-button')) {
    clearForm();
  } else if (e.target.matches('#submit-button')) {
    checkForm(e);
  }
}

function fillInputAndLock(e) {
  console.log('=== fillInputAndLock()');
  var parentCloud = e.target.dataset.parentCloud;
  var input = document.getElementById(parentCloud + '-input');
  input.value = e.target.textContent;

  updateInputChars(input);
  
  document.getElementById(parentCloud + '-entry').textContent = e.target.textContent;

  e.target.parentElement.parentElement.classList.add('hidden');
  e.target.parentElement.parentElement.nextElementSibling.classList.remove('hidden');

  // Move focus to next input
  var newRow = entryFormFocusOrder[entryFormFocusOrder.indexOf(parentCloud) + 1];
  document.getElementById(newRow + '-input').focus();
}

function handleBlur(e) {
  if (e.target.matches('.unlocked-input-value')) {
  
    // Special code for handling date
    if (e.target.id === 'date-input') {

      if (e.originalTarget.getAttribute('aria-label') === 'Year') {

        // Replace year value of date-input with rawValue from explicit original target
        var newDate = e.originalTarget.getAttribute('rawvalue') + e.target.value.substring(4);

        e.target.value = newDate;

        e.preventDefault();
        lockInput(e);
      }
    } else if (e.target.value.trim() !== '') {
      e.preventDefault();
      lockInput(e);
    }
    
  }
}



function checkForTab(e) {
  // console.log('=== checkForTab()');
  
  if (e.key !== 'Tab') return; // bail if key wasn't tab
  
  // console.log('\tdidn\'t bail');
  
  // Special code for handling date
  if (e.target.id === 'date-input') {
    // console.log('\ttarget id is date-input');
    
    if (e.originalTarget.getAttribute('aria-label') === 'Year') {
      // console.log('\t\te.originalTarget.getAttribute === \'year\'');
      
      // Replace year value of date-input with rawValue from explicit original target
      var newDate = e.originalTarget.getAttribute('rawvalue') + e.target.value.substring(4);
      // console.log('e.target =',e.target);
      // console.log('e.originalTarget =',e.originalTarget);
      
      e.target.value = newDate;
      
      e.preventDefault();
      lockInput(e);
    }
  } else if (e.target.value.trim() !== '') {
    e.preventDefault();
    // event.stopPropagation();
    lockInput(e);
  }
}



function handleInputAndChange(e) {
  // I feel like there should be a cleaner way to 
  // do this, but I'm not sure how
  if (e.target.id === 'source-input' ||
     e.target.id === 'subject-input' ||
     e.target.id === 'title-input') {
    updateInputChars(e.target);
  }
}

// Changed this method to accept an element rather than 
// an event because it's sometimes called after an event
// that is not happening on the input (viz, a tag cloud item click)
function updateInputChars(inputEl) {
  console.log('=== updateInputChars for',inputEl.id);
  console.log('\tevent.target.value =',inputEl.value);
  
  document.getElementById(inputEl.id + '-chars').textContent = inputEl.textLength;
}

function unlockInput(e) {
  // Hide locked view
  e.target.parentElement.classList.add('hidden');

  // Show input view PREVIOUS VERSION; CHANGED TO BE SLIGHTLY LESS DEPENDENT ON MARKUP
  // e.target.parentElement.previousElementSibling.classList.remove('hidden');
  e.target.parentElement.parentElement.querySelector('.unlocked-input').classList.remove('hidden');

  // Give focus to appropriate input
  var entryRow = e.target.id.replace(/edit-|-button/g,'');

  document.getElementById(entryRow + '-input').focus();
}

function lockInput(e) {
  // console.log('=== lockInput()');
  
  var inputEl = e.target;
  var wordArray; 
  var wordString;

  if (inputEl.value.trim() === '') return; // bail if input is empty

  // Get the row whose input we're locking
  var type = inputEl.id.replace('-input','');

  // Set value of that row's locked input display
  if (type === 'date') {
    wordString = getDateString(inputEl.valueAsDate);
  } else if (type === 'title') {
    wordArray = inputEl.value.split(' ');  
    wordString = wordArray.slice(0,7).join(' ');

    if (wordArray.length > 7) {
      wordString += '...';
    }
  } else if (type === 'details') {
    wordArray = inputEl.value.split(' ');
    wordString = wordArray.slice(0,15).join(' ');

    if (wordArray.length > 15) {
      wordString += '...';
    }
  } else {
    wordString = inputEl.value;
  }

  document.getElementById(type + '-entry').textContent = wordString;  

  // Hide input area
  inputEl.parentElement.classList.add('hidden');
  
  // Show entry display area
  inputEl.parentElement.parentElement.querySelector('.locked-input').classList.remove('hidden');

  // Move focus to next item
  // Perhaps modify this to jump to input that haven't been locked?
  var newType = entryFormFocusOrder[entryFormFocusOrder.indexOf(type) + 1];
  if (newType) {
    document.getElementById(newType + '-input').focus();  
  } else {
    document.getElementById('submit-button').focus();
  }

}


function checkForm(e) {
  console.log('=== checkForm()');
  
  // Get all inputs
  var inputs = Array.from(document.getElementsByClassName('unlocked-input-value'));

  // Check each input; if anything is empty, toggle an error class
  // on the appropriate entry-form row
  var rowsInError = [];
  var propName;
  var newLogData = {};
  
  inputs.forEach(function(input) {
    if (input.value === '') {
      rowsInError.push(input.id.replace('-input',''));
    }
  });

  if (rowsInError.length > 0) {
    console.log('\tthere are some errors');
    rowsInError.forEach(function(row) {
      document.getElementById(row + '-input').classList.add('error');
    })
  } else {
    inputs.forEach(function(input) {
      propName = input.id.replace('-input','');      
      
      if (input.id === 'date-input') {
        newLogData[propName] = input.valueAsDate;
      } else {
        newLogData[propName] = input.value;  
      }
    });

    // update view to show that submission is taking place
    // add overlay with centered div
    let target = document.getElementById('overlay');
    target.style.height = document.getElementsByTagName('body')[0].getBoundingClientRect().height + 'px';
    target.style.display = 'flex';
    
    addItemToDb(newLogData);
  }
}

function clearForm() {
  // clear all free-input and locked-input items
  var freeInputEls = Array.from(document.getElementsByClassName('unlocked-input-value'));

  freeInputEls.forEach(function(el) {
    el.value = '';
    el.parentElement.classList.remove('hidden');
  });

  var lockedInputEls = Array.from(document.getElementsByClassName('locked-input-value'));

  lockedInputEls.forEach(function(el) {
    el.textContent = '';
    el.parentElement.classList.add('hidden');
  });

  // Update date section
  var dateInput = document.getElementById('date-input');
  dateInput.valueAsDate = new Date(Date.now());
  dateInput.parentElement.classList.add('hidden');
  var entryDate =  document.getElementById('date-entry');
  entryDate.textContent = getDateString(new Date(Date.now()));
  entryDate.parentElement.classList.remove('hidden');

  // Update all input char counts
  var charMonitors = Array.from(document.getElementsByClassName('char-monitor'));
  charMonitors.forEach(function(monitor) {
    monitor.firstElementChild.textContent = '0';
  });

  // Remove any error classes
  var entryRows = Array.from(document.getElementsByClassName('entry-form__content'));

  entryRows.forEach(function(row) {
    row.classList.remove('error');
  });

  // Scroll back to top
  window.scrollTo({top: 0, behavior: 'smooth'});
}


function removeError(e) {
  e.target.classList.remove('error');
}

// This is not specific to this module.  It should 
// eventually be imported from somewhere else.
function getDateString(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric'})
}

function initializeDate() {
  console.log('== entry-form initializeDate()');
  document.getElementById('date-entry').textContent = getDateString(new Date());
  document.getElementById('date-input').valueAsDate = new Date(Date.now());
}

function populateCloud(type) {
  console.log('=== populateCloud()');
  
  if (!cloudItems[type]) return;
  
  var parent = document.getElementById('entry-form').querySelector('#' + type + '-cloud');
  var cloudItem;

  var contents = cloudItems[type];

  contents.forEach(function(item) {
    cloudItem = document.createElement('span');
    cloudItem.textContent = item;
    cloudItem.setAttribute('data-parent-cloud',type);
    cloudItem.classList.add('cloud-item');
    parent.appendChild(cloudItem);
  });
}

function getCustomCssProp(propName) {
  return getComputedStyle(document.documentElement).getPropertyValue(propName);
}

/*
export function displayIn(parentNodeId) {
  // Get sources and subjects from db
  bundlePromises([db.getAll('source'),db.getAll('subject')], ['sources','subjects'])
  .then(
    result => {
      updateSources(result.sources),
      updateSubjects(result.subjects)

      // Render the entryFormTemplate with rowData
      var rendered = entryFormTemplate({rows: rowData});

      // Put rendered template into document
      document.getElementById(parentNodeId).innerHTML = rendered;
  
      // Set up all listeners/handlers
      attachListeners();
      initializeInputFields();
      initializeDate();
    },
    err => console.log('problem from bundlePromises()')
  );
}
*/


/*
export function init(callback, sources, subjects) {
  dbCallback = callback;
  // are these necessary or can I put data directly into rowData?
  updateSources(sources); // this updates entryForm state; 
  updateSubjects(subjects); // this updates entryForm state
}


function handleKeydown(e) {
  if (e.target.matches('.unlocked-input-value')) {
    checkForTab(e);
  }
}
*/
