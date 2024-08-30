import { AutoModel, AutoProcessor, env, RawImage } from "@xenova/transformers";
import imageCompression from "browser-image-compression";

env.allowLocalModels = true;

// Fix for TypeError: URL.createObjectURL is not a function, onnx error
env.backends.onnx.wasm.numThreads = 1;

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "save-as-type",
    title: "Save as",
    contexts: ["image"],
  });
  chrome.contextMenus.create({
    id: "save-as-png",
    title: "PNG",
    parentId: "save-as-type",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "save-as-jpg",
    title: "JPG",
    parentId: "save-as-type",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "save-as-webp",
    title: "WEBP",
    parentId: "save-as-type",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "resize",
    title: "Resize",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "resize-to-square",
    parentId: "resize",
    title: "Square",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "resize-to-16-9",
    parentId: "resize",
    title: "16:9",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "resize-to-4-3",
    parentId: "resize",
    title: "4:3",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "compress",
    title: "Compress",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "remove-background",
    title: "Remove Background",
    contexts: ["image"],
  });
});

const model = await AutoModel.from_pretrained("rmbg", {
  local_files_only: true,
});

const processor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4", {
  config: {
    do_normalize: true,
    do_pad: false,
    do_rescale: true,
    do_resize: true,
    image_mean: [0.5, 0.5, 0.5],
    feature_extractor_type: "ImageFeatureExtractor",
    image_std: [1, 1, 1],
    resample: 2,
    rescale_factor: 0.00392156862745098,
    size: { width: 1024, height: 1024 },
  },
});

console.log("model loaded");

const remove_background = async (imgUrl) => {
  const image = await RawImage.fromURL(imgUrl);
  const { pixel_values } = await processor(image);
  const { output } = await model({ input: pixel_values });

  // Resizing mask
  const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
    image.width,
    image.height
  );

  return { mask, image };
};

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.mediaType !== "image") return;

  if (info.menuItemId === "remove-background") {
    console.log("Removing background...");

    const { mask, image } = await remove_background(info.srcUrl);

    const offscreenCanvas = new OffscreenCanvas(image.width, image.height);
    const ctx = offscreenCanvas.getContext("2d");

    ctx.drawImage(image.toCanvas(), 0, 0);

    const pixelData = ctx.getImageData(0, 0, image.width, image.height);
    for (let i = 0; i < mask.data.length; ++i) {
      pixelData.data[4 * i + 3] = mask.data[i];
    }
    ctx.putImageData(pixelData, 0, 0);

    offscreenCanvas.convertToBlob().then((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;

        chrome.downloads.download({
          url: base64data,
          filename: "downloaded_image.png",
          saveAs: true,
        });
      };
      reader.readAsDataURL(blob);
    });
  } else if (info.menuItemId.includes("resize-to")) {
    console.log("resizing...");

    const image = await RawImage.fromURL(info.srcUrl);
    const width = image.width;
    const height = image.height;
    const extension = info.srcUrl.split(".").pop().toLowerCase();

    let mime = "image/png";
    switch (extension) {
      case "jpg":
      case "jpeg":
        mime = "image/jpeg";
        break;
      case "webp":
        mime = "image/webp";
        break;
    }
    console.log("mime", mime, extension);

    let newWidth, newHeight;

    switch (info.menuItemId) {
      case "resize-to-square":
        if (width > height) {
          newWidth = height;
          newHeight = height;
        } else {
          newWidth = width;
          newHeight = width;
        }
        break;
      case "resize-to-16-9":
        newWidth = width;
        newHeight = Math.round((width * 9) / 16);
        break;
      case "resize-to-4-3":
        newWidth = width;
        newHeight = Math.round((width * 3) / 4);
        break;
    }

    const resizedImage = await image.resize(newWidth, newHeight);
    const newImage = await resizedImage.toBlob(mime);
    const reader = new FileReader();

    reader.onloadend = function () {
      const base64data = reader.result;

      chrome.downloads.download({
        url: base64data,
        filename: "downloaded_image." + extension,
        saveAs: true,
      });
    };
    reader.readAsDataURL(newImage);
  } else if (info.menuItemId.includes("save-as")) {
    console.log("saving as...");

    const image = await RawImage.fromURL(info.srcUrl);

    let imgType = "image/png";
    let imgExtension = "png";
    switch (info.menuItemId) {
      case "save-as-png":
        imgType = "image/png";
        imgExtension = "png";
        break;
      case "save-as-jpg":
        imgType = "image/jpeg";
        imgExtension = "jpg";
        break;
      case "save-as-webp":
        imgType = "image/webp";
        imgExtension = "webp";
        break;
    }

    const newImage = await image.toBlob(imgType);
    const reader = new FileReader();

    reader.onloadend = function () {
      const base64data = reader.result;

      chrome.downloads.download({
        url: base64data,
        filename: "downloaded_image." + imgExtension,
        saveAs: true,
      });
    };
    reader.readAsDataURL(newImage);
  } else if (info.menuItemId.includes("compress")) {
    console.log("compressing...");

    const image = await RawImage.fromURL(info.srcUrl);
    const extension = info.srcUrl.split(".").pop().toLowerCase();
    const imageBlob = await image.toBlob();

    const options = {
      maxSizeMB: 2,
      alwaysKeepResolution: true,
      useWebWorker: false,
    };

    const compressedImage = await imageCompression(imageBlob, options);

    const reader = new FileReader();
    reader.onloadend = function () {
      const base64data = reader.result;

      chrome.downloads.download({
        url: base64data,
        filename: "downloaded_image." + extension,
        saveAs: true,
      });
    };
    reader.readAsDataURL(compressedImage);
  }
});
