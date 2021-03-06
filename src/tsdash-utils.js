// Basic code borrowed from d3.js project (https://github.com/d3/d3-array)

function determineBins(min, max, data_count) {

    function sturge(values) {
        return Math.ceil(Math.log(values) / Math.LN2) + 1;
    }

    function range(start, stop, step) {
        start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
        var i = -1,
            n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
            range = new Array(n);
        while (++i < n) {
            range[i] = start + i * step;
        }
        return range;
    }

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function createBins(start, stop, count) {
        var step = tickStep(start, stop, count);
        return range(
            Math.ceil(start / step) * step,
            Math.floor(stop / step) * step + step / 2, // inclusive
            step
        );
    }

    function tickStep(start, stop, count) {
        var step0 = Math.abs(stop - start) / Math.max(0, count),
            step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
            error = step0 / step1;
        if (error >= e10) step1 *= 10;
        else if (error >= e5) step1 *= 5;
        else if (error >= e2) step1 *= 2;
        return stop < start ? -step1 : step1;
    }

    return createBins(min, max, sturge(data_count));
}