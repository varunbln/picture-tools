# PictureTools

Chrome extension with a set of tools to make your life easier when working with images on the web. I created this extension to solve common issues I run into while using images - fake PNGs that aren't really transparent, apps not supporting WEBP images, high quality images that are too large in size to reupload elsewhere and having to resize or change image aspect ratios to reupload somewhere else.

## Features

- Change image type before downloading - be it PNG, JPEG, WEBP.
- Resize the image before downloading to commonly used dimensions like square, 16:9, etc.
- Compress the image to less than 2MB in size, useful when working with large images.
- Remove the background of any image using AI and download transparent images

## Installation Instructions

- Download the .zip file from the releases page: https://github.com/varunbln/picture-tools/releases/tag/0.0.1
- Unzip it using WinRar, 7Zip, etc
- Go to chrome://extensions
- Enable the developer mode toggle in the top right corner
- Click the `Load Unpacked` button
- Select the unzipped `picture-tools` folder
- Right click any image to use!

## Tech Stack

- Transformers.js for running models in the browser
- RMBG-1.4 for background removal
