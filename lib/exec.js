'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

let cprint = require('color-print');

let str = require('./string');
let print = require('./print');

// ******************************
// Functions:
// ******************************

function execCmdSync(in_cmd, in_args, in_options) {
    let opt = in_options || {};
    let indent = _defaultIndent(opt.indent);

    if (!opt.hide) {
        if (opt.cwd) {
            cprint.white(indent + 'CWD: ' + opt.cwd);
        }
        cprint.white(indent + 'EXEC-SYNC: ' + in_cmd + ' ' + _flatArgs(in_args));
    }

    let cmdOptions = {};

    if (opt.cwd) {
        cmdOptions.cwd = opt.cwd;
    }

    if (opt.detached) {
        cmdOptions.detached = true;
    }

    let child_process = require('child_process');
    let execResult = child_process.spawnSync(in_cmd, in_args, cmdOptions);

    let errorResult = '';
    if (execResult.error) {
        errorResult - errorResult.Error;
    }
    let stderrResult = (execResult.stderr || '').toString();
    let stdoutResult = (execResult.stdout || '').toString();

    let cmdErrorResult = errorResult || stderrResult;
    let cmdResult = stdoutResult;
    let rows = cmdResult.trim().split(/(?:\n|(?:\r\n?))+/);

    if (opt.errToOut) {
        cmdResult += cmdErrorResult;
        cmdErrorResult = '';
    }

    let cmdResultObj = {};
    try {
        cmdResultObj = JSON.parse(cmdResult);
    } catch (e) {
        // Do Nothing
    }

    if (opt.printResults) {
        if (cmdResult.trim()) {
            cprint.white(indent + 'CMD RESULT: ' + cmdResult.trim());
        }
        if (cmdErrorResult.trim()) {
            cprint.red(indent + 'CMD ERROR: ' + cmdErrorResult.trim());
        }
    }

    let knownErrors = opt.knownErrors || [];

    cmdErrorResult = cmdErrorResult
        .split(/(\r\n?|\n)/)
        .filter((line) => !knownErrors.find((e) => line.match(e)))
        .join('\n')
        .trim();

    if (!cmdErrorResult) {
        if (cmdResultObj) {
            if (cmdResultObj.error) {
                cmdErrorResult = JSON.stringify(cmdResultObj.error);
            } else if (cmdResultObj.errors) {
                cmdErrorResult = JSON.stringify(cmdResultObj.errors);
            }
        } else {
            cmdErrorResult = cmdResult
                .split(/(\r\n?|\n)/)
                .filter(_isError)
                .join('\n')
                .trim();
        }
    }

    return {
        error: cmdErrorResult,
        result: cmdResult,
        resultObj: cmdResultObj,
        printError: (in_indent) => _printLogLines(cmdErrorResult, _defaultIndent(in_indent, indent), knownErrors),
        printResult: (in_indent) => _printLogLines(cmdResult, _defaultIndent(in_indent, indent), knownErrors),
        rows: rows,
        hasError: !!cmdErrorResult.trim(),
        toString: () => (cmdErrorResult.trim() ? cmdErrorResult : cmdResult),
    };
}

// ******************************

function execCmd(in_cmd, in_args, in_options) {
    let opt = in_options || {};
    let indent = _defaultIndent(opt.indent);

    if (!opt.hide) {
        if (opt.cwd) {
            cprint.white(indent + 'CWD: ' + opt.cwd);
        }
        cprint.white(indent + 'EXEC: ' + in_cmd + ' ' + _flatArgs(in_args));
    }

    let child_process = require('child_process');
    let child = child_process.spawn(in_cmd, in_args, {
        cwd: opt.cwd || '/',
        detached: opt.detached,
    });

    child.stdout.on('data', (chunk) => {
        _printLogLine(chunk, indent, opt.knownErrors);
    });

    let seenError = false;

    child.stderr.on('data', (chunk) => {
        _printLogLine(chunk, indent, opt.knownErrors);
        seenError = true;
        if (opt.errorCb) {
            opt.errorCb(chunk.toString());
        }
    });

    child.on('error', (error) => {
        _printLogLine(error, indent, opt.knownErrors);
        seenError = true;
        if (opt.errorCb) {
            opt.errorCb(error);
        }
    });

    child.on('close', () => {
        if (opt.doneCb) {
            opt.doneCb(!seenError);
        }
    });
}

// ******************************
// Helper Functions:
// ******************************

function _defaultIndent(in_indent, in_defaultIndent) {
    if (typeof in_indent === 'undefined') {
        return in_defaultIndent || '  ';
    }

    return in_indent || '';
}

// ******************************

function _flatArgs(in_args) {
    let args = [];
    in_args.forEach((a) => {
        if (typeof a !== 'string') {
            args.push(a);
            return;
        }
        if (a.match(/[\s]/)) {
            args.push(
                "'" +
                    a
                        .replace(/([\t])/g, '\\t')
                        .replace(/([\n])/g, '\\n')
                        .replace(/([\r])/g, '\\r') +
                    "'"
            );
            return;
        }
        if (a.match(/[\\"']/)) {
            args.push("'" + a + "'");
            return;
        }
        args.push(a);
    });

    return args.join(' ');
}

// ******************************

function _printLogLines(in_lines, in_indent, in_knownErrors) {
    in_lines.split(/(?:\n|(?:\r\n?))+/).forEach((l) => _printLogLine(l, _defaultIndent(in_indent), in_knownErrors));
}

// ******************************

function _printLogLine(in_line, in_indent, in_knownErrors) {
    let line = in_line.toString();
    let indent = _defaultIndent(in_indent);

    if (!line.trim()) {
        return;
    }

    let knownErrorMatch = (in_knownErrors || []).find((e) => line.match(e));
    if (knownErrorMatch) {
        return;
    }

    if (_isError(line, in_knownErrors)) {
        print.out(cprint.toRed(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/unable to/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/no such/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/does not exist/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/doesn't exist/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/couldn't/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/could not/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/can't/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/can ?not/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/warning!/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/warning[:=-]? /i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/warning:[0-9]/i)) {
        print.out(cprint.toYellow(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/success[:=-]? /i)) {
        print.out(cprint.toGreen(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/success:[0-9]/i)) {
        print.out(cprint.toGreen(str.indentContents(line, indent) + '\n'));
    } else if (line.match(/ OK/i) || line.match(/OK /i)) {
        print.out(cprint.toGreen(str.indentContents(line, indent) + '\n'));
    } else {
        print.out(cprint.toLightBlue(str.indentContents(line, indent) + '\n'));
    }
}

// ******************************

function _isError(in_line) {
    let line = in_line.toString();
    if (!line.trim()) {
        return;
    }

    if (line.match(/error[:=-]? /i)) {
        return true;
    } else if (line.match(/error:[0-9]/i)) {
        return true;
    } else if (line.match(/denied/i)) {
        return true;
    }

    return false;
}

// ******************************
// Exports:
// ******************************

module.exports['cmdSync'] = execCmdSync;
module.exports['cmd'] = execCmd;

// ******************************
