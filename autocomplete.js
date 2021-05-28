const fs = require('fs');

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

/*
process.cwd() returns cwd;
__dirname is the module's directory

node ~/Desktop/docs/autocomplete/autocomplete.js
*/
let startingDir = process.cwd();
let unfilteredResults = fs.readdirSync(startingDir, { withFileTypes: true });
let results = [];
unfilteredResults.forEach(rr => {
  if (rr.isDirectory()) {
    results.push(rr.name);
  }
});

function getMatches(chars) {
  return results.filter(res => res.toLowerCase().startsWith(chars.join('')));
}

function cycleMatches(chars, choices) {
  process.stdout.cursorTo(0);

  let matches = getMatches(chars);
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

function chooseMatch(chars) {
  let matches = getMatches(chars);
  if (matches.length) {
    directory = matches[0];
  } else {
    directory = chars.join('');
  }
}

function displayHelp() {
  console.log(`
    * * * * *
    press 'tab' to cycle through directories
    press 'return' to select a directory
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

function setDir() {
  console.log(`=> Which directory?`);

  let chars = [];
  let choices = [];

  process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
      process.stdout.cursorTo(0);
      process.exit();

    } else if (key.name === 'tab') {
      cycleMatches(chars, choices);

    } else if (key.name === 'return') {
      if (choices.length) {
        chooseLatest(chars, choices);
      } else {
        chooseMatch(chars);
      }
      process.stdin.destroy();

    } else if (key.name === 'space') {
      displayHelp();
      displayLine(chars);

    } else if (key.name === 'backspace') {
      choices.length = 0; // TODO: choices = [] ?
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
    return directory;
  }
}

setDir();
awaitDirectory();
