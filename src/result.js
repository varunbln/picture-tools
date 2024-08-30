chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { imageDataUrl, maskDataUrl } = message;

  // Create an image element from the base64 string
  const image = new Image();
  const mask = new Image();

  image.src = imageDataUrl;
  mask.src = maskDataUrl;

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");

    // Draw the original image to canvas
    ctx.drawImage(image, 0, 0);

    mask.onload = () => {
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = mask.width;
      maskCanvas.height = mask.height;
      const maskCtx = maskCanvas.getContext("2d");
      maskCtx.drawImage(mask, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const maskData = maskCtx.getImageData(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height
      );

      // Apply mask to image data
      for (let i = 0; i < maskData.data.length; i += 4) {
        imageData.data[i + 3] = maskData.data[i]; // Set alpha channel based on mask
      }

      // Update canvas with new image data
      ctx.putImageData(imageData, 0, 0);

      // Add canvas to the document body
      document.body.appendChild(canvas);
    };
  };
});
