
async function validateCSS(css) {
  try {
    const response = await fetch('https://validator.w3.org/nu/?out=json', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/html; charset=UTF-8',
        },
        // Validation service needs the CSS to be in an HTML page
        body: `<!DOCTYPE html><html lang="en"><head><title>CSS Validation</title><meta charset="utf-8"><style>${css}</style></head></html>`,
    });

    const results = await response.json();


    if (results.messages.length > 0) {
      console.error('CSS Validation Errors:');
      results.messages.forEach((m) => {
        console.error(`- ${m.type} (line ${m.lastLine}) ${m.message}`);
      });
      throw new Error('CSS validation failed.');
    } else {
      console.log('CSS validation passed.');
    }
  } catch (error) {
    console.error('Error validating CSS:', error.message);
    throw error;
  }
}

export default validateCSS;
