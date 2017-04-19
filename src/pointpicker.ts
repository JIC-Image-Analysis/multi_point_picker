var currentPoints;
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
    persistInOverlay(points : Points) {
      let putURL = this.server
                    + this.items[this.currentIndex]["_links"]["self"]["href"]
                    + '/multi_points';
      console.log('persistInOverlay', points.asJSONString(), putURL);
      $.ajax({
          type: 'PUT',
          url: putURL,
          data: points.asJSONString(),
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

class Points {
    points: Point2D[] = [];
    constructor() {
        this.drawOnCanvas();
    }
    drawOnCanvas() {
        let c = <HTMLCanvasElement>document.getElementById("pointsCanvas");
        let ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        for (let p of this.points) {
            drawCircle(p);
        }
    }
    update(p: Point2D) {
        this.points.push(p);
        this.drawOnCanvas();
    }
    asJSONString() {
        return JSON.stringify(
            this.points.map(function (p) {
                return [p.x, p.y];
            })
        );
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
    currentPoints = new Points();
    console.log("Getting image");
    $.get("http://localhost:5000/items", function(data) {
        appState = new AppState(data["_embedded"]["items"]);
        let imageURL = appState.currentImageURL();
        drawImageFromURL(imageURL);
    });

    setupCanvas();

    document.addEventListener('keydown', function(event) {
        if (event.keyCode == 39) {
            appState.persistInOverlay(currentPoints);
            currentPoints = new Points();
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
        currentPoints.update(normCoords);
        console.log(normCoords.x + ',' + normCoords.y);
    });
};

window.onload = loadStartImage;
