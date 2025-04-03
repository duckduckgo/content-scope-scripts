export function svgToBase64Jpg(svgElement, backgroundColor = 'white') {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);

    return new Promise((resolve, reject) => {
        // Create an Image object
        const img = new Image();
        img.onload = () => {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get 2D context from canvas'));
                return;
            }

            // Set canvas dimensions to match the image
            canvas.width = img.width;
            canvas.height = img.height;

            // Set the background color of the canvas
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the image onto the canvas
            ctx.drawImage(img, 0, 0);

            // Convert the canvas content to a JPEG base64 string
            const jpgBase64 = canvas.toDataURL('image/jpeg');

            // Resolve the promise with the base64-encoded JPEG
            resolve(jpgBase64);
        };
        img.onerror = (error) => {
            reject(error);
        };

        // Set the source of the image to the base64-encoded SVG
        img.src = svgDataUrl;
    });
}

export function imageToBase64(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw Error('[imageToBase64] Could not get 2D context from canvas');
    }

    // Set canvas dimensions to match the image
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // Draw the image onto the canvas
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to a JPEG base64 string
    const base64String = canvas.toDataURL('image/jpeg'); // You can change the format if needed

    return base64String;
}