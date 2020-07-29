const RDP = (l, eps) => {
    const last = l.length - 1;
    const p1 = l[0];
    const p2 = l[last];
    const x21 = p2.x - p1.x;
    const y21 = p2.y - p1.y;
   
    const [dMax, x] = l.slice(1, last)
        .map(p => Math.abs(y21 * p.x - x21 * p.y + p2.x * p1.y - p2.y * p1.x))
        .reduce((p, c, i) => {
          const v = Math.max(p[0], c);
          return [v, v === p[0] ? p[1] : i + 1];
        }, [-1, 0]);
   
    if (dMax > eps) {
      return [...RDP(l.slice(0, x + 1), eps), ...RDP(l.slice(x), eps).slice(1)];
    }
    return [l[0], l[last]]
  };

  let LatLongToPixelXY = (latitude, longitude) => {
    var pi_180 = Math.PI / 180.0;
    var pi_4 = Math.PI * 4;
    var sinLatitude = Math.sin(latitude * pi_180);
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256;
    var pixelX = ((longitude + 180) / 360) * 256;
  
    var pixel = { x: pixelX, y: pixelY };
  
    return pixel;
  };
  
  function translateMatrix(matrix, tx, ty) {
    // translation is in last column of matrix
    matrix[12] += matrix[0] * tx + matrix[4] * ty;
    matrix[13] += matrix[1] * tx + matrix[5] * ty;
    matrix[14] += matrix[2] * tx + matrix[6] * ty;
    matrix[15] += matrix[3] * tx + matrix[7] * ty;
  }
  
  function scaleMatrix(matrix, scaleX, scaleY) {
    // scaling x and y, which is just scaling first two columns of matrix
    matrix[0] *= scaleX;
    matrix[1] *= scaleX;
    matrix[2] *= scaleX;
    matrix[3] *= scaleX;
  
    matrix[4] *= scaleY;
    matrix[5] *= scaleY;
    matrix[6] *= scaleY;
    matrix[7] *= scaleY;
  }
  
  // Returns a random integer from 0 to range - 1.
  function randomInt(range) {
    return Math.floor(Math.random() * range);
  }

  /**
   * 
   * @param {the number to pad} n 
   * @param {the amount of pading} width 
   * @param {digit to pad out number with (default '0'} z 
   * @return {the padded number (string)}
   */
  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

  /**
   * returns a random hex color
   */
  function getColor() {
    return '#' +  Math.random().toString(16).substr(-6);
  }

  function formatDate(date) {
    let tokens = date.split("_");
    let month = getMonth(tokens[1]);
    return month + " " + tokens[0];
  }

  function getMonth(month) {
    switch(month) {
      case "01":
        return "January";
      case "02":
        return "Feburary";
      case "03":
        return "March";
      case "04":
        return "April";
      case "05":
        return "May";
      case "06":
        return "June";
      case "07":
        return "July";
      case "08":
        return "August";
      case "09":
        return "September";
      case "10":
        return "October";
      case "11":
        return "November";
      case "12":
        return "December";
      default:
        return month
    }
  }

  export {RDP, LatLongToPixelXY, translateMatrix, scaleMatrix, randomInt, pad, getColor, getMonth, formatDate}