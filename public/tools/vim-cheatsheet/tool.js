"use strict";

(() => {
  const groups = [
  {
    "name": "Modes, Help, and Basics",
    "entries": [
      {
        "keys": "i",
        "action": "Enter Insert mode before the cursor",
        "mode": "Normal"
      },
      {
        "keys": "I",
        "action": "Enter Insert mode at the first non-blank character",
        "mode": "Normal"
      },
      {
        "keys": "a",
        "action": "Enter Insert mode after the cursor",
        "mode": "Normal"
      },
      {
        "keys": "A",
        "action": "Enter Insert mode at end of line",
        "mode": "Normal"
      },
      {
        "keys": "o",
        "action": "Open a new line below and enter Insert mode",
        "mode": "Normal"
      },
      {
        "keys": "O",
        "action": "Open a new line above and enter Insert mode",
        "mode": "Normal"
      },
      {
        "keys": "R",
        "action": "Enter Replace mode",
        "mode": "Normal"
      },
      {
        "keys": "gR",
        "action": "Enter Virtual Replace mode",
        "mode": "Normal"
      },
      {
        "keys": "v",
        "action": "Start characterwise Visual mode",
        "mode": "Normal"
      },
      {
        "keys": "V",
        "action": "Start linewise Visual mode",
        "mode": "Normal"
      },
      {
        "keys": "<C-v>",
        "action": "Start blockwise Visual mode",
        "mode": "Normal"
      },
      {
        "keys": "<Esc>",
        "action": "Return to Normal mode / cancel an operation",
        "mode": "Any"
      },
      {
        "keys": ":help {topic}",
        "action": "Open help for a topic",
        "mode": "Command"
      },
      {
        "keys": ":h {topic}",
        "action": "Short form of :help",
        "mode": "Command"
      },
      {
        "keys": "<C-]>",
        "action": "Follow the help tag or tag under cursor",
        "mode": "Normal"
      },
      {
        "keys": "<C-t>",
        "action": "Jump back from a tag",
        "mode": "Normal"
      },
      {
        "keys": ":version",
        "action": "Show Vim version and build features",
        "mode": "Command"
      },
      {
        "keys": ":messages",
        "action": "Show recent messages",
        "mode": "Command"
      },
      {
        "keys": "g<C-g>",
        "action": "Show detailed cursor and selection statistics",
        "mode": "Normal/Visual"
      },
      {
        "keys": "<C-g>",
        "action": "Show current file name, status, and cursor position",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Basic Cursor Movement",
    "entries": [
      {
        "keys": "h / <Left>",
        "action": "Move left",
        "mode": "Normal"
      },
      {
        "keys": "j / <Down>",
        "action": "Move down one display line",
        "mode": "Normal"
      },
      {
        "keys": "k / <Up>",
        "action": "Move up one display line",
        "mode": "Normal"
      },
      {
        "keys": "l / <Right>",
        "action": "Move right",
        "mode": "Normal"
      },
      {
        "keys": "gj",
        "action": "Move down one screen line when wrapping",
        "mode": "Normal"
      },
      {
        "keys": "gk",
        "action": "Move up one screen line when wrapping",
        "mode": "Normal"
      },
      {
        "keys": "0",
        "action": "Move to the first character of the line",
        "mode": "Normal"
      },
      {
        "keys": "^",
        "action": "Move to the first non-blank character",
        "mode": "Normal"
      },
      {
        "keys": "$",
        "action": "Move to the end of the line",
        "mode": "Normal"
      },
      {
        "keys": "g_",
        "action": "Move to the last non-blank character",
        "mode": "Normal"
      },
      {
        "keys": "|",
        "action": "Move to screen column [count]",
        "mode": "Normal"
      },
      {
        "keys": "f{char}",
        "action": "Jump forward to the next character on the line",
        "mode": "Normal"
      },
      {
        "keys": "F{char}",
        "action": "Jump backward to the previous character on the line",
        "mode": "Normal"
      },
      {
        "keys": "t{char}",
        "action": "Jump forward to just before a character",
        "mode": "Normal"
      },
      {
        "keys": "T{char}",
        "action": "Jump backward to just after a character",
        "mode": "Normal"
      },
      {
        "keys": ";",
        "action": "Repeat the last f, F, t, or T motion",
        "mode": "Normal"
      },
      {
        "keys": ",",
        "action": "Repeat the last character-find motion in reverse",
        "mode": "Normal"
      },
      {
        "keys": "%",
        "action": "Jump to matching bracket, brace, parenthesis, or conditional",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Word and Token Movement",
    "entries": [
      {
        "keys": "w",
        "action": "Move to the start of the next word",
        "mode": "Normal"
      },
      {
        "keys": "W",
        "action": "Move to the start of the next WORD (whitespace-delimited)",
        "mode": "Normal"
      },
      {
        "keys": "e",
        "action": "Move to the end of the current/next word",
        "mode": "Normal"
      },
      {
        "keys": "E",
        "action": "Move to the end of the current/next WORD",
        "mode": "Normal"
      },
      {
        "keys": "b",
        "action": "Move to the start of the previous word",
        "mode": "Normal"
      },
      {
        "keys": "B",
        "action": "Move to the start of the previous WORD",
        "mode": "Normal"
      },
      {
        "keys": "ge",
        "action": "Move to the end of the previous word",
        "mode": "Normal"
      },
      {
        "keys": "gE",
        "action": "Move to the end of the previous WORD",
        "mode": "Normal"
      },
      {
        "keys": "]w",
        "action": "Move to the start of the next word",
        "mode": "Normal"
      },
      {
        "keys": "[w",
        "action": "Move to the start of the previous word",
        "mode": "Normal"
      },
      {
        "keys": "]W",
        "action": "Move to the start of the next WORD",
        "mode": "Normal"
      },
      {
        "keys": "[W",
        "action": "Move to the start of the previous WORD",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Lines, Paragraphs, Sentences, and Document",
    "entries": [
      {
        "keys": "gg",
        "action": "Go to the first line",
        "mode": "Normal"
      },
      {
        "keys": "G",
        "action": "Go to the last line, or line [count]",
        "mode": "Normal"
      },
      {
        "keys": "{count}G",
        "action": "Go to an exact line number",
        "mode": "Normal"
      },
      {
        "keys": "{count}gg",
        "action": "Go to an exact line number",
        "mode": "Normal"
      },
      {
        "keys": ": {number}",
        "action": "Go to an exact line number",
        "mode": "Command"
      },
      {
        "keys": "'{mark}",
        "action": "Jump to the marked line",
        "mode": "Normal"
      },
      {
        "keys": "`{mark}",
        "action": "Jump to the exact marked position",
        "mode": "Normal"
      },
      {
        "keys": "(",
        "action": "Move to the previous sentence",
        "mode": "Normal"
      },
      {
        "keys": ")",
        "action": "Move to the next sentence",
        "mode": "Normal"
      },
      {
        "keys": "{",
        "action": "Move to the previous paragraph",
        "mode": "Normal"
      },
      {
        "keys": "}",
        "action": "Move to the next paragraph",
        "mode": "Normal"
      },
      {
        "keys": "[[",
        "action": "Move to the previous section/function start",
        "mode": "Normal"
      },
      {
        "keys": "]]",
        "action": "Move to the next section/function start",
        "mode": "Normal"
      },
      {
        "keys": "[]",
        "action": "Move to the previous section/function end",
        "mode": "Normal"
      },
      {
        "keys": "][",
        "action": "Move to the next section/function end",
        "mode": "Normal"
      },
      {
        "keys": "[(",
        "action": "Move to previous unmatched (",
        "mode": "Normal"
      },
      {
        "keys": "])",
        "action": "Move to next unmatched )",
        "mode": "Normal"
      },
      {
        "keys": "[{",
        "action": "Move to previous unmatched {",
        "mode": "Normal"
      },
      {
        "keys": "]}",
        "action": "Move to next unmatched }",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Screen Movement and Scrolling",
    "entries": [
      {
        "keys": "H",
        "action": "Move cursor to top of screen",
        "mode": "Normal"
      },
      {
        "keys": "M",
        "action": "Move cursor to middle of screen",
        "mode": "Normal"
      },
      {
        "keys": "L",
        "action": "Move cursor to bottom of screen",
        "mode": "Normal"
      },
      {
        "keys": "<C-e>",
        "action": "Scroll window down one line",
        "mode": "Normal"
      },
      {
        "keys": "<C-y>",
        "action": "Scroll window up one line",
        "mode": "Normal"
      },
      {
        "keys": "<C-d>",
        "action": "Scroll down half a screen",
        "mode": "Normal"
      },
      {
        "keys": "<C-u>",
        "action": "Scroll up half a screen",
        "mode": "Normal"
      },
      {
        "keys": "<C-f>",
        "action": "Scroll forward one screen",
        "mode": "Normal"
      },
      {
        "keys": "<C-b>",
        "action": "Scroll backward one screen",
        "mode": "Normal"
      },
      {
        "keys": "zz",
        "action": "Center current line in the window",
        "mode": "Normal"
      },
      {
        "keys": "zt",
        "action": "Place current line at top of window",
        "mode": "Normal"
      },
      {
        "keys": "zb",
        "action": "Place current line at bottom of window",
        "mode": "Normal"
      },
      {
        "keys": "z<CR>",
        "action": "Place current line at top and move to first non-blank",
        "mode": "Normal"
      },
      {
        "keys": "z.",
        "action": "Center current line and move to first non-blank",
        "mode": "Normal"
      },
      {
        "keys": "z-",
        "action": "Place current line at bottom and move to first non-blank",
        "mode": "Normal"
      },
      {
        "keys": "zs",
        "action": "Scroll horizontally so cursor is at left edge",
        "mode": "Normal"
      },
      {
        "keys": "ze",
        "action": "Scroll horizontally so cursor is at right edge",
        "mode": "Normal"
      },
      {
        "keys": "zh / zl",
        "action": "Scroll horizontally left / right",
        "mode": "Normal"
      },
      {
        "keys": "zH / zL",
        "action": "Scroll horizontally half-screen left / right",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Text Objects",
    "entries": [
      {
        "keys": "iw / aw",
        "action": "Inner word / a word including surrounding space",
        "mode": "Operator/Visual"
      },
      {
        "keys": "iW / aW",
        "action": "Inner WORD / a WORD",
        "mode": "Operator/Visual"
      },
      {
        "keys": "is / as",
        "action": "Inner sentence / a sentence",
        "mode": "Operator/Visual"
      },
      {
        "keys": "ip / ap",
        "action": "Inner paragraph / a paragraph",
        "mode": "Operator/Visual"
      },
      {
        "keys": "i\" / a\"",
        "action": "Inside double quotes / including quotes",
        "mode": "Operator/Visual"
      },
      {
        "keys": "i' / a'",
        "action": "Inside single quotes / including quotes",
        "mode": "Operator/Visual"
      },
      {
        "keys": "i` / a`",
        "action": "Inside backticks / including backticks",
        "mode": "Operator/Visual"
      },
      {
        "keys": "i( / a(",
        "action": "Inside parentheses / including parentheses",
        "mode": "Operator/Visual"
      },
      {
        "keys": "ib / ab",
        "action": "Alias for i( / a(",
        "mode": "Operator/Visual"
      },
      {
        "keys": "i[ / a[",
        "action": "Inside square brackets / including brackets",
        "mode": "Operator/Visual"
      },
      {
        "keys": "i{ / a{",
        "action": "Inside braces / including braces",
        "mode": "Operator/Visual"
      },
      {
        "keys": "iB / aB",
        "action": "Alias for i{ / a{",
        "mode": "Operator/Visual"
      },
      {
        "keys": "i< / a<",
        "action": "Inside angle brackets / including brackets",
        "mode": "Operator/Visual"
      },
      {
        "keys": "it / at",
        "action": "Inside an XML/HTML tag / including tag",
        "mode": "Operator/Visual"
      }
    ]
  },
  {
    "name": "Visual Selection",
    "entries": [
      {
        "keys": "v",
        "action": "Characterwise selection",
        "mode": "Normal"
      },
      {
        "keys": "V",
        "action": "Linewise selection",
        "mode": "Normal"
      },
      {
        "keys": "<C-v>",
        "action": "Blockwise selection",
        "mode": "Normal"
      },
      {
        "keys": "o",
        "action": "Move to the other end of the selection",
        "mode": "Visual"
      },
      {
        "keys": "O",
        "action": "Move to the other corner of a block selection",
        "mode": "Visual Block"
      },
      {
        "keys": "gv",
        "action": "Reselect the previous Visual area",
        "mode": "Normal"
      },
      {
        "keys": "v_o",
        "action": "Switch selection endpoint",
        "mode": "Visual"
      },
      {
        "keys": "~",
        "action": "Toggle case in selection",
        "mode": "Visual"
      },
      {
        "keys": "U",
        "action": "Uppercase selection",
        "mode": "Visual"
      },
      {
        "keys": "u",
        "action": "Lowercase selection",
        "mode": "Visual"
      },
      {
        "keys": "g~",
        "action": "Toggle case using a motion",
        "mode": "Visual"
      },
      {
        "keys": "gU",
        "action": "Uppercase using a motion",
        "mode": "Visual"
      },
      {
        "keys": "gu",
        "action": "Lowercase using a motion",
        "mode": "Visual"
      },
      {
        "keys": "I",
        "action": "Insert at start of every selected block line",
        "mode": "Visual Block"
      },
      {
        "keys": "A",
        "action": "Append at end of every selected block line",
        "mode": "Visual Block"
      },
      {
        "keys": "r{char}",
        "action": "Replace every selected character",
        "mode": "Visual"
      },
      {
        "keys": "> / <",
        "action": "Indent / unindent selection",
        "mode": "Visual"
      },
      {
        "keys": "=",
        "action": "Reindent selection",
        "mode": "Visual"
      },
      {
        "keys": "gq",
        "action": "Format selected text",
        "mode": "Visual"
      }
    ]
  },
  {
    "name": "Operators and Operator Patterns",
    "entries": [
      {
        "keys": "d{motion}",
        "action": "Delete text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "c{motion}",
        "action": "Change text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "y{motion}",
        "action": "Yank text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": ">{motion}",
        "action": "Indent text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "<{motion}",
        "action": "Unindent text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "={motion}",
        "action": "Auto-indent text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "gq{motion}",
        "action": "Format text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "gu{motion}",
        "action": "Lowercase text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "gU{motion}",
        "action": "Uppercase text covered by a motion",
        "mode": "Normal"
      },
      {
        "keys": "g~{motion}",
        "action": "Toggle case over a motion",
        "mode": "Normal"
      },
      {
        "keys": "!{motion}{cmd}",
        "action": "Filter text through an external command",
        "mode": "Normal"
      },
      {
        "keys": "{count}{operator}{motion}",
        "action": "Repeat an operator over a count",
        "mode": "Normal"
      },
      {
        "keys": "d2w / 2dw",
        "action": "Delete two words; counts can precede operator or motion",
        "mode": "Normal"
      },
      {
        "keys": "dv{motion}",
        "action": "Force a characterwise operator",
        "mode": "Normal"
      },
      {
        "keys": "dV{motion}",
        "action": "Force a linewise operator",
        "mode": "Normal"
      },
      {
        "keys": "d<C-v>{motion}",
        "action": "Force a blockwise operator",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Delete and Change",
    "entries": [
      {
        "keys": "x",
        "action": "Delete character under cursor",
        "mode": "Normal"
      },
      {
        "keys": "X",
        "action": "Delete character before cursor",
        "mode": "Normal"
      },
      {
        "keys": "s",
        "action": "Delete character and enter Insert mode",
        "mode": "Normal"
      },
      {
        "keys": "S",
        "action": "Change entire line",
        "mode": "Normal"
      },
      {
        "keys": "dd",
        "action": "Delete current line",
        "mode": "Normal"
      },
      {
        "keys": "D",
        "action": "Delete from cursor to end of line",
        "mode": "Normal"
      },
      {
        "keys": "dw",
        "action": "Delete to start of next word",
        "mode": "Normal"
      },
      {
        "keys": "de",
        "action": "Delete through end of word",
        "mode": "Normal"
      },
      {
        "keys": "db",
        "action": "Delete backward to start of word",
        "mode": "Normal"
      },
      {
        "keys": "diw / daw",
        "action": "Delete inner word / a word",
        "mode": "Normal"
      },
      {
        "keys": "di\" / da\"",
        "action": "Delete inside quotes / including quotes",
        "mode": "Normal"
      },
      {
        "keys": "dip / dap",
        "action": "Delete inner paragraph / a paragraph",
        "mode": "Normal"
      },
      {
        "keys": "cc",
        "action": "Change current line",
        "mode": "Normal"
      },
      {
        "keys": "C",
        "action": "Change from cursor to end of line",
        "mode": "Normal"
      },
      {
        "keys": "cw",
        "action": "Change to start of next word",
        "mode": "Normal"
      },
      {
        "keys": "ce",
        "action": "Change through end of word",
        "mode": "Normal"
      },
      {
        "keys": "ciw / caw",
        "action": "Change inner word / a word",
        "mode": "Normal"
      },
      {
        "keys": "ci\" / ca\"",
        "action": "Change inside quotes / including quotes",
        "mode": "Normal"
      },
      {
        "keys": "cit / cat",
        "action": "Change inside tag / including tag",
        "mode": "Normal"
      },
      {
        "keys": "r{char}",
        "action": "Replace one character",
        "mode": "Normal"
      },
      {
        "keys": "gr{char}",
        "action": "Virtual replace one character",
        "mode": "Normal"
      },
      {
        "keys": "J",
        "action": "Join current line with next, adding space",
        "mode": "Normal"
      },
      {
        "keys": "gJ",
        "action": "Join lines without adding or removing spaces",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Yank, Put, and Registers",
    "entries": [
      {
        "keys": "yy / Y",
        "action": "Yank current line",
        "mode": "Normal"
      },
      {
        "keys": "y{motion}",
        "action": "Yank text covered by motion",
        "mode": "Normal"
      },
      {
        "keys": "yiw / yaw",
        "action": "Yank inner word / a word",
        "mode": "Normal"
      },
      {
        "keys": "p",
        "action": "Put after cursor or below current line",
        "mode": "Normal"
      },
      {
        "keys": "P",
        "action": "Put before cursor or above current line",
        "mode": "Normal"
      },
      {
        "keys": "gp / gP",
        "action": "Put and leave cursor after inserted text",
        "mode": "Normal"
      },
      {
        "keys": "]p / [p",
        "action": "Put with indentation adjusted",
        "mode": "Normal"
      },
      {
        "keys": "\"{reg}{command}",
        "action": "Use a named register for the next command",
        "mode": "Normal"
      },
      {
        "keys": "\"ayy",
        "action": "Yank line into register a",
        "mode": "Normal"
      },
      {
        "keys": "\"ap",
        "action": "Put register a",
        "mode": "Normal"
      },
      {
        "keys": "\"Ayy",
        "action": "Append yanked line to register a",
        "mode": "Normal"
      },
      {
        "keys": "\"0p",
        "action": "Put the most recently yanked text",
        "mode": "Normal"
      },
      {
        "keys": "\"1p",
        "action": "Put the most recently deleted/change text",
        "mode": "Normal"
      },
      {
        "keys": "\"-p",
        "action": "Put the most recent small deletion",
        "mode": "Normal"
      },
      {
        "keys": "\"_d{motion}",
        "action": "Delete into the black-hole register",
        "mode": "Normal"
      },
      {
        "keys": "\"+y / \"+p",
        "action": "Yank to / put from system clipboard",
        "mode": "Normal"
      },
      {
        "keys": "\"*y / \"*p",
        "action": "Yank to / put from selection clipboard",
        "mode": "Normal"
      },
      {
        "keys": ":registers / :reg",
        "action": "List register contents",
        "mode": "Command"
      },
      {
        "keys": "<C-r>{reg}",
        "action": "Insert register contents in Insert/Command mode",
        "mode": "Insert/Command"
      },
      {
        "keys": "\"=expression<CR>p",
        "action": "Evaluate an expression and put its result",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Undo, Redo, and Repeating",
    "entries": [
      {
        "keys": "u",
        "action": "Undo the last change",
        "mode": "Normal"
      },
      {
        "keys": "U",
        "action": "Undo all latest changes on the current line",
        "mode": "Normal"
      },
      {
        "keys": "<C-r>",
        "action": "Redo",
        "mode": "Normal"
      },
      {
        "keys": ".",
        "action": "Repeat the last change",
        "mode": "Normal"
      },
      {
        "keys": "&",
        "action": "Repeat the last :substitute without flags",
        "mode": "Normal"
      },
      {
        "keys": "g&",
        "action": "Repeat last substitute with same flags on all lines",
        "mode": "Normal"
      },
      {
        "keys": ":undo {number}",
        "action": "Jump to an undo sequence number",
        "mode": "Command"
      },
      {
        "keys": ":earlier {time}",
        "action": "Move to an older text state",
        "mode": "Command"
      },
      {
        "keys": ":later {time}",
        "action": "Move to a newer text state",
        "mode": "Command"
      },
      {
        "keys": ":undolist",
        "action": "List undo branches",
        "mode": "Command"
      },
      {
        "keys": "g-",
        "action": "Go to older text state in undo tree",
        "mode": "Normal"
      },
      {
        "keys": "g+",
        "action": "Go to newer text state in undo tree",
        "mode": "Normal"
      },
      {
        "keys": "@:",
        "action": "Repeat the last Ex command",
        "mode": "Normal"
      },
      {
        "keys": "@@",
        "action": "Repeat the last executed macro",
        "mode": "Normal"
      },
      {
        "keys": "q:",
        "action": "Open command-line history window",
        "mode": "Normal"
      },
      {
        "keys": "q/ / q?",
        "action": "Open search history window",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Search and Pattern Navigation",
    "entries": [
      {
        "keys": "/{pattern}<CR>",
        "action": "Search forward",
        "mode": "Normal"
      },
      {
        "keys": "?{pattern}<CR>",
        "action": "Search backward",
        "mode": "Normal"
      },
      {
        "keys": "n",
        "action": "Repeat search in same direction",
        "mode": "Normal"
      },
      {
        "keys": "N",
        "action": "Repeat search in opposite direction",
        "mode": "Normal"
      },
      {
        "keys": "*",
        "action": "Search forward for word under cursor",
        "mode": "Normal"
      },
      {
        "keys": "#",
        "action": "Search backward for word under cursor",
        "mode": "Normal"
      },
      {
        "keys": "g*",
        "action": "Search forward for partial word under cursor",
        "mode": "Normal"
      },
      {
        "keys": "g#",
        "action": "Search backward for partial word under cursor",
        "mode": "Normal"
      },
      {
        "keys": "gn",
        "action": "Select the next search match",
        "mode": "Normal"
      },
      {
        "keys": "gN",
        "action": "Select the previous search match",
        "mode": "Normal"
      },
      {
        "keys": "<C-o>",
        "action": "Jump to older location in jump list",
        "mode": "Normal"
      },
      {
        "keys": "<C-i> / <Tab>",
        "action": "Jump to newer location in jump list",
        "mode": "Normal"
      },
      {
        "keys": ":noh / :nohlsearch",
        "action": "Clear search highlighting",
        "mode": "Command"
      },
      {
        "keys": ":set hlsearch",
        "action": "Highlight search matches",
        "mode": "Command"
      },
      {
        "keys": ":set incsearch",
        "action": "Preview matches while typing search",
        "mode": "Command"
      },
      {
        "keys": ":set ignorecase",
        "action": "Ignore case in searches",
        "mode": "Command"
      },
      {
        "keys": ":set smartcase",
        "action": "Use case-sensitive search when pattern has uppercase",
        "mode": "Command"
      },
      {
        "keys": "\\c / \\C",
        "action": "Force case-insensitive / case-sensitive pattern",
        "mode": "Pattern"
      },
      {
        "keys": "\\v",
        "action": "Use very magic pattern syntax",
        "mode": "Pattern"
      },
      {
        "keys": "\\V",
        "action": "Use very nomagic literal pattern syntax",
        "mode": "Pattern"
      }
    ]
  },
  {
    "name": "Substitution and Global Commands",
    "entries": [
      {
        "keys": ":s/old/new/",
        "action": "Replace first match on current line",
        "mode": "Command"
      },
      {
        "keys": ":s/old/new/g",
        "action": "Replace all matches on current line",
        "mode": "Command"
      },
      {
        "keys": ":%s/old/new/g",
        "action": "Replace all matches in file",
        "mode": "Command"
      },
      {
        "keys": ":%s/old/new/gc",
        "action": "Replace all matches with confirmation",
        "mode": "Command"
      },
      {
        "keys": "'<,'>s/old/new/g",
        "action": "Replace within Visual selection",
        "mode": "Command"
      },
      {
        "keys": ":5,12s/old/new/g",
        "action": "Replace within a line range",
        "mode": "Command"
      },
      {
        "keys": ":s//new/g",
        "action": "Reuse the last search pattern",
        "mode": "Command"
      },
      {
        "keys": ":s/old/~/g",
        "action": "Reuse the previous replacement",
        "mode": "Command"
      },
      {
        "keys": ":&&",
        "action": "Repeat substitute with flags",
        "mode": "Command"
      },
      {
        "keys": ":~",
        "action": "Repeat last substitute using last search pattern",
        "mode": "Command"
      },
      {
        "keys": ":g/{pattern}/{cmd}",
        "action": "Run command on every matching line",
        "mode": "Command"
      },
      {
        "keys": ":v/{pattern}/{cmd}",
        "action": "Run command on every non-matching line",
        "mode": "Command"
      },
      {
        "keys": ":g/{pattern}/d",
        "action": "Delete every matching line",
        "mode": "Command"
      },
      {
        "keys": ":v/{pattern}/d",
        "action": "Delete every non-matching line",
        "mode": "Command"
      },
      {
        "keys": ":%s/\\s\\+$//e",
        "action": "Remove trailing whitespace",
        "mode": "Command"
      },
      {
        "keys": ":%s/\\n/ /",
        "action": "Join lines by replacing newlines",
        "mode": "Command"
      },
      {
        "keys": ":sort",
        "action": "Sort selected range or entire buffer",
        "mode": "Command"
      },
      {
        "keys": ":sort u",
        "action": "Sort and remove duplicate lines",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Insert Mode Editing and Completion",
    "entries": [
      {
        "keys": "<C-h> / <BS>",
        "action": "Delete character before cursor",
        "mode": "Insert"
      },
      {
        "keys": "<C-w>",
        "action": "Delete word before cursor",
        "mode": "Insert"
      },
      {
        "keys": "<C-u>",
        "action": "Delete to start of inserted text",
        "mode": "Insert"
      },
      {
        "keys": "<C-t> / <C-d>",
        "action": "Increase / decrease indent",
        "mode": "Insert"
      },
      {
        "keys": "<C-o>{cmd}",
        "action": "Execute one Normal command, then return to Insert",
        "mode": "Insert"
      },
      {
        "keys": "<C-r>{reg}",
        "action": "Insert register contents",
        "mode": "Insert"
      },
      {
        "keys": "<C-r>=expr<CR>",
        "action": "Insert result of an expression",
        "mode": "Insert"
      },
      {
        "keys": "<C-v>{char}",
        "action": "Insert next character literally",
        "mode": "Insert"
      },
      {
        "keys": "<C-k>{digraph}",
        "action": "Insert a digraph",
        "mode": "Insert"
      },
      {
        "keys": "<C-a>",
        "action": "Insert previously inserted text",
        "mode": "Insert"
      },
      {
        "keys": "<C-@>",
        "action": "Insert previous text and leave Insert mode",
        "mode": "Insert"
      },
      {
        "keys": "<C-n> / <C-p>",
        "action": "Complete next / previous keyword",
        "mode": "Insert"
      },
      {
        "keys": "<C-x><C-l>",
        "action": "Complete whole lines",
        "mode": "Insert"
      },
      {
        "keys": "<C-x><C-f>",
        "action": "Complete file names",
        "mode": "Insert"
      },
      {
        "keys": "<C-x><C-o>",
        "action": "Omni completion",
        "mode": "Insert"
      },
      {
        "keys": "<C-x><C-]>",
        "action": "Complete tags",
        "mode": "Insert"
      },
      {
        "keys": "<C-x><C-k>",
        "action": "Dictionary completion",
        "mode": "Insert"
      },
      {
        "keys": "<C-x><C-s>",
        "action": "Spelling completion",
        "mode": "Insert"
      },
      {
        "keys": "<C-y> / <C-e>",
        "action": "Accept character from line above / below",
        "mode": "Insert"
      },
      {
        "keys": "<Insert>",
        "action": "Toggle Insert and Replace mode",
        "mode": "Insert"
      }
    ]
  },
  {
    "name": "Indentation, Formatting, and Case",
    "entries": [
      {
        "keys": ">> / <<",
        "action": "Indent / unindent current line",
        "mode": "Normal"
      },
      {
        "keys": "{count}>>",
        "action": "Indent multiple lines",
        "mode": "Normal"
      },
      {
        "keys": "==",
        "action": "Auto-indent current line",
        "mode": "Normal"
      },
      {
        "keys": "={motion}",
        "action": "Auto-indent a range",
        "mode": "Normal"
      },
      {
        "keys": "gg=G",
        "action": "Auto-indent the entire file",
        "mode": "Normal"
      },
      {
        "keys": "gq{motion}",
        "action": "Format text using textwidth",
        "mode": "Normal"
      },
      {
        "keys": "gqq",
        "action": "Format current line",
        "mode": "Normal"
      },
      {
        "keys": "gw{motion}",
        "action": "Format text and keep cursor position",
        "mode": "Normal"
      },
      {
        "keys": "~",
        "action": "Toggle case of character and move right",
        "mode": "Normal"
      },
      {
        "keys": "g~{motion}",
        "action": "Toggle case over motion",
        "mode": "Normal"
      },
      {
        "keys": "gu{motion}",
        "action": "Lowercase over motion",
        "mode": "Normal"
      },
      {
        "keys": "gU{motion}",
        "action": "Uppercase over motion",
        "mode": "Normal"
      },
      {
        "keys": "gUU / gUu",
        "action": "Uppercase current line",
        "mode": "Normal"
      },
      {
        "keys": "guu",
        "action": "Lowercase current line",
        "mode": "Normal"
      },
      {
        "keys": "g~~",
        "action": "Toggle case of current line",
        "mode": "Normal"
      },
      {
        "keys": ":set shiftwidth=4",
        "action": "Set indentation width",
        "mode": "Command"
      },
      {
        "keys": ":set expandtab",
        "action": "Use spaces when inserting tabs",
        "mode": "Command"
      },
      {
        "keys": ":retab",
        "action": "Convert tabs/spaces using current settings",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Numbers and Character Codes",
    "entries": [
      {
        "keys": "<C-a>",
        "action": "Increment number at or after cursor",
        "mode": "Normal"
      },
      {
        "keys": "<C-x>",
        "action": "Decrement number at or after cursor",
        "mode": "Normal"
      },
      {
        "keys": "g<C-a>",
        "action": "Create an incrementing sequence over selection",
        "mode": "Visual"
      },
      {
        "keys": "g<C-x>",
        "action": "Create a decrementing sequence over selection",
        "mode": "Visual"
      },
      {
        "keys": "ga",
        "action": "Show character value in decimal, hex, and octal",
        "mode": "Normal"
      },
      {
        "keys": "g8",
        "action": "Print hex bytes of character under cursor",
        "mode": "Normal"
      },
      {
        "keys": ":ascii",
        "action": "Show ASCII value of character under cursor",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Marks, Jumps, and Changes",
    "entries": [
      {
        "keys": "m{a-z}",
        "action": "Set a local mark",
        "mode": "Normal"
      },
      {
        "keys": "m{A-Z}",
        "action": "Set a global mark",
        "mode": "Normal"
      },
      {
        "keys": "'{mark}",
        "action": "Jump to marked line",
        "mode": "Normal"
      },
      {
        "keys": "`{mark}",
        "action": "Jump to exact marked position",
        "mode": "Normal"
      },
      {
        "keys": "'' / ``",
        "action": "Jump back to position before latest jump",
        "mode": "Normal"
      },
      {
        "keys": "'. / `.",
        "action": "Jump to line / position of last change",
        "mode": "Normal"
      },
      {
        "keys": "'[ / `[",
        "action": "Jump to start of last changed or yanked text",
        "mode": "Normal"
      },
      {
        "keys": "'] / `]",
        "action": "Jump to end of last changed or yanked text",
        "mode": "Normal"
      },
      {
        "keys": "'< / `<",
        "action": "Jump to start of last Visual selection",
        "mode": "Normal"
      },
      {
        "keys": "'> / `>",
        "action": "Jump to end of last Visual selection",
        "mode": "Normal"
      },
      {
        "keys": ":marks",
        "action": "List marks",
        "mode": "Command"
      },
      {
        "keys": ":jumps",
        "action": "List jump list",
        "mode": "Command"
      },
      {
        "keys": ":changes",
        "action": "List change list",
        "mode": "Command"
      },
      {
        "keys": "g;",
        "action": "Go to older change position",
        "mode": "Normal"
      },
      {
        "keys": "g,",
        "action": "Go to newer change position",
        "mode": "Normal"
      },
      {
        "keys": ":delmarks {marks}",
        "action": "Delete specified marks",
        "mode": "Command"
      },
      {
        "keys": ":delmarks!",
        "action": "Delete all lowercase marks",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Macros and Recording",
    "entries": [
      {
        "keys": "q{reg}",
        "action": "Start recording commands into a register",
        "mode": "Normal"
      },
      {
        "keys": "q",
        "action": "Stop recording",
        "mode": "Normal"
      },
      {
        "keys": "@{reg}",
        "action": "Execute a recorded macro",
        "mode": "Normal"
      },
      {
        "keys": "@@",
        "action": "Repeat the most recently executed macro",
        "mode": "Normal"
      },
      {
        "keys": "{count}@{reg}",
        "action": "Execute a macro multiple times",
        "mode": "Normal"
      },
      {
        "keys": "qA",
        "action": "Append recording to register a",
        "mode": "Normal"
      },
      {
        "keys": ":normal {keys}",
        "action": "Execute Normal commands on a range",
        "mode": "Command"
      },
      {
        "keys": ":%normal @a",
        "action": "Run macro a on every line",
        "mode": "Command"
      },
      {
        "keys": ":global/{pattern}/normal @a",
        "action": "Run macro a on matching lines",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Command Line and Ranges",
    "entries": [
      {
        "keys": ":",
        "action": "Open Ex command line",
        "mode": "Normal"
      },
      {
        "keys": "q:",
        "action": "Open editable command history",
        "mode": "Normal"
      },
      {
        "keys": "<C-f>",
        "action": "Open command-line window while editing command",
        "mode": "Command"
      },
      {
        "keys": "<Up> / <Down>",
        "action": "Previous / next command history entry",
        "mode": "Command"
      },
      {
        "keys": "<C-p> / <C-n>",
        "action": "Previous / next matching history entry",
        "mode": "Command"
      },
      {
        "keys": "<C-r>{reg}",
        "action": "Insert register into command line",
        "mode": "Command"
      },
      {
        "keys": "<C-w>",
        "action": "Delete previous word",
        "mode": "Command"
      },
      {
        "keys": "<C-u>",
        "action": "Delete to beginning of command line",
        "mode": "Command"
      },
      {
        "keys": "<C-b> / <C-e>",
        "action": "Move to beginning / end of command line",
        "mode": "Command"
      },
      {
        "keys": "%",
        "action": "Range representing the whole file",
        "mode": "Command"
      },
      {
        "keys": "'<,'>",
        "action": "Range representing Visual selection",
        "mode": "Command"
      },
      {
        "keys": ". , $",
        "action": "Current line through final line",
        "mode": "Command"
      },
      {
        "keys": ".,+5",
        "action": "Current line through five lines below",
        "mode": "Command"
      },
      {
        "keys": ":3,8{cmd}",
        "action": "Run command on lines 3 through 8",
        "mode": "Command"
      },
      {
        "keys": ":read !{cmd}",
        "action": "Insert output of external command",
        "mode": "Command"
      },
      {
        "keys": ":!{cmd}",
        "action": "Run an external shell command",
        "mode": "Command"
      },
      {
        "keys": ":shell",
        "action": "Open a shell",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Files, Saving, and Exiting",
    "entries": [
      {
        "keys": ":e {file}",
        "action": "Edit a file",
        "mode": "Command"
      },
      {
        "keys": ":enew",
        "action": "Create a new empty buffer",
        "mode": "Command"
      },
      {
        "keys": ":find {file}",
        "action": "Find and edit a file using path",
        "mode": "Command"
      },
      {
        "keys": ":w",
        "action": "Write current file",
        "mode": "Command"
      },
      {
        "keys": ":w {file}",
        "action": "Write to another file",
        "mode": "Command"
      },
      {
        "keys": ":wa",
        "action": "Write all changed buffers",
        "mode": "Command"
      },
      {
        "keys": ":update",
        "action": "Write only if changed",
        "mode": "Command"
      },
      {
        "keys": ":q",
        "action": "Quit current window",
        "mode": "Command"
      },
      {
        "keys": ":q!",
        "action": "Quit and discard changes",
        "mode": "Command"
      },
      {
        "keys": ":wq / :x / ZZ",
        "action": "Write and quit",
        "mode": "Command"
      },
      {
        "keys": ":xa / :wqa",
        "action": "Write all and quit",
        "mode": "Command"
      },
      {
        "keys": ":qa",
        "action": "Quit all windows",
        "mode": "Command"
      },
      {
        "keys": ":qa! / ZQ",
        "action": "Quit all and discard changes",
        "mode": "Command"
      },
      {
        "keys": ":saveas {file}",
        "action": "Save under a new name and edit it",
        "mode": "Command"
      },
      {
        "keys": ":file {name}",
        "action": "Rename current buffer",
        "mode": "Command"
      },
      {
        "keys": ":pwd",
        "action": "Print current working directory",
        "mode": "Command"
      },
      {
        "keys": ":cd {dir}",
        "action": "Change global working directory",
        "mode": "Command"
      },
      {
        "keys": ":lcd {dir}",
        "action": "Change working directory for current window",
        "mode": "Command"
      },
      {
        "keys": ":tcd {dir}",
        "action": "Change working directory for current tab",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Buffers and Argument List",
    "entries": [
      {
        "keys": ":ls / :buffers",
        "action": "List buffers",
        "mode": "Command"
      },
      {
        "keys": ":b {name-or-number}",
        "action": "Switch to a buffer",
        "mode": "Command"
      },
      {
        "keys": ":bnext / :bn",
        "action": "Go to next buffer",
        "mode": "Command"
      },
      {
        "keys": ":bprevious / :bp",
        "action": "Go to previous buffer",
        "mode": "Command"
      },
      {
        "keys": ":bfirst / :bf",
        "action": "Go to first buffer",
        "mode": "Command"
      },
      {
        "keys": ":blast / :bl",
        "action": "Go to last buffer",
        "mode": "Command"
      },
      {
        "keys": ":b# / <C-^>",
        "action": "Switch to alternate buffer",
        "mode": "Command/Normal"
      },
      {
        "keys": ":bd",
        "action": "Delete current buffer from buffer list",
        "mode": "Command"
      },
      {
        "keys": ":bwipeout",
        "action": "Completely remove buffer",
        "mode": "Command"
      },
      {
        "keys": ":bufdo {cmd}",
        "action": "Run command in every buffer",
        "mode": "Command"
      },
      {
        "keys": ":args",
        "action": "Show argument list",
        "mode": "Command"
      },
      {
        "keys": ":next / :previous",
        "action": "Move through argument list",
        "mode": "Command"
      },
      {
        "keys": ":first / :last",
        "action": "Go to first / last argument",
        "mode": "Command"
      },
      {
        "keys": ":argadd {file}",
        "action": "Add file to argument list",
        "mode": "Command"
      },
      {
        "keys": ":argdelete {file}",
        "action": "Remove file from argument list",
        "mode": "Command"
      },
      {
        "keys": ":argdo {cmd}",
        "action": "Run command for every argument",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Windows and Splits",
    "entries": [
      {
        "keys": ":split {file} / :sp",
        "action": "Horizontal split",
        "mode": "Command"
      },
      {
        "keys": ":vsplit {file} / :vs",
        "action": "Vertical split",
        "mode": "Command"
      },
      {
        "keys": "<C-w>s",
        "action": "Horizontal split",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>v",
        "action": "Vertical split",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>n",
        "action": "Open new empty window",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>q / <C-w>c",
        "action": "Quit / close current window",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>o",
        "action": "Keep only current window",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>h/j/k/l",
        "action": "Move to window left/down/up/right",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>w",
        "action": "Cycle to next window",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>p",
        "action": "Go to previous window",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>H/J/K/L",
        "action": "Move current window to far edge",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>r / <C-w>R",
        "action": "Rotate windows",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>x",
        "action": "Exchange current window with next",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>=",
        "action": "Equalize window sizes",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>_ / <C-w>|",
        "action": "Maximize height / width",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>+ / <C-w>-",
        "action": "Increase / decrease height",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>> / <C-w><",
        "action": "Increase / decrease width",
        "mode": "Normal"
      },
      {
        "keys": ":windo {cmd}",
        "action": "Run command in every window",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Tabs",
    "entries": [
      {
        "keys": ":tabnew {file}",
        "action": "Open file in a new tab",
        "mode": "Command"
      },
      {
        "keys": ":tabedit {file}",
        "action": "Edit file in a new tab",
        "mode": "Command"
      },
      {
        "keys": ":tabclose",
        "action": "Close current tab",
        "mode": "Command"
      },
      {
        "keys": ":tabonly",
        "action": "Close all other tabs",
        "mode": "Command"
      },
      {
        "keys": "gt / :tabnext",
        "action": "Go to next tab",
        "mode": "Normal/Command"
      },
      {
        "keys": "gT / :tabprevious",
        "action": "Go to previous tab",
        "mode": "Normal/Command"
      },
      {
        "keys": "{count}gt",
        "action": "Go to tab number",
        "mode": "Normal"
      },
      {
        "keys": ":tabfirst / :tablast",
        "action": "Go to first / last tab",
        "mode": "Command"
      },
      {
        "keys": ":tabmove {n}",
        "action": "Move current tab",
        "mode": "Command"
      },
      {
        "keys": ":tabs",
        "action": "List tabs and their windows",
        "mode": "Command"
      },
      {
        "keys": ":tabdo {cmd}",
        "action": "Run command in every tab",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Folds",
    "entries": [
      {
        "keys": "zf{motion}",
        "action": "Create a fold",
        "mode": "Normal"
      },
      {
        "keys": "zf",
        "action": "Create fold from Visual selection",
        "mode": "Visual"
      },
      {
        "keys": "zo / zO",
        "action": "Open one fold / all nested folds",
        "mode": "Normal"
      },
      {
        "keys": "zc / zC",
        "action": "Close one fold / all nested folds",
        "mode": "Normal"
      },
      {
        "keys": "za / zA",
        "action": "Toggle one fold / nested folds",
        "mode": "Normal"
      },
      {
        "keys": "zv",
        "action": "Open folds needed to reveal cursor",
        "mode": "Normal"
      },
      {
        "keys": "zx",
        "action": "Update folds and reveal cursor",
        "mode": "Normal"
      },
      {
        "keys": "zM",
        "action": "Close all folds",
        "mode": "Normal"
      },
      {
        "keys": "zR",
        "action": "Open all folds",
        "mode": "Normal"
      },
      {
        "keys": "zj / zk",
        "action": "Move to next / previous fold",
        "mode": "Normal"
      },
      {
        "keys": "zd / zD",
        "action": "Delete one fold / nested folds",
        "mode": "Normal"
      },
      {
        "keys": "zE",
        "action": "Eliminate all folds in window",
        "mode": "Normal"
      },
      {
        "keys": ":set foldmethod=indent",
        "action": "Fold according to indentation",
        "mode": "Command"
      },
      {
        "keys": ":set foldmethod=syntax",
        "action": "Fold according to syntax rules",
        "mode": "Command"
      },
      {
        "keys": ":set foldlevel={n}",
        "action": "Set displayed fold depth",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Tags, Definitions, Quickfix, and Location Lists",
    "entries": [
      {
        "keys": "<C-]>",
        "action": "Jump to tag under cursor",
        "mode": "Normal"
      },
      {
        "keys": "g<C-]>",
        "action": "List matching tags",
        "mode": "Normal"
      },
      {
        "keys": "<C-t>",
        "action": "Pop tag stack",
        "mode": "Normal"
      },
      {
        "keys": ":tag {name}",
        "action": "Jump to tag",
        "mode": "Command"
      },
      {
        "keys": ":tselect {name}",
        "action": "List matching tags",
        "mode": "Command"
      },
      {
        "keys": ":tnext / :tprevious",
        "action": "Next / previous matching tag",
        "mode": "Command"
      },
      {
        "keys": "gd",
        "action": "Go to local declaration",
        "mode": "Normal"
      },
      {
        "keys": "gD",
        "action": "Go to global declaration",
        "mode": "Normal"
      },
      {
        "keys": "[<C-d> / ]<C-d>",
        "action": "Previous / next macro definition",
        "mode": "Normal"
      },
      {
        "keys": ":make",
        "action": "Run make and populate quickfix list",
        "mode": "Command"
      },
      {
        "keys": ":grep {pattern} {files}",
        "action": "Search files and populate quickfix",
        "mode": "Command"
      },
      {
        "keys": ":copen / :cclose",
        "action": "Open / close quickfix window",
        "mode": "Command"
      },
      {
        "keys": ":cnext / :cprevious",
        "action": "Next / previous quickfix item",
        "mode": "Command"
      },
      {
        "keys": ":cfirst / :clast",
        "action": "First / last quickfix item",
        "mode": "Command"
      },
      {
        "keys": ":colder / :cnewer",
        "action": "Older / newer quickfix list",
        "mode": "Command"
      },
      {
        "keys": ":lopen / :lclose",
        "action": "Open / close location list",
        "mode": "Command"
      },
      {
        "keys": ":lnext / :lprevious",
        "action": "Next / previous location-list item",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Spelling",
    "entries": [
      {
        "keys": "]s / [s",
        "action": "Next / previous misspelled word",
        "mode": "Normal"
      },
      {
        "keys": "z=",
        "action": "Show spelling suggestions",
        "mode": "Normal"
      },
      {
        "keys": "zg",
        "action": "Add word to spell file",
        "mode": "Normal"
      },
      {
        "keys": "zw",
        "action": "Mark word as misspelled",
        "mode": "Normal"
      },
      {
        "keys": "zug",
        "action": "Undo zg for word",
        "mode": "Normal"
      },
      {
        "keys": "zuw",
        "action": "Undo zw for word",
        "mode": "Normal"
      },
      {
        "keys": "zG / zW",
        "action": "Add / mark word in internal word list",
        "mode": "Normal"
      },
      {
        "keys": ":set spell",
        "action": "Enable spell checking",
        "mode": "Command"
      },
      {
        "keys": ":set nospell",
        "action": "Disable spell checking",
        "mode": "Command"
      },
      {
        "keys": ":set spelllang=en_us",
        "action": "Set spelling language",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Diff Mode",
    "entries": [
      {
        "keys": ":diffsplit {file}",
        "action": "Open a file in diff mode",
        "mode": "Command"
      },
      {
        "keys": ":diffthis",
        "action": "Enable diff mode in current window",
        "mode": "Command"
      },
      {
        "keys": ":diffoff",
        "action": "Disable diff mode in current window",
        "mode": "Command"
      },
      {
        "keys": ":diffoff!",
        "action": "Disable diff mode in all windows",
        "mode": "Command"
      },
      {
        "keys": "]c / [c",
        "action": "Next / previous change",
        "mode": "Normal"
      },
      {
        "keys": "do / :diffget",
        "action": "Obtain change from other window",
        "mode": "Normal/Command"
      },
      {
        "keys": "dp / :diffput",
        "action": "Put change into other window",
        "mode": "Normal/Command"
      },
      {
        "keys": ":diffupdate",
        "action": "Recalculate differences",
        "mode": "Command"
      },
      {
        "keys": "zo / zc",
        "action": "Open / close diff folds",
        "mode": "Normal"
      }
    ]
  },
  {
    "name": "Mappings, Abbreviations, and Options",
    "entries": [
      {
        "keys": ":map",
        "action": "List Normal/Visual/Operator mappings",
        "mode": "Command"
      },
      {
        "keys": ":nmap / :vmap / :imap",
        "action": "List mode-specific mappings",
        "mode": "Command"
      },
      {
        "keys": ":nnoremap {lhs} {rhs}",
        "action": "Create non-recursive Normal mapping",
        "mode": "Command"
      },
      {
        "keys": ":vnoremap {lhs} {rhs}",
        "action": "Create non-recursive Visual mapping",
        "mode": "Command"
      },
      {
        "keys": ":inoremap {lhs} {rhs}",
        "action": "Create non-recursive Insert mapping",
        "mode": "Command"
      },
      {
        "keys": ":unmap {lhs}",
        "action": "Remove mapping",
        "mode": "Command"
      },
      {
        "keys": ":abbreviate",
        "action": "List abbreviations",
        "mode": "Command"
      },
      {
        "keys": ":iabbrev {lhs} {rhs}",
        "action": "Create Insert abbreviation",
        "mode": "Command"
      },
      {
        "keys": ":set {option}",
        "action": "Enable or show an option",
        "mode": "Command"
      },
      {
        "keys": ":set no{option}",
        "action": "Disable a boolean option",
        "mode": "Command"
      },
      {
        "keys": ":set {option}?",
        "action": "Show option value",
        "mode": "Command"
      },
      {
        "keys": ":set {option}&",
        "action": "Reset option to default",
        "mode": "Command"
      },
      {
        "keys": ":setlocal {option}",
        "action": "Set option locally",
        "mode": "Command"
      },
      {
        "keys": ":verbose set {option}?",
        "action": "Show where option was last set",
        "mode": "Command"
      },
      {
        "keys": ":source %",
        "action": "Reload current Vim script file",
        "mode": "Command"
      }
    ]
  },
  {
    "name": "Useful Normal-Mode Commands",
    "entries": [
      {
        "keys": "K",
        "action": "Run keyword program or open help for word",
        "mode": "Normal"
      },
      {
        "keys": "gf",
        "action": "Edit file name under cursor",
        "mode": "Normal"
      },
      {
        "keys": "gF",
        "action": "Edit file and jump to line number under cursor",
        "mode": "Normal"
      },
      {
        "keys": "<C-w>f",
        "action": "Open file name under cursor in new window",
        "mode": "Normal"
      },
      {
        "keys": "gx",
        "action": "Open URL or file with system handler when supported",
        "mode": "Normal"
      },
      {
        "keys": "q{char}",
        "action": "Record macro; q alone stops recording",
        "mode": "Normal"
      },
      {
        "keys": "ZQ",
        "action": "Quit without saving",
        "mode": "Normal"
      },
      {
        "keys": "ZZ",
        "action": "Write and quit",
        "mode": "Normal"
      },
      {
        "keys": "<C-l>",
        "action": "Redraw and clear stale display",
        "mode": "Normal"
      },
      {
        "keys": "<C-z>",
        "action": "Suspend Vim",
        "mode": "Normal"
      },
      {
        "keys": ":checktime",
        "action": "Check whether files changed outside Vim",
        "mode": "Command"
      },
      {
        "keys": ":set paste / :set nopaste",
        "action": "Toggle paste mode",
        "mode": "Command"
      },
      {
        "keys": ":set number / relativenumber",
        "action": "Show absolute / relative line numbers",
        "mode": "Command"
      },
      {
        "keys": ":set list",
        "action": "Show tabs and trailing spaces",
        "mode": "Command"
      },
      {
        "keys": ":set wrap / nowrap",
        "action": "Toggle line wrapping",
        "mode": "Command"
      },
      {
        "keys": ":set cursorline",
        "action": "Highlight current line",
        "mode": "Command"
      },
      {
        "keys": ":syntax on",
        "action": "Enable syntax highlighting",
        "mode": "Command"
      },
      {
        "keys": ":filetype plugin indent on",
        "action": "Enable filetype plugins and indentation",
        "mode": "Command"
      }
    ]
  }
];
  const search = document.querySelector("#vim-search");
  const clear = document.querySelector("#vim-clear");
  const sections = document.querySelector("#vim-sections");
  const nav = document.querySelector("#vim-category-nav");
  const count = document.querySelector("#vim-count");
  const empty = document.querySelector("#vim-empty");

  const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const searchable = entry => `${entry.keys} ${entry.action} ${entry.mode}`.toLowerCase();

  function render(rawQuery = "") {
    const query = rawQuery.trim().toLowerCase();
    sections.replaceChildren();
    nav.replaceChildren();
    let visibleCount = 0;
    let visibleGroups = 0;

    for (const group of groups) {
      const matches = query ? group.entries.filter(entry => searchable(entry).includes(query)) : group.entries;
      if (!matches.length) continue;
      visibleGroups += 1;
      visibleCount += matches.length;
      const id = `vim-${slugify(group.name)}`;

      const navLink = document.createElement("a");
      navLink.href = `#${id}`;
      navLink.textContent = group.name;
      nav.append(navLink);

      const section = document.createElement("section");
      section.className = "tool-card vim-section";
      section.id = id;
      const heading = document.createElement("h2");
      heading.textContent = group.name;
      const list = document.createElement("ul");
      list.className = "vim-command-list";

      for (const entry of matches) {
        const item = document.createElement("li");
        item.className = "vim-command";
        const keys = document.createElement("code");
        keys.className = "vim-keys";
        keys.textContent = entry.keys;
        const action = document.createElement("span");
        action.className = "vim-action";
        action.textContent = entry.action;
        const mode = document.createElement("span");
        mode.className = "vim-mode";
        mode.textContent = entry.mode;
        item.append(keys, action, mode);
        list.append(item);
      }
      section.append(heading, list);
      sections.append(section);
    }

    count.textContent = `${visibleCount} command${visibleCount === 1 ? "" : "s"} in ${visibleGroups} section${visibleGroups === 1 ? "" : "s"}`;
    empty.hidden = visibleCount !== 0;
    nav.hidden = visibleCount === 0;
  }

  search.addEventListener("input", () => render(search.value));
  search.addEventListener("keydown", event => {
    if (event.key === "Escape") { search.value = ""; render(); search.blur(); }
  });
  clear.addEventListener("click", () => { search.value = ""; render(); search.focus(); });
  render();
})();
