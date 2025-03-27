export function svgToBase64Jpg(svgBase64, backgroundColor = 'white') {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get 2d context'));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            resolve(canvas.toDataURL('image/jpeg'));
        };

        img.onerror = reject;
        img.src = `data:image/svg+xml;base64,${svgBase64}`;
    });
}