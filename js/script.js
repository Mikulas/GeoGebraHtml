/* Author:

*/

"use strict";

var unique_id = 1;
function getUniqueId() {
	return unique_id++;
}

$(function() {
	// todo refactor
	// todo add partial rendering: circles with center|mouse radius before second point is selected etc
	$("#btn-point").click(function(e) {
		e.stopPropagation();
		$("input.active").removeClass("active");
		var $btn = $(this);
		$btn.addClass("active");
		$("#canvas").css("cursor", "crosshair");
		$("#canvas").click(function(e) {
			var el = new Point(new Position(e.pageX, e.pageY));
			el.createNode().render();
			c.add(el);
			$("#canvas").unbind("click");
			$("#canvas").css("cursor", "default");
			$btn.removeClass("active");
		});
	});
	$("#btn-line").click(function(e) {
		e.stopPropagation();
		$("input.active").removeClass("active");
		var $btn = $(this);
		$btn.addClass("active");
		$("#canvas").css("cursor", "crosshair");
		
		var el = null;
		$(document).click(function(e) {
			var pos = new Position(e.pageX, e.pageY);
			var point = c.getNearestPoint(pos);
			if (point === null) {
				point = new Point(pos);
				point.createNode().render();
				c.add(point);
			}
			point.node.addClass("selected");

			// step 1: first point
			console.log(el);
			if (el === null) {
				el = new Line(point, c.mouse);
				console.log(el);
				c.add(el);
				el.createNode().render();

			// step 2: second point
			} else {
				$(".point.selected").removeClass("selected");
				$(document).unbind("click");
				$("#canvas").css("cursor", "default");
				el.point2 = point;
				el.updateDependencies();
				el.render();
				$btn.removeClass("active");
			}
		});
	});
	$("#btn-circle").click(function(e) {
		e.stopPropagation();
		$("input.active").removeClass("active");
		var $btn = $(this);
		$btn.addClass("active");
		$("#canvas").css("cursor", "crosshair");

		var el = null;
		$(document).click(function(e) {
			var pos = new Position(e.pageX, e.pageY);
			var point = c.getNearestPoint(pos);
			if (point === null) {
				point = new Point(pos);
				point.createNode().render();
				c.add(point);
			}
			point.node.addClass("selected");

			// step 1: select center
			if (el === null) {
				el = new Circle(point, c.mouse);
				el.createNode().render();
				c.add(el);

			// step 2: select radius
			} else {
				$(document).unbind("click");
				$(".point.selected").removeClass("selected");
				$("#canvas").css("cursor", "default");
				el.radiusPoint = point;
				el.updateDependencies();
				el.render();
				$btn.removeClass("active");
			}
		});
	});
});

var Position = function(x, y) {
	this.x = x;
	this.y = y;
}

var Slope = Position;

var Container = function() {
	var that = this;
	this.elements = [];
	this.dragging = null;
	this.mouse = null;

	$(document).mousedown(function(e) {
		that.dragging = that.getNearestPoint(new Position(e.pageX, e.pageY));
		$(document).mouseup(function() {
			that.dragging = null;	
			$(document).unbind("mouseup");
		});
	});

	$(document).mousemove(function(e) {
		if (that.dragging !== null) {
			that.dragging.position.x = e.pageX;
			that.dragging.position.y = e.pageY;
			that.dragging.renderTree();
		}

		var pos = new Position(e.pageX, e.pageY);
		var point = that.getNearestPoint(pos);
		$(".hover").removeClass("hover");

		if (point === null) {
			that.setMousePoint(pos);
			that.mouse.renderTree(false);

		} else {
			point.node.addClass("hover");
			that.setMousePoint(point.position);
			that.mouse.renderTree(false);
		}
	});

	this.setMousePoint = function(pos) {
		if (this.mouse === null) {
			this.mouse = new Point(pos);
			this.mouse.container = this;
		} else {
			this.mouse.position = pos;
		}
	};

	this.getNearestPoint = function(position) {
		var threshold = 20;
		var point = null;
		$.each(this.elements, function(i, el) {
			if (el.instanceOf(Element.types.point) && el.getDistanceTo(position) < threshold) {
				point = el;
				threshold = el.getDistanceTo(position);
			}
		});
		return point;
	};

	this.get = function(id) {
		id = parseInt(id);
		var ret = null;
		$.each(this.elements, function(i, el) {
			if (el.id === id) {
				ret = el;
			}
		});

		if (ret === null) {
			throw Error("Element id " + id + " does not exist or is not registered with Container.");
		}

		return ret;
	};

	this.add = function(element) {
		element.container = this;
		this.elements.push(element);
	};

	this.render = function() {
		$.each(this.elements, function(i, el) {
			el.createNode().render();
		});
	};
};

var Element = function(type) {
	this.id = getUniqueId();
	this.size = 2;
	this.color = "black";
	this.type = type;
	this.node = null;
	this.container = null;

	this.instanceOf = function(type) {
		return type === this.type;
	};
	this.getDependencies = function() {
		return [];
	};
	this.getDependents = function() {
		var dependents = [];
		var that = this;
		$.each(this.container.elements, function(i, el) {
			if (el.dependsOn(that)) {
				dependents.push(el);
			}
		});
		return dependents;
	};
	this.updateDependencies = function() {
		this.node.data("depends-on", this.getDependencies());
	};
	this.dependsOn = function(element) {
		var ret = false;
		$.each(this.getDependencies(), function(i, el) {
			if (el.id === element.id) {
				ret = true;
			}
		});
		return ret;
	};
	this.createNode = function() {
		throw Error("Not implemented");
	};
	this.render = function() {
		throw Error("Not implemented");
	};

	/**
	 * @property bool	render this.node
	 */
	this.renderTree = function(self) {
		if (typeof self === "undefined" || self !== false)
			this.render();

		$.each(this.getDependents(), function(i, el) {
			el.renderTree();
		});
	};
}
Element.types = {point: 0, line: 1, circle: 2};

// todo add Object as mutual ancestor
var Point = function(position) {
	var that = new Element(Element.types.point);

	that.position = position;
	that.dragging = false;
	that.size = 7; // better rendering with odd numbers
	that.color = "blue";

	that.getDistanceTo = function(arg) {
		var p1 = this.position;
		var p2 = arg instanceof Position ? arg : arg.position;
		return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
	};
	that.createNode = function() {
		that.node = $("<div/>").attr("id", that.id)
			.addClass("object point")
			.css({width: that.size, height: that.size});
		return that;
	};
	that.render = function() {
		that.node.data("x", that.position.x).data("y", that.position.y)
			.offset({top: that.position.y - that.size/2, left: that.position.x - that.size/2})
			.css({"background-color": that.color});
		$("#canvas").append(that.node);
		return this;
	};
	return that;
}

/**
 * @property Point
 * @property Point|Slope
 */
var Line = function(point, arg) {
	var that = new Element(Element.types.line);

	that.point1 = point;
	that.point2 = null; // exactly one of point2 and slope must always be set
	that.slope = null;
	that.offset = 15000; // used for rendering purposes

	if (arg instanceof Element && arg.instanceOf(Element.types.point)) {
		that.point2 = arg;

	} else if (arg instanceof Slope) {
		that.slope = arg;

	} else {
		throw Error("Invalid argument passed to Line(Point, Point|Slope)");
	}

	that.getDependencies = function() {
		var deps = [that.point1];
		if (that.point2 !== null) {
			deps.push(that.point2);
		}
		return deps;
	};
	that.createNode = function() {
		that.node = $("<div/>").attr("id", that.id)
			.addClass("object line")
			.data("depends-on", that.getDependencies())
			.css({
				"-webkit-transform-origin": that.offset + "px 0px",
				height: that.size,
		});
		return that;
	};
	that.render = function() {
		var p1 = that.point1.position;
		var p2 = that.point2.position; // might be null in case we use slope
		
		if (that.slope !== null) {
			p2 = new Position(p1.x + that.slope.x, p1.y + that.slope.y);
		}
		
		if (p1.x === p2.x && p1.y === p2.y) {
			throw Error("Cannot create line from one point; [X1Y1] === [X2Y2]");
		}

		that.node.css({
			top: p1.y - that.size/2, left: p1.x - this.offset,
			"-webkit-transform": "rotate(" + Math.atan((p2.y - p1.y) / (p2.x - p1.x)) + "rad)",
			"background-color": that.color,
		});
		$("#canvas").append(that.node);
		return that;
	};
	return that;
}

/**
 * @property Point
 * @property Point|int
 */
var Circle = function(point, arg) {
	var that = new Element(Element.types.circle);
	that.center = point;
	that.radius = null; // exactly one of radius and radiusPoint must always be set
	that.radiusPoint = null;

	if (arg instanceof Element && arg.instanceOf(Element.types.point)) {
		that.radiusPoint = arg;
	} else {
		that.radius = arg;
	}

	that.getDependencies = function() {
		var deps = [that.center]; // todo move to separate method
		if (that.radiusPoint !== null) {
			deps.push(that.radiusPoint);
		}
		return deps;
	};

	that.getRadius = function() {
		var radius = null;
		if (that.radiusPoint === null) {
			radius = that.radius;
		} else {
			radius = that.center.getDistanceTo(that.radiusPoint);
		}
		return radius; // because of border thickness // todo fix
	};
	that.createNode = function() {
		that.node = $("<div/>").attr("id", that.id)
			.addClass("object circle")
			.data("depends-on", that.getDependencies());
		return that;
	};
	that.size = 1;
	that.render = function() {
		var p = that.center.position;
		var radius = that.getRadius();
		that.node.offset({top: p.y - radius, left: p.x - radius})
			.css({
				"border-width": that.size,
				width: 2 * (radius - that.size),
				height: 2 * (radius - that.size),
				"border-color": that.color,
			});
		$("#canvas").append(that.node);
		return that;
	};
	return that;
}

var c = new Container();
/*
var p1 = new Point(new Position(130, 130));
var p2 = new Point(new Position(80, 80));
var p3 = new Point(new Position(50, 50));
c.add(p1);
c.add(p2);
c.add(p3);
c.add(new Circle(p1, p2));
c.add(new Circle(p2, p1));
c.add(new Circle(p3, 10));
c.render();
//*/