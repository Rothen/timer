class Color {
    constructor(R, G, B) {
        this.R = R;
        this.G = G;
        this.B = B;
        this.HEX = this.toHex();
    }

    static fromHex(hex) {
        const hexs = hex.match(/.{1,2}/g);
        return new Color(parseInt(hexs[0], 16), parseInt(hexs[1], 16), parseInt(hexs[2], 16));
    }

    toHex() {
        return '#' + this.R.toString(16) + this.G.toString(16) + this.B.toString(16);
    }

    stepsToOtherColor(color) {
        return {
            R: (color.R - this.R) / 100,
            G: (color.G - this.G) / 100,
            B: (color.B - this.B) / 100
        }
    }

    toOtherColor(color, percentage) {
        const per_percent = this.stepsToOtherColor(color);
        return new Color(Math.round(this.R + percentage * per_percent.R), Math.round(this.G + percentage * per_percent.G), Math.round(this.B + percentage * per_percent.B));
    }
}

const side = 500;
const delta = 100;
const ringThickness = side * 0.1
const fps = 60

let draw = SVG().addTo('#drawing').size(side, side).id('svg')
let outer
let inner
let stuff
let startTime;
let endTime;
let passedTime;
let restTime;
let time
let interval;
let interval_time = 1000 / fps
let isPaused = false;
let isDeleted = false;

let minutes = 2;
let seconds = 0;
let lastStartedMinutes = minutes
let lastStartedSeconds = seconds

const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const pauseEl = document.getElementById('pause');
const playEl = document.getElementById('play');
const undoEl = document.getElementById('undo');
const svgEl = document.getElementById('svg')
svgEl.setAttribute('viewBox', '0 0 ' + side + ' ' + side)

const green = Color.fromHex('90ee90');
const orange = Color.fromHex('fab158');
const red = Color.fromHex('ff6662');
const orange_per_percent = green.stepsToOtherColor(orange);
const red_per_percent = orange.stepsToOtherColor(red);
let color = green;

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
    let inputSeconds = secondsEl.value;
    minutes = String(parseInt(minutes) + Math.floor(inputSeconds / 60))
    seconds = inputSeconds % 60
    minutesEl.value = minutes
    secondsEl.value = seconds
    format(minutesEl)
    format(secondsEl)
}

function createSvgArc(x, y, r, startAngle, endAngle) {
    if (startAngle > endAngle) {
        let s = startAngle;
        startAngle = endAngle;
        endAngle = s;
    }
    if (endAngle - startAngle > Math.PI * 2) {
        endAngle = Math.PI * 1.99999;
    }

    let largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;

    return ["M", x, y, "L", x + Math.cos(startAngle) * r, y - Math.sin(startAngle) * r, "A", r, r, 0, largeArc, 0, x + Math.cos(endAngle) * r, y - Math.sin(endAngle) * r, "L", x, y].join(" ");
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
    outer = draw.circle((side - delta)).fill(green.HEX).move(delta / 2, delta / 2)
    inner = draw.circle((side - delta) - ringThickness).move(ringThickness / 2 + delta / 2, ringThickness / 2 + delta / 2).fill('white')
    stuff = draw.path(createSvgArc(side / 2, side / 2, (side - delta) / 2, Math.PI / 2, Math.PI / 2)).fill(green.HEX).move(delta / 2, delta / 2)
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
    time = (minutes * 60 + seconds) * 1000

    startTime = new Date().getTime();
    endTime = startTime + time;

    interval = setInterval(() => {
        if (isPaused) {
            return;
        } else if (isDeleted) {
            clearSVG();
        }

        let currentTime = new Date().getTime();
        passedTime = currentTime - startTime;
        restTime = (endTime - currentTime);
        percent = Math.min(99.9999, (passedTime / time) * 100);
        
        color = green;

        if (percent >= 90) {
            let color_percent = (percent-90)*100 / 10
            color = orange.toOtherColor(red, color_percent);
        } else if (percent >= 80) {
            let color_percent = (percent - 80) * 100 / 10;
            color = green.toOtherColor(orange, color_percent);
        }

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
        outer.attr('fill', color.HEX);
        d = createSvgArc(side / 2, side / 2, (side - delta) / 2, Math.PI / 2, Math.PI / 2 - 2 * Math.PI * percent / 100)
        stuff.attr('d', d).attr('fill', color.HEX)
    }, interval_time)
}

function endReached() {
    pauseEl.classList.add('hidden')
    draw.circle((side - delta)).fill(red.HEX).move(delta / 2, delta / 2)
    draw.circle(side - delta).fill(red.HEX).move(delta / 2, delta / 2).animate({
        duration: 500,
        when: 'now'
    }).attr({ r: side / 2, opacity: 0 })

    draw.circle(side - delta).fill(red.HEX).move(delta / 2, delta / 2).animate({
        duration: 500,
        delay: 250,
        when: 'now'
    }).attr({ r: side / 2, opacity: 0 })

    draw.circle(side - delta).fill(red.HEX).move(delta / 2, delta / 2).animate({
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
    let newSize = Math.min(500, Math.min(window.innerHeight, window.innerWidth));
    draw.height(newSize);
    draw.width(newSize);
}

clearSVG();
resized();