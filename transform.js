function getRandom(min, max)
{
    var r = Math.random();
    return Math.floor(r*r * (max - min)) + min;
}

function getAllIndexes(arr, val) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

function shuffle(text, l_min, l_max)
{
    var breaks = {start:Array(), end:Array()};
    var br=0;
    while (br < text.length) {
        var l = getRandom(l_min, l_max);
        breaks.start.push(br);
        br += l;
        breaks.end.push(Math.min(br, text.length));
    }

    for (var i=0; i<breaks.start.length - 1; i++) {
        if (Math.random() > 0.6) {
            var tmp = breaks.end[i]; breaks.end[i] = breaks.end[i+1]; breaks.end[i+1] = tmp;
            tmp = breaks.start[i]; breaks.start[i] = breaks.start[i+1]; breaks.start[i+1] = tmp;
        }
    }
    var res = '';
    for (var i=0; i<breaks.start.length; i++) {
        res += text.slice(breaks.start[i], breaks.end[i]);
    }
    return res;
}


function sequencer(mat, maps, texts, minMatch)
{
    function diff(m)
    {
        var diff = Array(m.length-1);
        for(var i=0; i<diff.length; i++) {
            diff[i] = m[i+1] - m[i];
        }
        return diff;
    }

    function positive_cost(p) {
        var x = forward ? p : maps.yx[p];
        var y = forward ? maps.xy[p] : p;
        if (x >= 0 && y >= 0) {
            var i_y = mat.y[x].indexOf(y);
            if (i_y >= 0)
                return mat.c[x][i_y] > 0;
        }
        return false;
    }

    var s = Array(2);

    for (var forward=0; forward<2; forward++)
    {
        s[forward] = {start: Array(), end: Array(), id: Array()};
        var ds = forward ? diff(maps.xy) : diff(maps.yx);
        ds.push(1);

        var id=0;
        var len = forward ? mat.nr : mat.nc;
        var start, end = 0;
        while (end < len)
        {
            start = end;
            while (start < len) {
                if (ds[start] == 1 && positive_cost(start)) {
                    break;
                } else {
                    start ++;
                }
            }
            end = start + 1;
            while (end < len) {
                if (ds[end-1] == 1 && positive_cost(end)) {
                    end ++;
                } else {
                    break;
                }
            }
            if (end - start > minMatch) {
                var map = forward ? maps.xy : maps.yx;
                s[forward].start.push(start);
                s[forward].end.push(end);
                if (forward) {
                    s[forward].id.push( s[0].id[ s[0].start.indexOf(map[start]) ]);
                } else {
                    s[forward].id.push(id++);
                }
                // console.log('seq ' + s[forward].id.slice(-1) + ' [' + start + ', ' +  end + ') -> [' + map[start] + ', ' + (map[end-1]+1) + ')   '
                //     + texts[forward].slice(start, Math.min(start+10, end)));
            }
        }
    }

    // logic to repair color repetitions
    var id_cnt = s[1].id.length;

    var lid = s[1].id, rid = s[0].id;
    var ilid = [], irid = [];
    var cbool = Array(5);

    for(var i=1; i<id_cnt; i++) {
        if (lid[i-1] % 5 == lid[i] % 5) {
            cbool.init(true);
            cbool[lid[i-1]%5] = false;
            if (i+1 < id_cnt) cbool[lid[i+1]%5] = false;
            var j = rid.indexOf(lid[i]);
            if (j-1 >= 0) cbool[rid[j-1]%5] = false;
            if (j+1 < id_cnt) cbool[rid[j+1]%5] = false;
            var col = id_cnt;
            while (!cbool[col%5] || lid.indexOf(col) != -1) col++;
            lid[i] = col;
            rid[j] = col;
        }
    }

    return s;
}
