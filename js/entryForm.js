import entryFormTemplate from '../templates/entryForm.hbs';
import newEntryFeedbackTemplate from '../templates/newEntryFeedback.hbs';
import { rowData } from './entryFormRowData.js';
import { bundlePromises } from './promiseHelpers';

let settings;
let navigator;
let db;

let entryFormFocusOrder = ['date', 'source', 'subject', 'title', 'details'];

// EXPORTED FUNCTIONS/VARS
export const id = 'entry-form';
export const buttonText = 'Add Items';

export function init(database, theNavigator, initialSettings) {
  db = database;
  settings = initialSettings;
  navigator = theNavigator;

  db.addSettingsUpdateCallback(updateSettings);

  getSourcesAndSubjects();
}

export function render() {
  return getSourcesAndSubjects().then(
    result => entryFormTemplate({ rows: rowData }),
    error => entryFormTemplate({ rows: rowData })
  );
}

export function postRender() {
  // Set up all listeners/handlers
  attachListeners();
  initializeInputFields();
  initializeDate();
}

function getSourcesAndSubjects() {
  // Get sources and subjects from db
  return bundlePromises([db.getAll('source'), db.getAll('subject')], ['sources', 'subjects']).then(
    result => {
      updateSources(result.sources);
      updateSubjects(result.subjects);
    },
    err => console.log('=== entryForm.getSourcesAndSubjects(): error')
  );
}

function addItemToDb(obj) {
  db.add(obj)
    .then(
      result => result,
      error => {
        // TODO: Actually implement a feedback template in case of db error
        console.log('ENTRY FORM: got error from promise');
      }
    )
    .finally(() => {
      // Create and insert feedback template
      let t = newEntryFeedbackTemplate({});
      document.getElementById('overlay-content-panel').innerHTML = t;

      entryFeedbackTemplatePostRender();
    });
}

function entryFeedbackTemplatePostRender() {
  document.getElementById('new-entry-feedback').addEventListener('click', function(e) {
    if (e.target.dataset.navTarget === 'log-view') {
      navigator.navigateTo('log-view');
    } else if (e.target.dataset.navTarget === 'entry-form') {
      navigator.navigateTo('entry-form'); // renavigating allows us to immediately get the new
      // sources and subjects into the prompt clouds
    }
  });

  document.getElementById('new-entry-feedback__entry-form-button').addEventListener('blur', () => {
    document.getElementById('new-entry-feedback__log-view-button').focus();
  });

  // move focus to entry feedback template
  document.getElementById('new-entry-feedback__log-view-button').focus();
}

export function updateSources(newSources) {
  rowData.filter(row => row.row === 'source')[0].promptCloudMembers = newSources.slice(
    0,
    settings.sourcePromptsUser
  );
}

export function updateSubjects(newSubjects) {
  rowData.filter(row => row.row === 'subject')[0].promptCloudMembers = newSubjects.slice(
    0,
    settings.subjectPromptsUser
  );
}

// END EXPORTED FUNCTIONS
function updateSettings(newSettings) {
  settings = newSettings;
}

function attachListeners() {
  document.getElementById('entry-form').addEventListener('click', handleClick, false);
  document.getElementById('entry-form').addEventListener('blur', handleBlur, true);
  document.getElementById('entry-form').addEventListener('focus', handleFocus, true);
  document.getElementById('entry-form').addEventListener('change', handleInputAndChange, false);
  document.getElementById('entry-form').addEventListener('input', handleInputAndChange, false);
}

function initializeInputFields() {
  document.getElementById('source-input').maxLength = settings.sourceLengthUser;
  document.getElementById('source-input-chars').textContent = document.getElementById(
    'source-input'
  ).value.length;
  document.getElementById('source-input-max-chars').textContent = settings.sourceLengthUser;
  document.getElementById('subject-input').maxLength = settings.subjectLengthUser;
  document.getElementById('subject-input-chars').textContent = document.getElementById(
    'subject-input'
  ).value.length;
  document.getElementById('subject-input-max-chars').textContent = settings.subjectLengthUser;
  document.getElementById('title-input').maxLength = settings.titleLengthUser;
  document.getElementById('title-input-chars').textContent = document.getElementById(
    'title-input'
  ).value.length;
  document.getElementById('title-input-max-chars').textContent = settings.titleLengthUser;
}

function handleFocus(e) {
  if (e.target.matches('.unlocked-input-value')) {
    removeError(e);
  }

  let row;

  if (e.target.closest('.entry-form__row')) {
    row = e.target.closest('.entry-form__row');

    e.preventDefault();

    window.scrollTo({
      top: getScrollTop() + row.getBoundingClientRect().top - getFixedPositionSpacerHeight(),
      behavior: 'smooth'
    });
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
  if (e.relatedTarget == null) return; // when tag cloud button is clicked

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
  if (e.key !== 'Tab') return; // bail if key wasn't tab

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

function handleInputAndChange(e) {
  if (
    e.target.id === 'source-input' ||
    e.target.id === 'subject-input' ||
    e.target.id === 'title-input'
  ) {
    updateInputChars(e.target);
  }
}

// Changed this method to accept an element rather than
// an event because it's sometimes called after an event
// that is not happening on the input (viz, a tag cloud item click)
function updateInputChars(inputEl) {
  document.getElementById(inputEl.id + '-chars').textContent = inputEl.value.length;
}

function unlockInput(e) {
  // Hide locked view
  e.target.parentElement.classList.add('hidden');

  // Show input view
  e.target.parentElement.parentElement.querySelector('.unlocked-input').classList.remove('hidden');

  // Give focus to appropriate input
  var entryRow = e.target.id.replace(/edit-|-button/g, '');

  document.getElementById(entryRow + '-input').focus();
}

function lockInput(e) {
  var inputEl = e.target;
  var wordArray;
  var wordString;

  if (inputEl.value.trim() === '') return; // bail if input is empty

  // Get the row whose input we're locking
  var type = inputEl.id.replace('-input', '');

  // Set value of that row's locked input display
  if (type === 'date') {
    wordString = getDateString(inputEl.valueAsDate);
  } else if (type === 'title') {
    wordArray = inputEl.value.split(' ');
    wordString = wordArray.slice(0, 7).join(' ');

    if (wordArray.length > 7) {
      wordString += '...';
    }
  } else if (type === 'details') {
    wordArray = inputEl.value.split(' ');
    wordString = wordArray.slice(0, 15).join(' ');

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
  // Perhaps modify this to jump to input that hasn't been locked?
  var newType = entryFormFocusOrder[entryFormFocusOrder.indexOf(type) + 1];
  if (newType) {
    document.getElementById(newType + '-input').focus();
  } else {
    document.getElementById('submit-button').focus();
  }
}

function checkForm(e) {
  // Get all inputs
  var inputs = Array.from(document.getElementsByClassName('unlocked-input-value'));

  // Check each input; if anything is empty, toggle an error class
  // on the appropriate entry-form row
  var rowsInError = [];
  var propName;
  var newLogData = {};

  inputs.forEach(function(input) {
    if (input.value === '') {
      rowsInError.push(input.id.replace('-input', ''));
    }
  });

  if (rowsInError.length > 0) {
    rowsInError.forEach(function(row) {
      document.getElementById(row + '-input').classList.add('error');
      scrollToTop();
    });
  } else {
    inputs.forEach(function(input) {
      propName = input.id.replace('-input', '');

      if (input.id === 'date-input') {
        newLogData[propName] = input.valueAsDate;
      } else {
        newLogData[propName] = input.value;
      }
    });

    // update view to show that submission is taking place
    // add overlay with centered div
    let target = document.getElementById('overlay');
    target.style.height =
      document.getElementsByTagName('body')[0].getBoundingClientRect().height + 'px';
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
  var entryDate = document.getElementById('date-entry');
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function removeError(e) {
  e.target.classList.remove('error');
}

// This is not specific to this module.  It should
// eventually be imported from somewhere else.
function getDateString(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function initializeDate() {
  document.getElementById('date-entry').textContent = getDateString(new Date());
  document.getElementById('date-input').valueAsDate = new Date(Date.now());
}

function populateCloud(type) {
  if (!cloudItems[type]) return;

  var parent = document.getElementById('entry-form').querySelector('#' + type + '-cloud');
  var cloudItem;

  var contents = cloudItems[type];

  contents.forEach(function(item) {
    cloudItem = document.createElement('span');
    cloudItem.textContent = item;
    cloudItem.setAttribute('data-parent-cloud', type);
    cloudItem.classList.add('cloud-item');
    parent.appendChild(cloudItem);
  });
}

function getCustomCssProp(propName) {
  return getComputedStyle(document.documentElement).getPropertyValue(propName);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getScrollTop() {
  return Math.floor(document.documentElement.scrollTop || document.body.scrollTop);
}

function getFixedPositionSpacerHeight() {
  // find height of all spacers
  let spacers = Array.from(document.getElementsByClassName('fixed-position-spacer'));

  return spacers.reduce((acc, curr) => {
    return acc + curr.scrollHeight;
  }, 0);
}
