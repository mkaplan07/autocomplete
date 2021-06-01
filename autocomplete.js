const fs = require('fs');

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

/*
process.cwd() returns cwd;
__dirname is the module's directory

node ~/Desktop/docs/autocomplete/autocomplete.js
*/
function scanDir(dirOnly) {
  let startingDir = process.cwd();
  let rawResults = fs.readdirSync(startingDir, { withFileTypes: true });

  if (dirOnly) {
    rawResults = rawResults.filter(rr => rr.isDirectory());
  }

  return rawResults.map(rr => rr.name);
}

function getMatches(chars, results) {
  return results.filter(res => res.toLowerCase().startsWith(chars.join('')));
}

function cycleMatches(chars, choices, results) {
  process.stdout.cursorTo(0);

  let matches = getMatches(chars, results);
  let latest = choices[choices.length -1];

  if (!matches.length) {
    console.log('No matches.');
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

let directory = '';

function chooseLatest(chars, choices) {
  let latest = choices[choices.length -1];
  if (latest.toLowerCase().startsWith(chars.join(''))) {
    directory = latest;
  } else {
    directory = chars.join('');
  }
}

function chooseMatch(chars, results) {
  let matches = getMatches(chars, results);
  if (matches.length) {
    directory = matches[0];
  } else {
    directory = chars.join('');
  }
}

function displayHelp() {
  console.log(`
    * * * * *
    press 'tab' to cycle matches
    press 'return' to select
    press 'backspace' to delete input
    press 'ctrl-c' to quit

    arrow keys are not supported
    * * * * *
    `);
}

function displayLine(chars) { // TODO: reason for each?
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(chars.join(''));
}

let unsupported = ['left', 'right', 'up', 'down'];

function setDir(dirOnly) {
  let results = scanDir(dirOnly);

  console.log(`=> Which directory?`); // TODO: change prompt & ctrl-f "director"

  let chars = [];
  let choices = [];

  process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
      process.stdout.cursorTo(0);
      process.exit();

    } else if (key.name === 'tab') {
      cycleMatches(chars, choices, results);

    } else if (key.name === 'return') {
      if (choices.length) {
        chooseLatest(chars, choices);
      } else {
        chooseMatch(chars, results);
      }
      process.stdin.destroy();

    } else if (key.name === 'space') {
      displayHelp();
      displayLine(chars);

    } else if (key.name === 'backspace') {
      choices.length = 0;
      chars.pop();
      displayLine(chars);

    } else if (unsupported.includes(key.name)) {
      console.log(`\n${key.name} not supported`);
      displayLine(chars);

    } else {
      chars.push(key.name);
      displayLine(chars);
    }
  });
}

function awaitDirectory() {
  if (!directory) {
    setTimeout(() => {
      awaitDirectory();
    }, 500);
  } else {
    console.log(`\nYou chose ${directory}.`);
    return directory; // TODO: verify that file/directory is returned to main
  }
}

setDir(false);
awaitDirectory();
