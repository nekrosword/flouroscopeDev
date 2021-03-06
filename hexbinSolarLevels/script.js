//values I expect sluice to give me"
var upperLeft = [-151,58], 
    bottomRight =[-54,10.5];


//Use info from the window size to draw the svg:
var margin = {top: 0, left: 0, bottom: 0, right: 0}
  , width = parseInt(d3.select('body').style('width'))
  , mapRatio = (9/16)
  , height = width * mapRatio; //this will need to be set to the default aspect ration for the WebThing

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//set up the projection: 
var projection = d3.geo.mercator()
    .scale(1)
    .translate([0,0]);

var path = d3.geo.path()
    .projection(projection);

var hexRadius = 14

var hexbin = d3.hexbin()
    .size([width, height])
    .radius(hexRadius);

var brightness = d3.scale.sqrt()
    .domain( [2, 8.2] ) 
    .range(["black", "gold"])

var ulPoint = projection(upperLeft), 
    brPoint = projection(bottomRight),
    s = 1 / Math.max((brPoint[0] - ulPoint[0]) / width, (brPoint[1] - ulPoint[1]) / height),
    t = [(width - s * (brPoint[0] + ulPoint[0])) / 2, (height - s * (brPoint[1] + ulPoint[1])) / 2];

// Update the projection to use computed scale & translate.
projection
    .scale(s)
    .translate(t);

console.log("t: " + t + ", s: " + s)

//Code to deal with a resizing of the WebThing:
var g = svg.append("g");

queue()
        .defer(d3.json,"world-110m2.json")
        .defer(d3.csv, "solarLevelsHexbin.csv")
        .await(ready);

function ready(error, topology, data) {
  data.forEach(function(d){
    var p = projection(d);
    d[0] = p[0], d[1] = p[1]; 
  });

  g.selectAll("path")
      .data(topojson.object(topology, topology.objects.countries)
          .geometries)
    .enter()
      .append("path")
      .attr("d", path)

  svg.append("g")
      .attr("class", "hexagons")
    .selectAll("path")
      .data(hexbin(data).sort(function(a,b){return b.length - a.length; }))
    .enter().append("path")
      .attr("d", hexbin.hexagon(0.1))
      .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; })
      .style("fill", function(d){ return brightness(d3.mean(d, function(d){return +d.annualAverage; }))})
      .on("mouseover", function(d){
          d3.select(this)
            .transition()
            .duration(50)
            .style("fill", "blue")
      })
      .on("mouseout", function(d){
          d3.select(this)
            .transition()
            .duration(2500)
            .style("fill", function(d){ return brightness(d3.mean(d, function(d){return +d.annualAverage; }))})
      })
      .transition()
      .duration(1000)
      .attr("d", hexbin.hexagon(hexRadius - 1))

}

// zoom and pan
var zoom = d3.behavior.zoom()
    .on("zoom",function() {
        g.attr("transform","translate("+ 
            d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        d3.select(".hexagons")
          .attr("transform","translate("+ 
              d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        // g.selectAll("circle")
        //     .attr("d", path.projection(projection));
        g.selectAll("path")  
            .attr("d", path.projection(projection)); 

console.log("Translate: " + d3.event.translate + ", Scale: " + d3.event.scale)
 
  });

svg.call(zoom)

