WORDLE OFFLINE WORD LISTS
==========================

The game now reads exactly these two files:

  la-words.txt
    Words that are valid guesses AND may be selected as the daily/practice answer.

  ta-words.txt
    Words that are valid guesses but are NEVER selected as an answer.

FORMAT
------
Put one five-letter US-English word per line. Lowercase is recommended, but the
loader normalizes case. Blank lines and duplicate words are ignored. Only A-Z
five-letter entries are accepted.

To replace the bundled lists, overwrite these files in place:

  public/games/wordle/data/la-words.txt
  public/games/wordle/data/ta-words.txt

You do not need to edit game.js when replacing the lists.

The older answers.json and allowed-guesses.txt files may remain in the folder, but
this version of Wordle no longer reads them.
