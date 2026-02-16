const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

function colorize(text, color) {
    return `${color}${text}${colors.reset}`;
}

export const format = {
    error: (text) => colorize(text, colors.red),
    warning: (text) => colorize(text, colors.yellow),
    command: (text) => colorize(text, colors.cyan),
};
