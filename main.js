var isPaused = false;
var isDeleted = false;
var minutesEl = document.getElementById('minutes');
var secondsEl = document.getElementById('seconds');
var pauseEl = document.getElementById('pause');
var playEl = document.getElementById('play');
var undoEl = document.getElementById('undo');
var minutes = 2;
var seconds = 0;
var lastStartedMinutes = minutes
var lastStartedSeconds = seconds
var percent = 0
var side = 500;
var delta = 100;
var ringThickness = side * 0.1
var draw = SVG().addTo('#drawing').size(side, side).id('svg')
var outer = draw.circle(side).fill('lightgreen')
var inner = draw.circle(side - ringThickness).move(ringThickness / 2, ringThickness / 2).fill('white')
var stuff = draw.path(createSvgArc(side / 2, side / 2, (side - ringThickness) / 2, Math.PI / 2, Math.PI / 2 - 2 * Math.PI * percent / 100)).fill('lightgreen')

var startTime = 0;
var endTime = 0;
var passedTime = 0;
var restTime = 0;
var time = 0 // Seconds
var fps = 60 // Milli Seconds
interval_time = 1000 / fps

var interval = null;
var svg = document.getElementById('svg')
svg.setAttribute('viewBox', '0 0 ' + side + ' ' + side)

var green = {
    R: 144,
    G: 238,
    B: 144
}
var orange = {
    R: parseInt('fa', 16),
    G: parseInt('B1', 16),
    B: parseInt('58', 16)
}
var red = {
    R: parseInt('ff', 16),
    G: parseInt('66', 16),
    B: parseInt('62', 16)
}

var orange_per_percent = {
    R: (orange.R - green.R) / 100,
    G: (orange.G - green.G) / 100,
    B: (orange.B - green.B) / 100
}

var red_per_percent = {
    R: (red.R - orange.R) / 100,
    G: (red.G - orange.G) / 100,
    B: (red.B - orange.B) / 100
}

function format(input) {
    if (input.value.length === 1) {
        input.value = "0" + input.value;
    } else if (input.value.length > 2 && input.value.startsWith('0') && parseInt(input.value) != 0) {
        input.value = parseInt(input.value, 10);
        format(input)
    }
}

function setMinutes() {
    minutes = minutesEl.value;
    format(minutesEl)
}

function setSeconds() {
    var inputSeconds = secondsEl.value;
    minutes = String(parseInt(minutes) + Math.floor(inputSeconds / 60))
    seconds = inputSeconds % 60
    minutesEl.value = minutes
    secondsEl.value = seconds
    format(minutesEl)
    format(secondsEl)
}

function createSvgArc(x, y, r, startAngle, endAngle) {
    if (startAngle > endAngle) {
        var s = startAngle;
        startAngle = endAngle;
        endAngle = s;
    }
    if (endAngle - startAngle > Math.PI * 2) {
        endAngle = Math.PI * 1.99999;
    }

    var largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;

    return [
        "M",
        x,
        y,
        "L",
        x + Math.cos(startAngle) * r,
        y - Math.sin(startAngle) * r,
        "A",
        r,
        r,
        0,
        largeArc,
        0,
        x + Math.cos(endAngle) * r,
        y - Math.sin(endAngle) * r,
        "L",
        x,
        y
    ].join(" ");
}

function clearSVG() {
    if (interval) {
        clearInterval(interval)
        interval = null;
    }
    playEl.classList.remove('hidden');
    pauseEl.classList.add('hidden');
    undoEl.classList.add('hidden');

    draw.clear()
    minutes = lastStartedMinutes
    seconds = lastStartedSeconds
    minutesEl.value = minutes
    secondsEl.value = seconds
    format(minutesEl)
    format(secondsEl)
    isPaused = false;
    isDeleted = false;
    startTime = 0;
    endTime = 0;
    passedTime = 0;
    restTime = 0;
    time = 0 // Seconds
    outer = draw.circle((side - delta)).fill('lightgreen').move(delta / 2, delta / 2)
    inner = draw.circle((side - delta) - ringThickness).move(ringThickness / 2 + delta / 2, ringThickness / 2 + delta / 2).fill('white')
    stuff = draw.path(createSvgArc(side / 2, side / 2, (side - delta) / 2, Math.PI / 2, Math.PI / 2)).fill('lightgreen').move(delta / 2, delta / 2)
}

function start() {
    playEl.classList.add('hidden');
    pauseEl.classList.remove('hidden');
    undoEl.classList.remove('hidden');

    if (isPaused) {
        isPaused = false;
        startTime = new Date().getTime() - passedTime;
        endTime = new Date().getTime() + restTime;
        return;
    }

    lastStartedMinutes = minutes
    lastStartedSeconds = seconds
    time = (minutes * 60 + seconds) * 1000 // Millieconds

    startTime = new Date().getTime();
    endTime = startTime + time;

    interval = setInterval(() => {
        if (isPaused) {
            return;
        } else if (isDeleted) {
            clearSVG();
        }

        var currentTime = new Date().getTime();
        passedTime = currentTime - startTime;
        restTime = (endTime - currentTime);
        percent = Math.min(99.9999, (passedTime / time) * 100);
        
        R = green.R;
        G = green.G;
        B = green.B;

        if (percent >= 90) {
            var color_percent = (percent-90)*100 / 10
            R = Math.round(orange.R + color_percent * red_per_percent.R);
            G = Math.round(orange.G + color_percent * red_per_percent.G);
            B = Math.round(orange.B + color_percent * red_per_percent.B);
        } else if (percent >= 80) {
            var color_percent = (percent - 80) * 100 / 10
            R = Math.round(green.R + color_percent * orange_per_percent.R);
            G = Math.round(green.G + color_percent * orange_per_percent.G);
            B = Math.round(green.B + color_percent * orange_per_percent.B);
        }

        var colorString = '#' + R.toString(16) + G.toString(16) + B.toString(16);

        if (percent === 99.9999) {
            clearInterval(interval);
            interval = null;
            endReached()
            minutes = 0
            seconds = 0
        } else {
            restTimeInMiutes = (restTime + 1000) / 1000 / 60
            minutes = Math.floor(restTimeInMiutes)
            seconds = Math.floor((restTimeInMiutes - minutes)*60)
        }
        minutesEl.value = minutes
        secondsEl.value = seconds
        format(minutesEl)
        format(secondsEl)
        outer.attr('fill', colorString);
        d = createSvgArc(side / 2, side / 2, (side - delta) / 2, Math.PI / 2, Math.PI / 2 - 2 * Math.PI * percent / 100)
        stuff.attr('d', d).attr('fill', colorString)
    }, interval_time)
}

function endReached() {
    pauseEl.classList.add('hidden')
    var colorString = '#' + red.R.toString(16) + red.G.toString(16) + red.B.toString(16);
    draw.circle((side - delta)).fill(colorString).move(delta / 2, delta / 2)
    draw.circle(side - delta).fill(colorString).move(delta / 2, delta / 2).animate({
        duration: 500,
        when: 'now'
    }).attr({ r: side / 2, opacity: 0 })

    draw.circle(side - delta).fill(colorString).move(delta / 2, delta / 2).animate({
        duration: 500,
        delay: 250,
        when: 'now'
    }).attr({ r: side / 2, opacity: 0 })

    draw.circle(side - delta).fill(colorString).move(delta / 2, delta / 2).animate({
        duration: 500,
        delay: 500,
        when: 'now'
    }).attr({ r: side / 2, opacity: 0 })
}

function pause() {
    playEl.classList.remove('hidden');
    pauseEl.classList.add('hidden');
    undoEl.classList.remove('hidden');
    isPaused = true;
}

function resized() {
    var newSize = Math.min(500, Math.min(window.innerHeight, window.innerWidth));
    draw.height(newSize);
    draw.width(newSize);
}

clearSVG();
resized();