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
				var intersecting = c.getNearestObject(c.mouse.position, [near.id]);
				var line = null;
				
				if (intersecting !== null && intersecting.instanceOf(Element.types.line)
				// if the lines are parallel, we would get into a lot of trouble
				&& near.getSlope().getRatio() !== intersecting.getSlope().getRatio()) {
					line = intersecting;
					el = near.getIntersection(line);

				} else {
					line = new Line(new Point(new Position(c.mouse.position.x, 0)), new Slope(0, 1));
					el = near.getIntersection(line);
					el.constrainMovementTo = [];
					el.constrainMovementTo.push(near);
				}

			} else if (near.instanceOf(Element.types.circle)) {
				var intersecting = c.getNearestObject(c.mouse.position, [near.id]);
				if (intersecting !== null && intersecting.instanceOf(Element.types.line)) {
					line = intersecting;
					var inters = line.getIntersection(near);
					el = inters[0].getDistanceTo(c.mouse) < inters[1].getDistanceTo(c.mouse) ? inters[0] : inters[1];

				} else if (intersecting !== null && intersecting.instanceOf(Element.types.circle)) {
					var inters = near.getIntersection(intersecting);
					el = inters[0].getDistanceTo(c.mouse) < inters[1].getDistanceTo(c.mouse) ? inters[0] : inters[1];
					console.log(el);

				} else {
					el = near.getClosestPointTo(c.mouse);
				}
			}

			c.add(el);
			el.createNode().render();
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
			var ignoreIds = el === null ? [] : [el.id];
			var near = c.getNearestObject(c.mouse.position, ignoreIds);
			var point = null;
			if (near === null) {
				point = new Point(c.mouse.position);
				c.add(point);

			} else if (near.instanceOf(Element.types.point)) {
				point = near;

			} else if (near.instanceOf(Element.types.line)) {
				var line = new Line(new Point(new Position(c.mouse.position.x, 0)), new Slope(0, 1));
				point = near.getIntersection(line);
				point.constrainMovementTo = [];
				point.constrainMovementTo.push(near);
				c.add(point);
			}
			point.createNode().render();
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
	$("#btn-line-perpendicular").click(function(e) {
		e.stopPropagation();
		$("input.active").removeClass("active");
		var $btn = $(this);
		$btn.addClass("active");
		$("#canvas").css("cursor", "crosshair");

		var el = null;
		var point = null;
		$(document).click(function(e) {
			var ignoreIds = el === null ? [] : [el.id];
			var near = el === null ? c.getNearestObject(c.mouse.position, ignoreIds) : c.getNearestPoint(c.mouse.position);
			var finalize = function() {
				$(document).unbind("click");
				$("#canvas").css("cursor", "default");
				$btn.removeClass("active");
				console.log(el);
			};
			if (near === null) {
				near = new Point(c.mouse.position); // intentionally clonning
				c.add(near);
				near.createNode().render();
			}

			if (near.instanceOf(Element.types.point) && el === null) {
				point = near;

			} else if (near.instanceOf(Element.types.point) && el !== null) {
				el.point1 = near;
				el.removeDependencyOn(c.mouse);
				el.dependencies.push(new Dependency(el.point1, function(p) {
					el.point1 = p;
				}))
				finalize();

			} else if (near.instanceOf(Element.types.line) && point === null) {
				el = near.getPerpendicular(c.mouse);
				c.add(el);
				el.createNode().render();

			} else if (near.instanceOf(Element.types.line) && point !== null) {
				el = near.getPerpendicular(point);
				c.add(el);
				el.createNode().render();
				finalize();
			}
		});
	});
	$("#btn-line-parallel").click(function(e) {
		e.stopPropagation();
		$("input.active").removeClass("active");
		var $btn = $(this);
		$btn.addClass("active");
		$("#canvas").css("cursor", "crosshair");

		var el = null;
		var point = null;
		$(document).click(function(e) {
			var ignoreIds = el === null ? [] : [el.id];
			var near = el === null ? c.getNearestObject(c.mouse.position, ignoreIds) : c.getNearestPoint(c.mouse.position);
			var finalize = function() {
				$(document).unbind("click");
				$("#canvas").css("cursor", "default");
				$btn.removeClass("active");
				console.log(el);
			};
			if (near === null) {
				near = new Point(c.mouse.position); // intentionally clonning
				c.add(near);
				near.createNode().render();
			}

			if (near.instanceOf(Element.types.point) && el === null) {
				point = near;

			} else if (near.instanceOf(Element.types.point) && el !== null) {
				el.point1 = near;
				el.removeDependencyOn(c.mouse);
				el.dependencies.push(new Dependency(el.point1, function(p) {
					el.point1 = p;
				}))
				finalize();

			} else if (near.instanceOf(Element.types.line) && point === null) {
				el = near.getParallel(c.mouse);
				c.add(el);
				el.createNode().render();

			} else if (near.instanceOf(Element.types.line) && point !== null) {
				el = near.getParallel(point);
				c.add(el);
				el.createNode().render();
				finalize();
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
				c.add(point);
				point.createNode().render();
			}
			point.node.addClass("selected");

			// step 1: select center
			if (el === null) {
				el = new Circle(point, c.mouse);
				c.add(el);
				el.createNode().render();

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
	this.getSine = function() {
		return this.y / Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	};
	this.getCosine = function() {
		return Math.sqrt(1 - Math.pow(this.getSine(), 2));
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
		if (point === null || !point.isMoveable())
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
			if (that.dragging.constrainMovementTo.length === 0) {
				that.dragging.position.y = e.pageY;

			} else if (that.dragging.constrainMovementTo.length === 1) {
				if (that.dragging.constrainMovementTo[0].instanceOf(Element.types.line)) {
					var line = that.dragging.constrainMovementTo[0];
					var slope = line.getSlope();
					that.dragging.position.y = line.point1.position.y + slope.getRatio() * (line.point1.position.x - e.pageX); // TODO FIX

				} else if (that.dragging.constrainMovementTo[0].instanceOf(Element.types.circle)) {
					var circle = that.dragging.constrainMovementTo[0];
					that.dragging.position = circle.getClosestPointTo(c.mouse).position;
				}
			}
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

	this.getNearestObject = function(position, ignoreIds) {
		if (typeof ignoreIds === "undefined")
			ignoreIds = [];

		var threshold = 20;
		var object = null;
		$.each(this.elements, function(i, el) {
			if ($.inArray(el.id, ignoreIds) === -1) {
				var distance = el.getDistanceTo(position);
				if (distance < threshold) {
					object = el;
					threshold = distance;
				}
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
		if (element.node !== null) {
			throw Error("Element node was already created without proper id given by container.");
		}

		element.id = getUniqueId();
		element.label = element.id;
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
	this.id = null;
	this.label = "";
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
		console.log(this, element);
		for(var i = 0; i < this.dependencies.length; i++) { // $.each would crash with splice
			if (this.dependencies[i].element.id === element.id) {
				that.dependencies.splice(i, 1);
			}
		};
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
	that.constrainMovementTo = [];

	that.isMoveable = function() {
		return that.constrainMovementTo.length <= 1;
	}
	that.getDistanceTo = function(arg) {
		var p1 = this.position;
		var p2 = null;
		
		if (arg instanceof Position) {
			p2 = arg;

		} else if (arg.instanceOf(Element.types.point)) {
			p2 = arg.position;
		
		} else if (arg.instanceOf(Element.types.line)) {
			return that.getDistanceTo(arg.getPerpendicular(that).getIntersection(arg));

		} else if (arg.instanceOf(Element.types.circle)) {
			return that.getDistanceTo(arg.getClosestPointTo(that));
		}
		
		
		return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
	};
	that.isDefined = function() {
		return !(isNaN(that.position.x) || isNaN(that.position.y));
	};
	that.createNode = function() {
		that.createLabelNode();
		if (!that.isMoveable()) {
			that.color = "#493";
		}
		that.node = $("<div/>").attr("id", that.id)
			.addClass("object point")
			.css({width: that.size, height: that.size})
			.disableSelection();
		return that;
	};
	that.render = function() {
		if (!that.isDefined()) {
			that.node.remove();
			that.labelNode.remove();
			return this;
		}

		that.labelNode.offset({top: that.position.y - that.size/2 + 10, left: that.position.x - that.size/2 + 10})
			.css({color: that.color});
		$("#canvas").append(that.labelNode);

		that.node.offset({top: that.position.y - that.size/2, left: that.position.x - that.size/2})
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
	that.getParallel = function(point) {
		var line = new Line(point, that.getSlope());
		line.dependencies.push(new Dependency(that, function(l) {
			line.slope = l.getSlope();
		}));
		return line;
	};
	that.getIntersection = function(arg) {
		if (arg.instanceOf(Element.types.line)) {
			var line = arg;
			var n1 = line.getSlope().getNormal();
			var n2 = that.getSlope().getNormal();
			if (n1 === n2) { // parallel lines never intersect
				return null;
			}

			var c = - n1.x * line.point1.position.x - n1.y * line.point1.position.y;
			var g = - n2.x * that.point1.position.x - n2.y * that.point1.position.y;
			
			var x;
			var y = (n2.x * c - g * n1.x) / (n1.x * n2.y - n1.y * n2.x);
			if (n1.x !== 0) {
				x = -(n1.y * y + c) / n1.x;
			} else {
				x = that.point1.position.x;
			}
			
			var point = new Point(new Position(x, y));
			point.constrainMovementTo.push(line);
			point.constrainMovementTo.push(that);
			var callback = function(l) {
				point.position = that.getIntersection(line).position;
			};
			point.dependencies.push(new Dependency(that, callback));
			point.dependencies.push(new Dependency(line, callback));
			return point;

		} else if (arg.instanceOf(Element.types.circle)) {
			// http://mathworld.wolfram.com/Circle-LineIntersection.html
			var pos1 = new Position(that.point1.position.x, that.point1.position.y); // must be cloned
			var spp = that.getSecondPoint().position;
			var pos2 = new Position(spp.x, spp.y);

			// computation for S[0;0], it's easiest to just move the points
			var c = arg.center.position;
			pos1.x -= c.x;
			pos1.y -= c.y;
			pos2.x -= c.x;
			pos2.y -= c.y;

			var dx = pos2.x - pos1.x;
			var dy = pos2.y - pos1.y;
			var dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			var D = pos1.x * pos2.y - pos2.x * pos1.y;

			var disc = Math.sqrt(Math.pow(arg.getRadius(), 2) * Math.pow(dr, 2) - Math.pow(D, 2));
			var sgn = dy < 0 ? -1 : 1;
			var x1 = (D * dy + sgn * dx * disc) / Math.pow(dr, 2);
			var x2 = (D * dy - sgn * dx * disc) / Math.pow(dr, 2);
			var y1 = (- D * dx + Math.abs(dy) * disc) / Math.pow(dr, 2);
			var y2 = (- D * dx - Math.abs(dy) * disc) / Math.pow(dr, 2);
			
			// todo seriously? copy paste? rewrite it you lazy biatch!

			var point1 = new Point(new Position(x1 + c.x, y1 + c.y));
			point1.constrainMovementTo.push(that);
			point1.constrainMovementTo.push(arg);
			point1.dependencies = [];			
			var callback1 = function(l) {
				point1.position = that.getIntersection(arg)[0].position;
			};
			point1.dependencies.push(new Dependency(that, callback1));
			point1.dependencies.push(new Dependency(arg, callback1));

			var point2 = new Point(new Position(x2 + c.x, y2 + c.y));
			point2.constrainMovementTo.push(that);
			point2.constrainMovementTo.push(arg);
			point2.dependencies = [];
			var callback2 = function(l) {
				point2.position = that.getIntersection(arg)[1].position;
			};
			point2.dependencies.push(new Dependency(that, callback2));
			point2.dependencies.push(new Dependency(arg, callback2));

			return [point1, point2];
		}
	};
	that.getDistanceTo = function(arg) {
		if (arg instanceof Position) {
			return (new Point(arg)).getDistanceTo(that);
		
		} else if (arg.instanceOf(Element.types.point)) {
			return arg.getDistanceTo(that);

		} else if (arg.instanceOf(Element.types.line)) {
			return arg.getSlope() === that.getSlope() ? Infinity : 0;
		
		} else if (arg.instanceOf(Element.types.circle)) {
			return arg.getDistanceTo(that);

		} else {
			throw Error("not implemented");
		}
	};
	that.getSecondPoint = function() {
		if (that.point2 !== null) {
			return that.point2;
		}
		var pos = that.point1.position;
		return new Point(new Position(
			pos.x + that.slope.x,
			pos.y + that.slope.y
		));
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
		that.label = that.getSlope().getSine();
		that.labelNode.text(that.label);

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
	that.size = 1;

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
	that.getIntersection = function(arg) {
		if (arg.instanceOf(Element.types.line)) {
			return arg.getIntersection(arg);
		
		} else if (arg.instanceOf(Element.types.circle)) {
			// http://local.wasp.uwa.edu.au/~pbourke/geometry/2circle/
			// a = (r02 - r12 + d2 ) / (2 d)
			var d = that.center.getDistanceTo(arg.center);
			that.color = "red"; that.render();
			var a = (Math.pow(that.getRadius(), 2) - Math.pow(arg.getRadius(), 2) + Math.pow(d, 2)) / (2 * d);
			var slope = new Slope(that.center.position.x - arg.center.position.x, that.center.position.y - arg.center.position.y);
			var signx = that.center.position.x > arg.center.position.x ? -1 : 1;
			var signy = that.center.position.y > arg.center.position.y ? -1 : 1;
			var T = new Point(new Position(
				that.center.position.x + signx * a * Math.abs(slope.getCosine()),
				that.center.position.y + signy * a * Math.abs(slope.getSine())
			));
			var perp = new Line(T, slope.getNormal());
			perp.dependencies = [];
			var inters = perp.getIntersection(that);

			inters[0].dependencies = [];
			inters[0].constrainMovementTo.push(that);
			inters[0].constrainMovementTo.push(arg);
			var callback1 = function() {
				inters[0].position = that.getIntersection(arg)[0].position;
			};
			inters[0].dependencies.push(new Dependency(that, callback1));
			inters[0].dependencies.push(new Dependency(arg, callback1));

			inters[1].dependencies = [];
			inters[1].constrainMovementTo.push(that);
			inters[1].constrainMovementTo.push(arg);
			var callback2 = function() {
				inters[1].position = that.getIntersection(arg)[1].position;
			};
			inters[1].dependencies.push(new Dependency(that, callback2));
			inters[1].dependencies.push(new Dependency(arg, callback2));

			return inters;
		}
	};
	that.getClosestPointTo = function(point) {
		var c = that.center.position;
		var target = new Point(new Position(
			point.position.x,
			point.position.y < c.y ? point.position.y + 2*(c.y - point.position.y) : point.position.y
		));
		var line = new Line(that.center, target);
		var n = line.getSlope().getNormal();
		var sin = n.getSine();
		var cos = n.getCosine();
		var l1 = line.getPerpendicular(new Point(new Position(
			c.x + that.getRadius() * sin,
			c.y + that.getRadius() * cos
		)));
		
		var inter = line.getIntersection(l1);
		if (point.position.y !== target.position.y) {
			inter.position.y -= 2 * cos * that.getRadius();
		}
		inter.constrainMovementTo = [];
		inter.constrainMovementTo.push(that);
		inter.dependencies = [];
		inter.dependencies.push(new Dependency(that, function(c) {
			inter.position = c.getClosestPointTo(inter).position;
		}));
		return inter;
	}
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
var p1 = new Point(new Position(200, 200));
var p2 = new Point(new Position(200, 400));
var p3 = new Point(new Position(400, 200));
var p4 = new Point(new Position(800, 200));
var s = new Point(new Position(300, 300));
c.add(p1);
c.add(p2);
c.add(p3);
c.add(p4);
c.add(s);
var l1 = new Line(p1, p4);
var l2 = new Line(p2, p3);
var l3 = new Line(p1, p2);
c.add(l1);
c.add(l2);
c.add(l3);
var circle = new Circle(s, 200);
c.add(circle);

//var ints = [];
var ints = l1.getIntersection(circle).concat(l2.getIntersection(circle)).concat(l3.getIntersection(circle));
$.each(ints, function(i, el) {
	c.add(el);
})
c.render();
//*/