# Dataset point clicker

Tool to allow clicking on points in an image dataset and recording the results as an overlay on that dataset.


## Installing typescript

    npm install -g typescript
    npm install --save-dev @types/jquery
    npm install http-server -g

## Serving page

    python3 -m http.server 8000

or (to make it work):

    ~/.node/bin/http-server -p 8000 --cors


## Misc

```
curl -X PUT http://localhost:5000/overlays/quadrilateral_points
```
