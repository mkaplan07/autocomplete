// node ~/Desktop/docs/autocomplete/autocomplete.js

const fs = require('fs');

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

function scanDir(dirOnly) {
  let startingDir = process.cwd();
  let rawResults = fs.readdirSync(startingDir, { withFileTypes: true });

  if (dirOnly) {
    rawResults = rawResults.filter(rr => rr.isDirectory());
  }

  return rawResults.map(rr => rr.name);
}

function findMatches(chars, results) {
  return results.filter(res => res.toLowerCase().startsWith(chars.join('')));
}

function cycleMatches(chars, choices, results) {
  process.stdout.cursorTo(0);

  let matches = findMatches(chars, results);
  let latest = choices[choices.length -1];

  if (!matches.length) {
    console.log('No matches');
    displayLine(chars);
    return;
  } else if (!choices.length || matches[matches.length - 1] === latest) {
    choices.push(matches[0]);
  } else {
    choices.push(matches[matches.indexOf(latest) + 1])
  }

  console.log(`${choices[choices.length -1]}`);
  process.stdout.write(chars.join(''));
}

let choice = '';

function matchCheck(chars, results) {
  let matches = findMatches(chars, results);
  if (!chars.join()) { // 3)
    choice = `\nThat's an empty string`
  } else if (matches.length) {
    choice = `\nYou chose ${matches[0]}`;
  } else {
    choice = '\nNo such entry';
  }
}

function setChoice(chars, choices, results) {
  let latest = choices[choices.length -1] || ''; // 1) to avoid another if
  // 2) latest && --> if (latest === ''), skip to else
  if (latest && latest.toLowerCase().startsWith(chars.join(''))) {
    choice = `\nYou chose ${latest}`;
  } else {
    matchCheck(chars, results);
  }
}

function displayHelp() {
  console.log(`
    'tab' to cycle matches
    'return' to select
    'backspace' to delete input
    'ctrl-c' to quit

    arrow keys are not supported
    `);
}

function displayLine(chars) { // TODO: note the reason for each
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(chars.join(''));
}

let unsupported = ['left', 'right', 'up', 'down'];

function autocomplete(dirOnly) {
  let results = scanDir(dirOnly);

  console.log(`=> Which directory or file?`);

  let chars = [];
  let choices = [];

  process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
      process.stdout.cursorTo(0);
      process.exit();

    } else if (key.name === 'tab') {
      cycleMatches(chars, choices, results);

    } else if (key.name === 'return') {
      setChoice(chars, choices, results);
      process.stdin.destroy();

    } else if (key.name === 'space') {
      displayHelp();
      displayLine(chars);

    } else if (key.name === 'backspace') {
      chars.pop();
      displayLine(chars);

    } else if (unsupported.includes(key.name)) {
      console.log(` ${key.name} not supported`);
      displayLine(chars);

    } else {
      chars.push(key.name);
      displayLine(chars);
    }
  });
}

function awaitChoice() {
  if (!choice) {
    setTimeout(() => {
      awaitChoice();
    }, 500);
  } else {
    console.log(choice);
    // TODO: return file/dir to main ?????.split, .pop
  }
}

autocomplete(true);
awaitChoice();
