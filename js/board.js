var can;
var ctx;
var curTool = "pen";
var paint = false;
var recording = false;
var frames = [];
var recordingLastFrame;
var currFrame;
var currTimeFromStart = 0;
var playing = false;
var brushSizeModifier = 1;
var lastMousePoint = {x:null, y:null}

window.onload = function() {
	can = document.getElementById("canvas");
	ctx = can.getContext("2d");
}

function distanceBetween2Points( point1, point2 ) {
	if(point1.x == null || point1.y == null || point2.x == null || point2.y == null) return 0;

	var dx = point2.x - point1.x;
	var dy = point2.y - point1.y;
	return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );	
}
	
function angleBetween2Points ( point1, point2 ) {
	var dx = point2.x - point1.x;
	var dy = point2.y - point1.y;	
	return Math.atan2( dx, dy );
}


function press(event) {
	paint = true;
	drawOnEvent(event);
}

function drag(event) {
	if(!paint) return;
	drawOnEvent(event);
}

function release(event) {
	paint = false;
	lastMousePoint = {x: null, y: null};
}

function pickTool(elem) {
	curTool = $(elem).text().toLowerCase();
	$('.tool_button').removeClass("selected");
	$(elem).addClass("selected");
}

function clearCanvas() {
	can.width = can.width;
}

function drawOnEvent(event) {
	var brushSize = 1;
	if(curTool == "eraser") 
		brushSize = 8;
	
	var halfBrushW = brushSize*brushSizeModifier/2;
	var halfBrushH = brushSize*brushSizeModifier/2;

	var frame = {};
	if(recording) {
		var currTime = (new Date()).getTime();
		frame.tool = curTool;
		frame.timeFromPrev = currTime - recordingLastFrameTime;
		recordingLastFrameTime = currTime;
	}
	
	var start = {x:lastMousePoint.x, y: lastMousePoint.y};
	if(recording) {
		frame.start = {x:lastMousePoint.x, y: lastMousePoint.y};
	}
	
	updateMousePosition(event);
	
	var end = {x:lastMousePoint.x, y: lastMousePoint.y};
	if(recording) {
		frame.end = {x:lastMousePoint.x, y: lastMousePoint.y};
	}
	
	var distance = parseInt(distanceBetween2Points( start, end ));
	if(distance == 0) {
		start.x = end.x;
		start.y = end.y;
	}
	var angle = angleBetween2Points( start, end );

	var x,y;

	for (var z = 0;z <= distance; z++)
	{
		x = start.x + (Math.sin(angle) * z) - halfBrushW;
		y = start.y + (Math.cos(angle) * z) - halfBrushH;

		if(curTool == "eraser") {					
			ctx.clearRect(x, y, brushSize*brushSizeModifier, brushSize*brushSizeModifier);
		}
		else {
			ctx.fillRect(x, y, brushSize*brushSizeModifier, brushSize*brushSizeModifier);
		}
	}
	
	if(recording) {
		frames.push(frame);
		currTimeFromStart += frame.timeFromPrev;
	}
}

function clearFrames() {
	frames = [];
	clearCanvas();
}


function toggleRecording(elem) {
	recording = !recording;
	
	$('#playhead').attr({max: (frames.length-1), value:(frames.length-1)});
	
	if(recording) {
		can.addEventListener("mousedown", press, false);
		can.addEventListener("mousemove", drag, false);
		can.addEventListener("mouseup", release);
		document.addEventListener("mouseup", release);
		
		$('#record_tools .tool_button').addClass('disabled');
		$('#tools .tool_button').removeClass('disabled');
		
		$('#playhead').attr('disabled', 'disabled');
		$(elem).removeClass('disabled');
		
		$(elem).html("Stop");
		$(elem).addClass("recording");
		
		
		recordingLastFrameTime = (new Date()).getTime();
		canvasToFrame(frames.length-1);
		
		if(frames.length == 0) {
			frames.push({start : {x: null, y:null}, end: {x: null, y:null}, timeFromPrev: 0});
		}
	}
	else {
		can.removeEventListener("mousedown", press);
		can.removeEventListener("mousemove", drag);
		can.removeEventListener("mouseup", release);
		document.removeEventListener("mouseup", release);
		
		$(elem).html("Record");
		$(elem).removeClass("recording");
		$('#timer').html(currTimeFromStart);
		
		$('#playhead').removeAttr('disabled');
		$('#tools .tool_button').addClass('disabled');
		$('#record_tools .tool_button').removeClass('disabled');
	}
}

function play() {
	if(playing || frames.length == 0) return;
	
	$('#record_tools .tool_button').addClass('disabled');
	
	currFrame = (Number)($('#playhead').val());
	playing = true;
	playFrame();
}

function canvasToFrame(frameNum) {
	this.gettingCanvasToFrame = true;		//need this to properly run the updateMousePosition. Should be refactored.
	clearCanvas();
	currTimeFromStart = 0;
	for(var i = 0; i <= frameNum; i++) {
		drawFrame(frames[i]);
		currTimeFromStart += frames[i].timeFromPrev;
	}
	lastMousePoint = {x: null, y: null};
	$('#timer').html(currTimeFromStart);
	this.gettingCanvasToFrame = false;
}

function drawFrame(frame) {
	lastMousePoint = {x: frame.start.x, y: frame.start.y};
	var e = {x: frame.end.x, y: frame.end.y};
	curTool = frame.tool;
	drawOnEvent(e);
}

function playFrame() {
	$('#playhead').val(currFrame);
	drawFrame(frames[currFrame]);
	currFrame++;
	
	if(typeof frames[currFrame] != 'undefined') {
		currTimeFromStart += frames[currFrame].timeFromPrev;		
		$('#timer').html(currTimeFromStart);
		
		setTimeout(playFrame, frames[currFrame].timeFromPrev);
	}
	else {
		$('#record_tools .tool_button').removeClass('disabled');
		playing = false;
		lastMousePoint = {x: null, y: null};
	}
}

function updateMousePosition(event) {
	if(typeof event == 'undefined') return;
	
	if(!recording || this.gettingCanvasToFrame) {
		lastMousePoint = {x: event.x, y: event.y};
	}
	else {
		var target = event;
		var offset = $(can).offset();
		lastMousePoint.x = target.pageX - offset.left;
		lastMousePoint.y = target.pageY - offset.top;
	}
}

function exportRecording() {
	var exp = JSON.stringify(frames);
	console.log(exp)
}