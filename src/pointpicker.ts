
var currentCorners;
var appState;

class Point2D {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    dist(p: Point2D) {
        var diff = new Point2D(p.x - this.x, p.y - this.y);
        return diff.magnitude();

    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class AppState {
    items: any;
    currentIndex: number = 0;
    server: string = "http://localhost:5000";
    constructor(items: string[]) {
        this.items = items;
    }
    currentImageURL() : URL {
        let cur_img_url = new URL(this.server
                                  + this.items[this.currentIndex]["_links"]["self"]["href"]
                                  + "/raw");
        console.log("Current image url: " + cur_img_url);
        return cur_img_url;
    }
    nextImageURL() : URL {
        this.currentIndex += 1;
        return this.currentImageURL();
    }
    persistInOverlay(corners : Corners) {
      let putURL = this.server
                    + this.items[this.currentIndex]["_links"]["self"]["href"]
                    + '/quadrilateral_points';
      console.log('persistInOverlay', corners.asJSONString(), putURL);
      $.ajax({
          type: 'PUT',
          url: putURL,
          data: corners.asJSONString(),
          success: function(data) {
              console.log("Success!");
              let imageURL = appState.nextImageURL();
              console.log(imageURL);
              drawImageFromURL(imageURL);
              console.log("end of success");
          },
          contentType: "application/json"
      });
  }
}

class Corners {
    corners: Point2D[] = [
        new Point2D(0, 0),
        new Point2D(1, 0),
        new Point2D(0, 1),
        new Point2D(1, 1)
    ]
    constructor() {
        this.drawOnCanvas();
    }
    drawOnCanvas() {
        let c = <HTMLCanvasElement>document.getElementById("pointsCanvas");
        let ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        for (let c of this.corners) {
            drawCircle(c);
        }
    }
    update(p: Point2D) {
        console.log("Called Corners update", p);
        let minDist = 2;
        let minIndex = 0;
        for (let i in this.corners) {
            let dist = p.dist(this.corners[i]);
            if (dist < minDist) {
                minDist = dist;
                minIndex = Number(i);
            }
        }
        console.log(minIndex, minDist);
        this.corners[minIndex] = p;
        this.drawOnCanvas();
    }
    asJSONString() {
        // return JSON.stringify("hello");
        return JSON.stringify({ "topLeft": this.corners[0],
                                "topRight": this.corners[1],
                                "bottomLeft": this.corners[2],
                                "bottomRight": this.corners[3]})
    }

}


let drawCircle = function(p: Point2D) {
    let c = <HTMLCanvasElement>document.getElementById("pointsCanvas");
    let ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.arc(p.x * c.width, p.y * c.height, 5, 0, 2*Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
}

let drawImageFromURL = function(imageURL: URL) {
    let c = <HTMLCanvasElement>document.getElementById("imgCanvas");
    let ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    let img = new Image();
    img.src = String(imageURL);
    img.addEventListener('load', function() {
        ctx.drawImage(img, 0, 0, 800, 600);
    });
}

let loadStartImage=function() {
    currentCorners = new Corners();
    console.log("Getting image");
    $.get("http://localhost:5000/items", function(data) {
        appState = new AppState(data["_embedded"]["items"]);
        let imageURL = appState.currentImageURL();
        drawImageFromURL(imageURL);
    });

    setupCanvas();

    document.addEventListener('keydown', function(event) {
        if (event.keyCode == 39) {
            appState.persistInOverlay(currentCorners);
        }
    });
};

let getElementRelativeCoords = function(item, event) {
    let elemRect = item.getBoundingClientRect();
    let absX = event.clientX - elemRect.left;
    let absY = event.clientY - elemRect.top;

    return new Point2D(absX, absY);
}

let getElementNormCoords = function(item, event) {
    let elemRect = item.getBoundingClientRect();
    let absPos = getElementRelativeCoords(item, event);
    let height = elemRect.height;
    let width = elemRect.width;
    let normX = absPos.x / width;
    let normY = absPos.y / height;

    return new Point2D(normX, normY);
}

let setupCanvas = function() {

    let item = document.querySelector("#imgCanvas");
    $("#pointsCanvas").click(function(event) {
        let normCoords = getElementNormCoords(item, event);
        currentCorners.update(normCoords);
        console.log(normCoords.x + ',' + normCoords.y);
    });
};

window.onload = loadStartImage;
