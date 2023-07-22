let map;
let markersArray = [];
let polyline = null;
let totalDistance = 0;
let distances = [];
let arr = [];
let totalArea = 0;
let poligon;
let solarDirection = [];
let solarArea = [];
let biogasDirection = [];
let biogasArea = [];
let surfaceArea;
let surfaceDir;
let x;
let y;
let result;
let panelChoice;
let bioHours = 0;
let totalPanels = 0;
let totalDigestors = 0;
let areaArray = [];
let bioDigestorTemp = 68;
let totalBioEnergy = 0;
//energy is the total amount of power produced in a day.
let totalSolarEnergy = 0;
let z;

//constant values
const today = new Date();
let month = today.getMonth() + 1;
let monthName = today.toLocaleString('default', { month: 'long' });
let two = "\u00B2";
let temperature = [26, 32, 45, 50, 66, 73, 76, 73, 66, 53, 45, 34];
//  kWh/m2/day  - the amount of direct peak hours per month
let DNI = [2.56, 2.95, 3.48, 4.09, 4.22, 4.63, 4.55, 4.44, 4.49,3.44, 2.53, 2.22]; //https://www.solarenergylocal.com/states/ohio/columbus/
let ccfBioGas = 0.247203;
let foodwaste = 6; //6 liters.
//https://www.homebiogas.com/product/homebiogas-2/#tab-382faq
let bioDigestorCost = 1000;

  //https://news.energysage.com/best-solar-panels-complete-ranking/
  const solarPanels = new Map();
  solarPanels.set('SunPower', 440);
  solarPanels.set('Canadian Solar', 430);
  solarPanels.set('REC', 430);
  solarPanels.set('Panasonic', 410);
  solarPanels.set('QCELLS', 410);


  const solarPanelsCost = new Map();
  solarPanelsCost.set('SunPower', 3.79);
  solarPanelsCost.set('Canadian Solar', 2.95);
  solarPanelsCost.set('REC', 2.83);
  solarPanelsCost.set('Panasonic', 3.03);
  solarPanelsCost.set('QCELLS', 2.74);
  
  //the surface area of panel
  let panelSA = (65 / 12) * (39 / 12);

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
    disableDefaultUI: false,
  });
  // map onclick listener 
  map.addListener('click', function (e) {
    //console.log(e);
    addMarker(e.latLng);
    drawPolyline();
  });

  initAutocomplete();

  // document.getElementById('areaMeters').value = 0;
  document.getElementById('areaMiles').value = totalArea;
  document.getElementById('areaFeet').value = (0 * 3.281 * 3.281);
  document.getElementById("date").innerHTML = today + "<break> </break> Average mothly temp: " + temperature[month-1] + "<sup>°F</sup>" ;

  x = document.getElementById("areaFeet");
  y = document.getElementById('coDirection');
  panelChoice = document.getElementById('diffPanel');

  document.getElementById("dailyElecConsumption").innerHTML = "Your daily electricity consumption is "+ 0 + " Wh.";     // console.log("total solar energy is watts", totalSolarEnergy);
  document.getElementById("dailyGasConsumption").innerHTML = "Your daily electricity consumption is "+ 0 + " Ccf.";     // console.log("total solar energy is watts", totalSolarEnergy);

  document.getElementById("solarResults").innerHTML = totalSolarEnergy + " Wh (Watt-hours) per day with " + totalPanels + " panels";
  document.getElementById("bioResults").innerHTML = totalBioEnergy + " Ccf and gives about " + bioHours + " hours of gas perday (one burner). Total number of digestors is " + totalDigestors;

}

function initAutocomplete() {

  //Should clear the inout input oer search box whnen you click reset button.
  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  // Bias the SearchBox results towards current map's viewport.
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });

  let markers = [];

  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }

      const icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };

      // Create a marker for each place.
      markers.push(
        new google.maps.Marker({
          map,
          icon,
          title: place.name,
          position: place.geometry.location,
        })
      );
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });
}

// define function to add marker at given lat & lng
function addMarker(latLng) {
  let marker = new google.maps.Marker({
    map: map,
    position: latLng,
    draggable: true
  });

  // add listener to redraw the polyline when markers position change
  marker.addListener('position_changed', function () {
    drawPolyline();
  });

  //store the marker object drawn in global array
  markersArray.push(marker);

  //this method removes 
  marker.addListener("dblclick", function () {
    let posOfMarker = markersArray.indexOf(marker);
    marker.setMap(null);
    const x = markersArray.splice(posOfMarker, 1);
    drawPolyline();
  });
  //need to remove the removed element from array
}

// define function to draw polyline that connect markers' position
function drawPolyline() {
  let markersPositionArray = [];
  // obtain latlng of all markers on map
  markersArray.forEach(function (e) {
    markersPositionArray.push(e.getPosition());
  });

  // check if there is already polyline drawn on map
  // remove the polyline from map before we draw new one
  if (polyline !== null) {
    polyline.setMap(null);
  }

  // draw new polyline at markers' position
  polyline = new google.maps.Polyline({
    map: map,
    path: markersPositionArray,
    strokeOpacity: 0.4
  });
}

//Calculates the distance but we don't need this ATM. 
function Calculate_distance() {
  totalDistance = 0;
  for (let i = 0; i < markersArray.length - 1; i++) {
    const currentMarker = markersArray[i];
    //this is the logis that helped.
    const nextMarker = markersArray[(i + 1) % markersArray.length]; // Wrap around to the first marker for the last iteration
    // Get the positions of the current and next markers
    const currentPosition = currentMarker.getPosition();
    const nextPosition = nextMarker.getPosition();
    // Calculate the distance between the current and next markers
    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
      currentPosition,
      nextPosition
    );

    // Convert the distance to miles (optional)
    const distanceInMiles = (distanceInMeters * 0.000621371);
    // Accumulate the distances to get the total distance
    totalDistance += distanceInMiles;
  }
  document.getElementById('distanceMiles').value = totalDistance.toFixed(3);
  document.getElementById('distanceFeet').value = totalDistance.toFixed(3) * 5280;
}

function findArea() {
  totalArea = 0;
  arr.length = 0;
  for (let i = 0; i < markersArray.length; i++) {
    const x = markersArray[i].getPosition();
    arr.push(x.lat(), x.lng());
  }

  let a = [];
  a.length = 0;
  for (let i = 1; i < arr.length; i += 2) {
    a.push(new google.maps.LatLng(arr[i - 1], arr[i]));
  }

  poligon = new google.maps.Polygon({
    paths: a, //this is the array that contains the paths.
    strokeColor: "#22B14C",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#22B14C",
    fillOpacity: 0.35
  });
  poligon.setMap(map);//until here is ok 
  let z = google.maps.geometry.spherical.computeArea(poligon.getPath().getArray());
  totalArea = (z * 0.000621371 * 0.000621371).toFixed(3);//
  // document.getElementById('areaMeters').value = z;
  document.getElementById('areaMiles').value = totalArea;
  document.getElementById('areaFeet').value = (z * 3.281 * 3.281);

  areaArray.push(poligon);
}

// must create a reset everything function
function clearMap() {
  for (let i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }

  // clears all the highlighted areas.
  for(let i = 0; i<areaArray.length; i++){
    areaArray[i].setMap(null);
  }
 

  markersArray.length = 0;
  drawPolyline();
  polyline = null;

  totalDistance = 0;
  distances.length = 0;
  arr.length = 0;
  totalArea = 0;
   poligon.setMap(null);


  // //uncomment this to find the distance
  // document.getElementById('distanceMiles').value = totalDistance.toFixed(3);
  // document.getElementById('distanceFeet').value = totalDistance.toFixed(3) * 5280;

  // document.getElementById('areaMeters').value = 0;
  document.getElementById('areaMiles').value = totalArea;
  document.getElementById('areaFeet').value = (0 * 3.281 * 3.281);
}

function measureNewSurface(){
  for (let i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  markersArray.length = 0;
  drawPolyline();
  polyline = null;
  totalDistance = 0;
  distances.length = 0;
  arr.length = 0;
  totalArea = 0;
}

function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "navbar") {
    x.className += " responsive";
  } else {
    x.className = "navbar";
  }
}


function myFunctionNav() {
  var x = document.getElementById("myInsnav");
  if (x.className === "insBar") {
    x.className += " responsive";
  } else {
    x.className = "insBar";
  }
}

x = document.getElementById("areaFeet");
y = document.getElementById('coDirection');
panelChoice = document.getElementById('diffPanel');
const listItem = document.createElement('li');


//comeback to this code. Check area and then dividing and multiplying with energy produced,
function CalculateSolar() {
  // adds the first set of distance and surface area to array.

  if (solarArea.length == 0 && solarDirection.length == 0) {
    if (y.value !== "start" && y.value !== "other") {
      findArea();
      solarArea.push(x.value);
      console.log("x.value = ", x.value);

      surfaceDir = y.options[y.selectedIndex].text;
      solarDirection.push(surfaceDir);
      console.log("soloarArea = ", solarArea);
      console.log("solaeDirection = ", solarDirection);

      listSolarItems();

      // console.log(parseInt(solarArea[0]));
      if(y.value == "south" ){
        totalSolarEnergy = numOfSolarPanel(parseInt(solarArea[0]));
      }
      else{
        totalSolarEnergy = numOfSolarPanel(parseInt(solarArea[0]))*0.8;
      }
      
      document.getElementById("solarResults").innerHTML = totalSolarEnergy + " Wh (Watt-hours) with  "+ totalPanels + " panels.";
      // console.log("totalSolarEnergy");
    } else {
      if(y.value == "start"){
        alert("Please select an area and choose the surface's direction");
      }else if(y.value == "other"){
        alert("Your surface does not have a desirable direction. Choose another surfacae.");
      }
    }
  }
  // This is when the user adds another value to the array.
  else {
    let sumArea = 0;
    for (let i = 0; i < solarArea.length; i++) {
      sumArea += parseInt(solarArea[i]);
    }
    totalSolarEnergy = numOfSolarPanel(sumArea);
    document.getElementById("solarResults").innerHTML = totalSolarEnergy + " Wh (Watt-hours) with  "+ totalPanels + " panels.";
  }
}

function listSolarItems() {
  const listItem = document.createElement('li');
  let panelSA = (65 / 12) * (39 / 12);
  let numPanels = parseInt(solarArea[solarArea.length - 1] / panelSA);
  listItem.textContent = `${solarArea[solarArea.length - 1]} ft² & ${solarDirection[solarDirection.length - 1]}= ${numPanels}`;
  document.getElementById('solarSurfaces').appendChild(listItem);
}

function numOfSolarPanel(surfaceArea) {
  //takes the users panel of choice.
  let userPanelChoise = panelChoice.options[panelChoice.selectedIndex].text;
  let powerWatts = solarPanels.get(userPanelChoise);
  let numOfPanels = parseInt(surfaceArea / panelSA);
  totalPanels = numOfPanels;
  
  //energy is the total amount of power produced in a day.
  let energy = numOfPanels * powerWatts * DNI[month-1];
  return energy; // what is this energy per day   
}

function addToSolar() {
  findArea();
  if (y.value !== "start" && y.value !== "other") {
    solarArea.push(x.value);
    console.log(x.value);
    surfaceDir = y.options[y.selectedIndex].text;
    solarDirection.push(surfaceDir);
    console.log(surfaceDir);
  }
  listSolarItems();
  CalculateSolar();
}


function RemoveSolarSurface() {
  let num = document.getElementById('solarNum').value;
  if(num.length>0){
    if (solarArea.length > 1 || solarDirection.length >1) {
      if (num !== null && num !== undefined) {
        solarArea.splice(num - 1, 1);
        solarDirection.splice(num - 1, 1);
        const solarSurfacesList = document.getElementById('solarSurfaces');
        solarSurfacesList.removeChild(solarSurfacesList.children[num-1]);
        CalculateSolar();
      } else {
        alert("Enter the number of the area you want to not include.");
      }
    }else if(solarArea.length == 1){
      const solarSurfacesList = document.getElementById('solarSurfaces');
      solarSurfacesList.removeChild(solarSurfacesList.children[0]);
      solarArea.splice(num - 1, 1);
      solarDirection.splice(num - 1, 1);
      totalSolarEnergy = 0;
      totalPanels = 0;
      document.getElementById("solarResults").innerHTML = 0 + " Watts with a total panels of " + 0;
    }
    else {
      alert(`There are no areas added yet.`);
    }
    // annualElecSavings();
  }else{
    alert('Must put a number of surface you want to remove');
  }
}

//comeback to this code. Check area and then dividing and multiplying with energy produced,
function CalculateBio() {
  // adds the first set of distance and surface area to array.

  if (biogasArea.length == 0 && biogasDirection.length == 0) {
    if (y.value !== "start" && y.value !== "other") {
      findArea();
      biogasArea.push(x.value);
      surfaceDir = y.options[y.selectedIndex].text;
      biogasDirection.push(surfaceDir);
      listBioItems();
      totalBioEnergy = numOfBioDigestors(parseInt(biogasArea[0]));
      if(temperature[month-1] < 60) {
        alert("The temperature for " + monthName + " is approximately " + temperature[month-1] + ". The optimal temper is 60°F");
      }
      document.getElementById("bioResults").innerHTML = "Produces "+ totalBioEnergy + " Ccf and gives about " + bioHours + " hours of gas perday (one burner). Total number of digestors is " + totalDigestors + ". Will cost you about $" + bioDigestorCost*totalDigestors + " for all of them.";
    } else {
      if(y.value == "start"){
        alert("Please select an area and choose the surface's direction");
      }else if(y.value == "other"){
        alert("Your surface does not have a desirable direction. Choose another surfacae.");
      }
    }
  }
  // This is when the user adds another value to the array.
  else {
    let sumArea = 0;
    for (let i = 0; i < biogasArea.length; i++) {
      sumArea += parseInt(biogasArea[i]);
    }
    //lists all the arrays that the user has selected.
    totalBioEnergy = numOfBioDigestors(sumArea);
    document.getElementById("bioResults").innerHTML = "Produces "+ totalBioEnergy + " Ccf and gives about " + bioHours + " hours of gas perday (one burner). Total number of digestors is " + totalDigestors + ". Will cost you about $" + bioDigestorCost*totalDigestors + " for all of them.";
    if(temperature[month-1] < 60) {
      alert("The temperature for " + monthName + " is approximately " + temperature[month-1] + ". The optimal temper is 68°F");
    }
  }
}

function listBioItems() {
  const listItem = document.createElement('li');
  let digestorSA = (83 / 12) * (45 / 12);
  let numDigestors = parseInt(biogasArea[biogasArea.length - 1] / digestorSA);
  listItem.textContent = `${biogasArea[biogasArea.length - 1]} ft² & ${biogasDirection[biogasDirection.length - 1]}= ${numDigestors}`;
  document.getElementById('bioSurfaces').appendChild(listItem);
}

//need to work on this method. 
function numOfBioDigestors(surfaceArea) {
  //the surface area of panel
  let digestorSA = (83 / 12) * (45 / 12);
  let numOfDigestors = Math.ceil(surfaceArea / digestorSA);
  bioHours = numOfDigestors * 2;
  totalDigestors = numOfDigestors;
  let energy = numOfDigestors * ccfBioGas;
  return energy;
}

function addToBio() {
  findArea();
  if (y.value !== "start" && y.value !== "other") {
    biogasArea.push(x.value);
    console.log(x.value);
    surfaceDir = y.options[y.selectedIndex].text;
    biogasDirection.push(surfaceDir);
    console.log(surfaceDir);
  }
  listBioItems();
  CalculateBio();
}


function RemoveBioSurface() {
  let num = document.getElementById('bioNum').value;
  if(num.length>0){
    if (biogasArea.length >1 || biogasDirection.length > 1 ) {
      if (num !== null && num !== undefined) {
        biogasArea.splice(num - 1, 1);
        biogasDirection.splice(num - 1, 1);
        const bioSurfacesList = document.getElementById('bioSurfaces');
        bioSurfacesList.removeChild(bioSurfacesList.children[num-1]);
        CalculateBio();
      } else {
        alert("Enter the number of the area you want to not include.");
      }
    } else if(biogasArea.length == 1){
      const bioSurfacesList = document.getElementById('bioSurfaces');
      bioSurfacesList.removeChild(bioSurfacesList.children[0]);
      biogasArea.splice(num - 1, 1);
      biogasDirection.splice(num - 1, 1);
      totalBioEnergy = 0;
      totalDigestors = 0;
      document.getElementById("bioResults").innerHTML = 0 + " Ccf and gives about " + 0 + " hours of gas perday (one burner). Total number of digestors is " + 0.;
    }
    else {
      alert(`There are no areas added yet.`);
    }
  }else{
    alert('Must put a number of surface you want to remove');
  }
}

function annualElecSavings(){
  let elecPower = document.getElementById("elecConsumption").value;
  let elecCost = document.getElementById("elecCost").value; 
  let elecBP = document.getElementById("elecPeriod").value; 
  let yearDays = 365/elecBP;
  let dailyCurrent = (elecPower/elecBP)*1000;
  //totalSolarEnergy == is the daily solar energy production.
  let SREC = ((totalSolarEnergy/1000000)*365)*10; //How many SREC per year

  if( elecPower.length == 0 || elecBP.length == 0 || elecCost.length == 0){
        alert("You need to fill in the textboxes associtate with Electricity Power, Cost, or Billing Period");
  }else{
    document.getElementById("dailyElecConsumption").innerHTML = "Your daily electricity consumption is "+ dailyCurrent + " Wh";     // console.log("total solar energy is watts", totalSolarEnergy);
    let moneySaved = (elecCost/(elecPower*1000))*(totalSolarEnergy*elecBP); //(billing period amount of energy/its cost)* the energy produced from panels.  in watts
    let perDayElec = ((elecPower*1000)/(elecBP*24))*24; //gives the watts used per day. 
    let perDayElecCost = elecCost/elecBP;
    if(totalSolarEnergy<perDayElec) {
        document.getElementById("annualElecSavings").innerHTML = "The amount of energy produced by panels per day does not meet you daily electricity needs." + "Saves you " + totalSolarEnergy + " Wh per day. Money saved per billing period is $" + moneySaved + " or $" + moneySaved*(365/elecBP) + " anually."; 
    }else if(totalSolarEnergy == perDayElec){
      document.getElementById("annualElecSavings").innerHTML = "The amount of energy produced by panels per day meets your daily electricity needs almost equally.  You save about $" + Math.round(perDayElecCost*365) + " annually.";
    }else if(totalSolarEnergy>perDayElec){
      document.getElementById("annualElecSavings").innerHTML = "The amount of energy produced by panels per day meets your daily electricity needs. You save about $" + Math.round(perDayElecCost*365)  + " anually. It produces " 
      + Math.round((totalSolarEnergy-perDayElec)*365) + " Wh anually or " + (Math.round((totalSolarEnergy-perDayElec)*365))/1000 +  "kWh of energy more per year." + " Approximatley " + Math.round((totalSolarEnergy/24)/1000) + " kWh (kiloWattshour). per day";
    }


    let userPanelChoise = panelChoice.options[panelChoice.selectedIndex].text;
    console.log("the panel is ", userPanelChoise);
    let OHWCost = solarPanelsCost.get(userPanelChoise);
    console.log("cost of panel per watt", OHWCost);
    // let OHWCost = 2.98;
    let annualBP = 365/elecBP;
    let solarCost = (totalSolarEnergy/DNI[month-1]) * OHWCost; //This is the amount of energy produces per hour.
    let paybackPeriod = solarCost/((elecCost*annualBP) + SREC);
    document.getElementById("solarInstallationTotal").innerHTML = "Cost for residential panels: $"+ solarCost + ". The payback period is " + Math.round(paybackPeriod) + " years." + " Your solar system produces " + SREC + " SREC per year.";
    
    let perHourWatt = dailyCurrent/DNI[month-1];
    let cost = perHourWatt*OHWCost;

    //takes the users panel of choice.
    // let userPanelChoise = panelChoice.options[panelChoice.selectedIndex].text;
    let powerWatts = solarPanels.get(userPanelChoise);
    let neededPanels = perHourWatt/powerWatts;
    let SRECNeed = ((dailyCurrent/1000000)*365)*10; //How many SREC per year
    let paybackPeriodNeed = cost/((elecCost*annualBP) + SRECNeed);

    document.getElementById("actualNeedSolar").innerHTML = "You need " + Math.ceil(neededPanels) + " panels with the total solar system cost of $"+ cost.toFixed(2) +" before federal credits and tax rebates to go 100% solar. Payback period is " + Math.ceil(paybackPeriodNeed) + ". Will need about " + Math.ceil(Math.ceil(neededPanels)*panelSA) + " sq ft of surface area.";
  }
}

function annualGasSavings() {
  let gasPower = document.getElementById("gasConsumption").value;
  let gasCost = document.getElementById("gasCost").value;
  let gasBP = document.getElementById("gasPeriod").value;
  // let dailyGas = gasPower/gasBP;
  let perDayGas = (gasPower)/(gasBP); // averageMonthlyUsage/billing period. 


  if( gasPower.length >0 && gasBP.length>0 && gasCost.length>0){

    document.getElementById("dailyGasConsumption").innerHTML = "Your daily gas consumption is "+ perDayGas.toFixed(3) + " Ccf.";     // console.log("total solar energy is watts", totalSolarEnergy);

    let moneySaved = (gasCost/gasPower)*(totalBioEnergy*gasBP);
    let perDayGasCost = gasCost/gasBP;
    if(totalBioEnergy<perDayGas) {
      document.getElementById("annualGasSavings").innerHTML = "The amount of biogas produced per day by biodigestors does not meet you daily gas needs. You save about " + moneySaved + " every " + gasBP + " days.";
    }else if(totalBioEnergy==perDayGas){
    document.getElementById("annualGasSavings").innerHTML = "The amount of biogas produced per day by biodigestors meets you daily gas needs almost equally. You save about $" + Math.round(perDayGasCost*365) + " anually.";
    }else if((totalBioEnergy>perDayGas)){
    document.getElementById("annualGasSavings").innerHTML = "The amount of biogas produced per day by biodigestors meets you daily gas needs. You save about $" + Math.round(perDayGasCost*365)  +"annually. It produces" 
    + Math.round((totalBioEnergy)*365) + " Ccf of gas every year.";
    }
    // let vv = totalDigestors;
    document.getElementById("gasInstallationTotal").innerHTML = "Cost for biodigestors: $"+ totalDigestors*950;
    
    let numOfBioDigestorsNeeded = perDayGas/ccfBioGas;
    let bioCost = numOfBioDigestorsNeeded*bioDigestorCost;
    let totalWaste = numOfBioDigestorsNeeded*foodwaste;
    document.getElementById("actualNeedGas").innerHTML = "You need " + Math.ceil(numOfBioDigestorsNeeded) + " digestors to meed your daily needs. This would cost total of $"+ Math.round(bioCost.toFixed(2)) + " for basic biodigestor design. Gives you about " + Math.round(numOfBioDigestorsNeeded*2) +" hours of cooking on one burner per day. You need about " + Math.ceil(totalWaste) + " liters of food waste per day to put into all of your system combined." ;
  }
}



