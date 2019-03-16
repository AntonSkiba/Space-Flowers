const image = require("get-image-data");
const sharp = require("sharp");

module.exports = function pHash(path) {
  return new Promise(function(resolve, reject) {
    image(`${path}`, function(error, info) {
      let data = info.data;

      let pixels = [];
      let size = 128;
      for (let i = 0; i < data.length; i += 4) {
        let j = i == 0 ? 0 : i / 4;
        let y = Math.floor(j / size);
        let x = j - y * size;
        let pixelPos = x + y * size;
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        let gs = Math.floor(r * 0.299 + g * 0.587 + b * 0.114);
        pixels[pixelPos] = gs;
        //console.log(j);
      }
      let avg = Math.floor(
        pixels.reduce((sum, curr) => {
          return sum + curr;
        }, 0) / pixels.length
      );
      let hash = [];
      pixels.forEach((px, i) => {
        if (px > avg) {
          hash[i] = 1;
        } else {
          hash[i] = 0;
        }
      });
      resolve(hash);
    });
  });
};
