angular.module('nodesGraph', []).directive('nodesGraph', function() {

  function draw($elem, data, diameter) {
    $elem.empty();
    
    var radius = diameter / 2,
        innerRadius = radius - 100;

    var cluster = d3.layout.cluster()
        .size([360, innerRadius])
        .sort(null)
        .value(function(d) { return d.size; });

    var bundle = d3.layout.bundle();

    var line = d3.svg.line.radial()
        .interpolate("bundle")
        .tension(.85)
        .radius(function(d) { return d.y; })
        .angle(function(d) { return d.x / 180 * Math.PI; });

    var svg = d3.select($elem[0]).append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
      .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    var link = svg.append("g").selectAll(".link"),
        node = svg.append("g").selectAll(".node");

    var nodes = cluster.nodes(parseData(data)),
        links = computeLinks(nodes);

    link = link
        .data(bundle(links))
      .enter().append("path")
        .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
        .attr("class", "link")
        .attr("d", line);

    node = node
        .data(nodes.filter(function(n) { return !n.children; }))
      .enter().append("text")
        .attr("class", "node")
        .classed("node-target", function(d) { return d.helpers.length==0 })
        .classed("node-source", function(d) { return d.helpers.length!=0 })
        .attr("dy", ".31em")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .text(function(d) { return ellipsis(d.name); })
        .on("mouseover", mouseovered(node, link))
        .on("mouseout", mouseouted(node, link));
  }
  
  function ellipsis(text) {
    if (text.length > 13) {
      return text.slice(0, 12) + '…';
    }
    return text;
  }
  
  function mouseovered(node, link) {
    return function(d) {
      node
          .each(function(n) { n.target = n.source = false; });

      link
          .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
          .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
        .filter(function(l) { return l.target === d || l.source === d; })
          .each(function() { this.parentNode.appendChild(this); });

      node
          .classed("node--active", function(n) { return n.target || n.source; });
    }
  }

  function mouseouted(node, link) {
    return function(d) {
      link
          .classed("link--target", false)
          .classed("link--source", false);

      node
          .classed("node--active", false);
    }
  }

  function parseData(data) {
    var parsedData = {},
        arrayData = [];
    
    data.forEach(function(n) {
      var node = $.extend(true, {}, n);
      node.key = node.name;
      parsedData[node.key] = node;
      
      node.helpers.forEach(function(helper) {
        if (!parsedData[helper]) {
          parsedData[helper] = {
            name: helper,
            key: helper,
            helpers: []
          };
        }
      });
    });
    
    for (var key in parsedData) {
      if (parsedData.hasOwnProperty(key)) {
        arrayData.push(parsedData[key]);
      }
    }
    
    arrayData.sort(function(a, b) {
      var ca = a.helpers.length,
          cb = b.helpers.length;
      
      if (ca==0 && cb==0) {
        return b.name.localeCompare(a.name);
      }
      else if (ca!=0 && cb!=0) {
        return a.name.localeCompare(b.name);
      }
      else {
        return cb-ca;
      }
    });

    return { children: arrayData };
  }

  function computeLinks(nodes) {
    var map = {},
        links = [];

    nodes.forEach(function(d) {
      map[d.name] = d;
    });

    nodes.forEach(function(d) {
      if (d.helpers) d.helpers.forEach(function(i) {
        links.push({source: map[d.name], target: map[i]});
      });
    });

    return links;
  }
  
  function goodWidth() {
    var ww = $(window).width();
    
    if (ww <= 460) {
      return 350;
    }
    else if (ww <= 768) {
      return 450;
    }
    else {
      return 660;
    }
  }

  return {
    restrict: 'E',
    template: '<div></div>',
    replace: true,
    scope: {
      data: '=data'
    },
    link: function($scope, $elem) {
      var width = goodWidth();
      
      $scope.$watchCollection('data', function() {
        $scope.$evalAsync(function() {
          if ($scope.data) {
            draw($elem, $scope.data, width);
          }
        });
      });
      
      $(window).on('resize', function() {
        var w = goodWidth();
        if (width != w && $scope.data) {
          width = w;
          draw($elem, $scope.data, width);
        }
      });
    }
  };
});