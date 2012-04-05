/* Author:

*/

"use strict";

var unique_id = 1;
function getUniqueId() {
	return unique_id++;
}

Math.crossProduct = function(pos1, pos2) {
	return pos1.x * pos2.x - pos1.y * pos2.y;
};

$(function() {
	// todo refactor
	$("#btn-point").click(function(e) {
		e.stopPropagation();
		$("input.active").removeClass("active");
		var $btn = $(this);
		$btn.addClass("active");
		$("#canvas").css("cursor", "crosshair");
		$("#canvas").click(function(e) {
			var near = c.getNearestObject(c.mouse.position);
			var el = null;
			if (near === null) {
				el = new Point(c.mouse.position);

			} else if (near.instanceOf(Element.types.point)) {
				return false;

			} else if (near.instanceOf(Element.types.line)) {
				var line = new Line(new Point(new Position(c.mouse.position.x, 0)), new Slope(0, 1));
				el = near.getIntersection(line);
			}

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
				el.removeDependencyOn(c.mouse);
				el.point2 = point;
				el.dependencies.push(new Dependency(point, function(p) {
					el.point2 = p;
				}));
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
				el.removeDependencyOn(c.mouse);
				el.radiusPoint = point;
				el.dependencies.push(new Dependency(point, function(p) {
					el.radiusPoint = p;
				}));
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

var Slope = function(x, y) {
	this.x = x;
	this.y = y;
	this.getNormal = function() {
		return new Slope(this.y, -this.x);
	};
	this.getRatio = function() {
		return - this.y / this.x;
	};
}

var Dependency = function(element, callback) {
	this.element = element;
	this.callback = callback;
}

var Container = function() {
	var that = this;
	this.elements = [];
	this.dragging = null;
	this.mouse = null;

	$(document).mousedown(function(e) {
		var point = that.getNearestPoint(new Position(e.pageX, e.pageY));
		if (point === null || !point.moveable)
			return false;

		that.dragging = point;
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

		var object = that.getNearestObject(pos);
		if (object !== null) {
			object.node.addClass("hover");
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

	this.getNearestObject = function(position) {
		var threshold = 20;
		var object = null;
		$.each(this.elements, function(i, el) {
			var distance = el.getDistanceTo(position);
			if (distance < threshold) {
				object = el;
				threshold = distance;
			}
		});
		return object;
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
	var that = this;
	this.id = getUniqueId();
	this.label = this.id;
	this.size = 2;
	this.color = "black";
	this.type = type;
	this.node = null;
	this.labelNode = null;
	this.container = null;
	this.dependencies = [];

	this.instanceOf = function(type) {
		return type === this.type;
	};
	this.getDependents = function() {
		var dependents = [];
		$.each(this.container.elements, function(i, el) {
			if (el.dependsOn(that)) {
				dependents.push(el);
			}
		});
		return dependents;
	};
	this.updateDependents = function() {
		$.each(this.getDependents(), function(i, el) {
			that.getDependency(el).callback(that);
		});
	};
	this.removeDependencyOn = function(element) {
		$.each(this.dependencies, function(i, el) {
			if (el.element.id === element.id) {
				that.dependencies.splice(i, 1);
			}
		});
	};
	this.getDependency = function(element) {
		var dep = null;
		$.each(element.dependencies, function(i, el) {
			if (el.element.id === that.id) {
				dep = el;
			}
		});
		return dep;
	};
	this.dependsOn = function(element) {
		var ret = false;
		$.each(this.dependencies, function(i, el) {
			if (el.element.id === element.id) {
				ret = true;
			}
		});
		return ret;
	};
	this.getDistanceTo = function(element) {
		throw Error("Not implemented");
	};
	this.createLabelNode = function() {
		this.labelNode = $("<div/>").addClass("label").text(this.label).disableSelection();
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

		this.updateDependents();
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
	that.moveable = true;

	that.getDistanceTo = function(arg) {
		var p1 = this.position;
		var p2 = null;
		var substract = 0;
		
		if (arg instanceof Position) {
			p2 = arg;

		} else if (arg.instanceOf(Element.types.point)) {
			p2 = arg.position;
		
		} else if (arg.instanceOf(Element.types.circle)) {
			p2 = arg.center.position;
			substract = arg.radius;

		} else if (arg.instanceOf(Element.types.line)) {
			return that.getDistanceTo(arg.getPerpendicular(that).getIntersection(arg));
		}
		
		return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) - substract;
	};
	that.createNode = function() {
		that.createLabelNode();
		that.node = $("<div/>").attr("id", that.id)
			.addClass("object point")
			.css({width: that.size, height: that.size})
			.disableSelection();
		return that;
	};
	that.render = function() {
		that.labelNode.offset({top: that.position.y - that.size/2 + 10, left: that.position.x - that.size/2 + 10})
			.css({color: that.color});
		$("#canvas").append(that.labelNode);

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
	that.dependencies.push(new Dependency(point, function(p) {
		that.point1 = p;
	}));
	that.point2 = null; // exactly one of point2 and slope must always be set
	that.slope = null;
	that.offset = 15000; // used for rendering purposes

	if (arg instanceof Element && arg.instanceOf(Element.types.point)) {
		that.point2 = arg;
		that.dependencies.push(new Dependency(arg, function(p) {
			that.point2 = p;
		}));

	} else if (arg instanceof Slope) {
		that.slope = arg;

	} else {
		throw Error("Invalid argument passed to Line(Point, Point|Slope)");
	}

	that.getPerpendicular = function(point) {
		var line = new Line(point, that.getSlope().getNormal());
		line.dependencies.push(new Dependency(that, function(l) {
			line.slope = l.getSlope().getNormal();
		}));
		return line;
	};
	that.getIntersection = function(line) {
		var n1 = line.getSlope().getNormal();
		var n2 = that.getSlope().getNormal();
		if (n1 === n2) { // parallel lines never intersect
			return null;
		}

		var c = - n1.x * line.point1.position.x - n1.y * line.point1.position.y;
		var g = - n2.x * that.point1.position.x - n2.y * that.point1.position.y;
		
		var y = (n2.x * c - g * n1.x) / (n1.x * n2.y - n1.y * n2.x);
		var x = -(n1.y * y + c) / n1.x;
		
		// todo fix dividing be zero for axis perpendiculars

		var point = new Point(new Position(x, y));
		point.moveable = false;
		var callback = function(l) {
			point.position = that.getIntersection(line).position;
		};
		point.dependencies.push(new Dependency(that, callback));
		point.dependencies.push(new Dependency(line, callback));
		return point;
	};
	that.getDistanceTo = function(arg) {
		var point = null;
		var substract = 0;

		if (arg instanceof Position) {
			point = new Point(arg);

		} else if (arg.instanceOf(Element.types.line)) {
			return arg.getSlope() === that.getSlope() ? Infinity : 0;
		
		} else if (arg.instanceOf(Element.types.point)) {
			point = arg;
		
		} else if (arg.instanceOf(Element.types.circle)) {
			point = arg.center;
			substract = arg.radius;
		}
		
		return point.getDistanceTo(that) - substract;
	};
	that.getSlope = function() {
		if (that.slope !== null)
			return that.slope;

		return new Slope(that.point1.position.x - that.point2.position.x, that.point1.position.y - that.point2.position.y);
	};
	that.createNode = function() {
		that.createLabelNode();
		that.node = $("<div/>").attr("id", that.id)
			.addClass("object line")
			.css({
				"-webkit-transform-origin": that.offset + "px 0px",
				height: that.size,
		}).disableSelection();
		return that;
	};
	that.render = function() {
		var p1 = that.point1.position;
		var p2 = null;

		if (that.slope !== null) {
			p2 = new Position(p1.x + that.slope.x, p1.y + that.slope.y);

		} else {
			p2 = that.point2.position;
		}
		
		if (p1.x === p2.x && p1.y === p2.y) {
			throw Error("Cannot create line from one point; [X1Y1] === [X2Y2]");
		}

		if (that.label !== null) {
			var line = new Line(new Point(new Position(0, 0)), new Slope(0, 1));
			var inter = that.getIntersection(line).position.y;
			that.labelNode.css({
				top: inter + (that.getSlope().getRatio() < 0 ? -20 : 0), left: 5,
				"color": that.color,
			});
			$("#canvas").append(that.labelNode);
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
	that.dependencies.push(new Dependency(point, function(p) {
		that.center = p;
	}));
	that.radius = null; // exactly one of radius and radiusPoint must always be set
	that.radiusPoint = null;

	if (arg instanceof Element && arg.instanceOf(Element.types.point)) {
		that.radiusPoint = arg;
		that.dependencies.push(new Dependency(arg, function(p) {
			that.radiusPoint = p;
		}));
	} else {
		that.radius = arg;
	}

	that.getDistanceTo = function(arg) {
		var point = null;
		var substract = 0;

		if (arg instanceof Position) {
			point = new Point(arg);

		} else if (arg.instanceOf(Element.types.point)) {
			point = arg;
		
		} else if (arg.instanceOf(Element.types.circle)) {
			point = arg.center;
			substract = arg.radius;

		} else if (arg.instanceOf(Element.types.line)) {
			return arg.getDistanceTo(that);
		}
		
		return point.getDistanceTo(that) - substract;
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
			.disableSelection();
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
//*
var p1 = new Point(new Position(10, 100));
var p2 = new Point(new Position(100, 140));
var p3 = new Point(new Position(300, 50));
p3.color = "green";
c.add(p1);
c.add(p2);
c.add(p3);
var l1 = new Line(p1, p2);
c.add(l1);
var l1p = l1.getPerpendicular(p3);
c.add(l1p);
var intersect = l1.getIntersection(l1p);
intersect.color = "red";
c.add(intersect);
c.render();
//*/