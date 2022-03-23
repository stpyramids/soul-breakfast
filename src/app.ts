import * as mapView from "./tools/mapview";
import { runGame } from "./ui";

window.onload = () => {
  if (document.body.id === "mapview") {
    mapView.startTool();
  } else {
    runGame();
  }
};
