"use strict";

// ----------------------------------------------------------------------------------------
// --------------------------- helper
// ----------------------------------------------------------------------------------------

Array.prototype.init = function(val)
{
    for (var i=0; i<this.length; i++) this[i] = val;
}

Array.prototype.max = function()
{
    var max = 0;
    var max_i = -1;
    for (var i=0; i<this.length; i++) {
        if (this[i] > max) {
            max = this[i];
            max_i = i;
        }
    }
    return {max: max, max_i: max_i}
}

Array.prototype.binaryIndexOf = function(item)
{
    var min = 0;
    var max = this.length - 1;
    var guess;

    while (min <= max) {
        guess = Math.floor((min + max) / 2);

        if (this[guess] === item) {
            return guess;
        }
        else {
            if (this[guess] < item) {
                min = guess + 1;
            }
            else {
                max = guess - 1;
            }
        }
    }

    return -1;
}

function check_slack(slack, slackx, mat, lx, ly)
{
    for (var y = 0; y < mat.nc; ++y) {
        var x = slackx[y];
        var i_y = mat.y[x].indexOf(y);
        cxy = i_y == -1 ? 0 : mat.c[x][i_y];
        if (lx[x] + ly[y] - cxy < slack[y])
            alert('slack error: '.concat(lx[x],' + ',ly[y],' - ',cxy,' - ',slack[y],' = ',lx[x] + ly[y] - cxy - slack[y]));
    }
}


// ----------------------------------------------------------------------------------------
// --------------------------- cost matrix computation
// ----------------------------------------------------------------------------------------

function makeCost(str_a, str_b, minMatch)
{
    var swap = str_a.length > str_b.length;
    if(swap)
    {
        var t = str_a;
        str_a = str_b;
        str_b = t;
    }
    var a = str_a.split('');
    var b = str_b.split('');

    // create index for characters in b
    var y_dic = Array(256*256);
    for (var i=0; i<b.length-1; i++) {
        var code = b[i].charCodeAt(0) % 256 * 256 + b[i+1].charCodeAt(0) % 256;
        if (!y_dic[code]) y_dic[code] = Array();
        y_dic[code].push(i);
    }

    /* Length of corresponding pieces in a and b is calculated. Efficient implementation by
     * doing lookahead for starting correspondences and grabbing those values otherwise
    */

    var c = Array(a.length);
    var y = Array(a.length);

    var c_cur_x = Array(a.length);  // materialized current row
    var c_prev_x = Array(a.length); // copy of last row
    c_cur_x.init(0);
    c_prev_x.init(0);

    var y_indices = Array();        // positions matching current letter in a
    var prev_y_indices = Array();   // copy of last y_indices
    var empty_array = Array();

    for(var x=0; x<a.length; x++)
    {
        c[x] = Array();
        y[x] = Array();

        for (var ind=0; ind<prev_y_indices.length; c_prev_x[ prev_y_indices[ind++] ] = 0);

        var arr_ptr = c_prev_x;
        c_prev_x = c_cur_x;
        c_cur_x = arr_ptr;

        prev_y_indices = y_indices;
        y_indices = y_dic[a[x].charCodeAt(0) % 256 * 256 + (x<a.length-1 ? a[x+1].charCodeAt(0) % 256 : 0)] || empty_array;   // || character not in y_dic / b

        for(var ind=0, prev_ind=0; ind<y_indices.length || prev_ind < prev_y_indices.length;)
        {
            var cur_y_ind = ind < y_indices.length ? y_indices[ind] : Number.MAX_SAFE_INTEGER;
            var prev_y_ind = prev_ind < prev_y_indices.length ? prev_y_indices[prev_ind] : Number.MAX_SAFE_INTEGER;

            var cxy = 0;
            var y_ind;

            if (prev_y_ind < cur_y_ind) {
                // a[x-1]==b[prev_y_ind], a[x]==b[prev_y_ind+1]
                y_ind = prev_y_ind + 1;
                prev_ind ++;
                if (prev_y_ind == cur_y_ind - 1) ind ++;
                if (y_ind < b.length && a[x] == b[y_ind]) cxy = c_prev_x[prev_y_ind];
            } else {
                // start new correspondence?
                y_ind = cur_y_ind;
                ind ++;
                var bound = Math.min(a.length - x, b.length - y_ind)
                while (cxy < bound && a[x+cxy] == b[y_ind+cxy]) cxy++;
            }

            if(cxy >= minMatch) {    // on suboptimal matchings remove constraint for tests
                c[x].push(cxy);
                y[x].push(y_ind);
            }
            c_cur_x[y_ind] = cxy;
        }
    }

    function cost (x, y_ind)
    {
        var i_y = y[x].binaryIndexOf(y_ind);
        // var i_y = y[x].indexOf(y_ind);
        return i_y == -1 ? 0 : c[x][i_y];
    }

    return {
        nr: a.length,
        nc: b.length,
        swap: swap,
        cost: cost,
        c: c,
        y: y,
        a: str_a,
        b: str_b
    };
}

// ----------------------------------------------------------------------------------------
// --------------------------- algorithm
// ----------------------------------------------------------------------------------------

/*
We solve an assignment problem in a full bipartite graph with nr nodes X and nc nodes Y.

We keep the following invariants:
lx[x] + ly[y] >= cost(x, y)
yx[xy[x]] = x && xy[yx[y]] = y with values -1 for unmatched nodes
slackx[y] and slack: lx[slackx[y]] + l[y] - cost(slackx[y],y) = slack[y]

We call the equality subgraph the nodes with the property:
lx[x] + ly[y] = cost(x, y)

We solve the problem assigning one node at a time, by the following procedure
- find an x that is unmatched
- try to find unmatched y that is connected to x in the equality subgraph
  by a path (alternating between nodes of X and Y, which we mark in S and T)
  - on success, match it, goto start
  - otherwise the last X-node in the path allows us to improve the node labels
    - there is one more X-node in the path, call it xx
    - compute slack such that slack[y] = lx[xx] + ly[y] - cost(xx, y)
    - decrease node labels for all x in the path
    - increase node labels for all y in the path
    - now the equality subgraph has a new edge starting in xx
- continue with previous step
  - the algorithm will terminate, because the growing path finally reaches a free node

It is important to note that the following holds:
x in S  <=>  x was in the queue (q[i] = x for some 0 <= i < q_back)
x in S  =>  xy[x] in T or x == q[0]
y in T  =>  yx[y] in S

The path growing procedure is implemented as an adapted version of the dijkstra algorithm.
This implementation is based on the following article:
https://www.topcoder.com/community/data-science/data-science-tutorials/assignment-problem-and-hungarian-algorithm/
*/

function max_cost_assignment(mat)
{
    var lx = Array(mat.nr), ly = Array(mat.nc);
    var xy = Array(mat.nr), yx = Array(mat.nc);
    var S  = Array(mat.nr),  T = Array(mat.nc);
    var slack = Array(mat.nc);
    var slackx = Array(mat.nc);
    var rev_path = Array(mat.nr);

    // debug
    var mark_pos = Array(mat.nr); mark_pos.init(0);

    // compute slack and slackx
    function add_to_tree(x, greedy_break)
    {
        if(xy[x] != -1) {   // not for root of path
            T[xy[x]] = true;
        }

        q[q_back++] = x;
        S[x] = true;

        // update slack and slackx
        var i_y = 0;
        for (var y=0; y<mat.nc; y++)
        {
            var cxy = 0;
            // merge mat.c[x] into cost(x, )
            if (i_y < mat.y[x].length && y == mat.y[x][i_y]) {
                cxy = mat.c[x][i_y];
                i_y ++;
            }

            if (lx[x] + ly[y] - cxy < slack[y]) {
                slack[y] = lx[x] + ly[y] - cxy;
                slackx[y] = x;
            }

            if (greedy_break && slack[y] == 0 && !T[y]) {
                if (slack0_pivot == -1) slack0_pivot = y;
                // condition leads immediately to a match in grow_eq_subgraph
                if (yx[y] == -1) {
                    slack0_pivot = y;
                    break;
                }
            }
        }
        // check_slack(slack, slackx, mat, lx, ly);
    }

    function augment(x, y) {
        x_aug = x;
        y_aug = y;
        found_augmentation = true;
    }

    // try to grow a path in the equality subgraph
    function explore_eq_subgraph()
    {
        while (q_back > q_front && !found_augmentation)
        {
            x = q[q_front++];

            // plausible heuristic: first try x_aug+1 with y_aug+1
            if (y_aug) {
                var y = y_aug + 1;
                if (!T[y] &&  yx[y] == -1 && mat.cost(x, y) == lx[x] + ly[y])
                {
                    augment(x, y);
                    stat_upper++; // stat
                    continue;
                }
            }

            // sparse heuristic: try only y with positive cost
            for (var i_y = 0; i_y < mat.y[x].length; ++i_y)
            {
                var y = mat.y[x][i_y];
                if (mat.c[x][i_y] == lx[x] + ly[y] && !T[y])
                {
                    if (yx[y] == -1)  // if y is unmatched
                    {
                        augment(x, y);
                        stat_mid++; // stat
                        break;
                    }

                    rev_path[yx[y]] = x;
                    add_to_tree(yx[y], false);
                }
            }
        }
    }

    // improve labels lx, ly to grow the equality subgraph
    function improve_labelling()
    {
        var delta = Number.MAX_SAFE_INTEGER;

        stat_improve++; // stat

        for (var y = 0; y < mat.nc; y++) {
            if (!T[y] && slack[y] < delta)
                delta = slack[y];
        }

        // adapt node labels: q holds all nodes in S
        lx[q[0]] -= delta;
        for (var i = 1; i < q_back; i++) {
            var x = q[i];
            lx[x] -= delta;
            ly[xy[x]] += delta;
        }

        slack0_pivot = -1;
        for (var y = 0; y < mat.nc; y++) {
            if (!T[y]) {
                slack[y] -= delta;
                if (slack[y] == 0) {
                    // store the first with ![T[y] && slack[y]==0, it exists
                    if (slack0_pivot == -1) slack0_pivot = y;
                    // condition leads immediately to a match in grow_eq_subgraph
                    if (yx[y] == -1) {
                        slack0_pivot = y;
                        break;
                    }
                }
            }
        }
    }

    // grow path in the equality subgraph
    function grow_eq_subgraph()
    {
        // search all y: this ensures path augmentation
        // for (var y = slack0_pivot; y < mat.nc; ++y)
        while (slack0_pivot != -1)
        {
            var y = slack0_pivot;
            slack0_pivot = -1;

            /* optimization idea: if vertex is matched with 0 cost, remove match
             * couldn't prove correctness of this
            if (yx[y] != -1 && mat.cost(yx[y], y) == 0) {
                xy[yx[y]] = -1;
                yx[y] = -1;
            } */

            // if (! (!T[y] && slack[y] == 0)) break;
            if (yx[y] == -1)    // if y is unmatched
            {
                augment(slackx[y], y);
                stat_lower++; // stat
                break;
            }
            else
            {
                stat_marks++; // stat
                mark_pos[match_cnt] ++;
                // if (!S[yx[y]])     // never false because: S[xy[y]] => T[y]
                rev_path[yx[y]] = slackx[y];
                add_to_tree(yx[y], true);
                // else T[y] = true; // is true anyways, as yx[y] cannot be the path root
            }
        }
    }

    // start with nothing matched
    xy.init(-1);
    yx.init(-1);

    // setup lx, ly feasible
    lx = Array(mat.nr);
    ly.init(0);
    var c_pp = Array(mat.nr);   // copy of cost for preprocessing

    for (var x = 0; x < mat.nr; x++) {
        c_pp[x] = mat.c[x].slice();
        var rm = c_pp[x].max();
        lx[x] = rm.max;
    }

    var row_order = Array(mat.nr);
    var match_cnt = 0;
    for (var preprocessed=false; ; preprocessed=true)
    {
        var rowmax = Array(mat.nr), rowmax_i = Array(mat.nr);
        for (var x = 0; x < mat.nr; x++) {
            var rm = c_pp[x].max();
            rowmax[x] = rm.max;
            rowmax_i[x] = rm.max_i;
            row_order[x] = x;
        }

        /* Algorithm performance strongly depends on the successive choice of x. We seperate
         * sparse rows from the rest and sort them by decreasing cost, to prefer longer matches.
         * The rest is sorted by decreasing sparsity, to match rows with many options at the end.
         * Zeros are put at the very end. Cost refers to row maxima - the most probable match.
        */
        var sparse_thresh = 5;  // threshold below which row is considered sparse
        function heuristic_order(i, j) {
            var secondary = (i - j) / mat.nc + i / mat.nc / mat.nc;
            if (mat.y[i].length > sparse_thresh && mat.y[j].length > sparse_thresh)
                return (mat.y[i].length - mat.y[j].length)  + secondary;
            else if (mat.y[i].length > sparse_thresh || rowmax[i] == 0)
                return  1 + (rowmax[i] == 0);
            else if (mat.y[j].length > sparse_thresh || rowmax[j] == 0)
                return -1 - (rowmax[j] == 0);
            else
                return (rowmax[j] - rowmax[i]) + secondary;
        }
        row_order.sort(heuristic_order);

        if (preprocessed) break;  // sort once again after greedy match

        // greedy match what is possible
        for (var x_o=0; x_o<mat.nr; x_o++)
        {
            var x = row_order[x_o];
            if (rowmax[x] == 0) continue;

            var y = mat.y[x][rowmax_i[x]];

            if (xy[x] == -1 && yx[y] == -1) {
                xy[x] = y;
                yx[y] = x;
                match_cnt ++;
                c_pp[x][rowmax_i[x]] = 0;
            }
        }
    }

    console.log(''.concat('preprocessor matched ', Math.round(10000 * match_cnt/mat.nr)/100,' % '));

    var stat_upper = 0, stat_mid = 0, stat_lower = 0, stat_marks = 0, stat_improve = 0;
    S.init(false);
    T.init(false);
    rev_path.init(-1);

    var q = Array(mat.nr); // this is a queue, we maintain it manually with q_front, q_back
    var x;

    // main loop to grow the matching
    for (; match_cnt < mat.nr; ++match_cnt)
    {
        var q_front = 0, q_back = 0;

        // init slack array (add_to_tree will completely rewrite slackx)
        slack.init(Number.MAX_SAFE_INTEGER);

        // select unmatched x as path root
        for (var x_o = 0; x_o < mat.nr; x_o ++)
        {
            var x = sort_by_cost ? row_order[x_o] : x_o;

            if (xy[x] == -1)    // if x is unmatched
            {
                add_to_tree(x, false);
                break;
            }
        }

        if (debug && q_back == q_front) {console.log('unexpected empty queue'); break;}

        var x_aug, y_aug;
        var found_augmentation = false;

        // augment path to unmatched y
        while (!found_augmentation)
        {
            var slack0_pivot = -1;

            explore_eq_subgraph();

            if (found_augmentation) break;

            improve_labelling();

            q_front = q_back;   // don't loose old entries of q; need them for sparse resetting

            grow_eq_subgraph();
        }

        // flip edges along augmenting path, thereby growing the matching by one
        for (var cx = x_aug, cy = y_aug, ty;
             cx != -1;
             cx = rev_path[cx], cy = ty)
        {
            ty = xy[cx];
            yx[cy] = cx;
            xy[cx] = cy;
        }

        // the following early stopping criterion is correct if:
        // there has to be some free x, with some y*, with better cost(x, y*) than cost(yx[y], y)
        if (early_stop && match_cnt % 10 == 0) {
            var only_crap_left = true;
            for (var x=0; x<mat.nr; x++) {
                if (xy[x] != -1) continue;
                for (var i_y=0; i_y<mat.y[x].length; i_y++) {
                    var y = mat.y[x][i_y];
                    if (yx[y] == -1 || mat.c[x][i_y] > mat.cost(yx[y], y)) {
                        only_crap_left = false;
                        break;
                    }
                }
                if (!only_crap_left) break;
            }
            if (only_crap_left) break;
        }

        // correct, because matching is already flipped
        for(var i=0; i<q_back; i++)
        {
            var x = q[i];
            S[x] = false;
            T[xy[x]] = false;
            rev_path[x] = -1;
        }

        // correctness check, on suboptimal matchings uncomment to check if sparse resets work
        if (debug)
        {
            if (match_cnt % 10 == 0) {
                for(var x=0; x<mat.nr; x++) if (S[x] != false || rev_path[x] != -1 || (xy[x] != -1 && x != yx[xy[x]])) alert('f*** x');
                for(var y=0; y<mat.nc; y++) if (T[y] != false || (yx[y] != -1 && y != xy[yx[y]]) ) alert('f*** y');
            }
            // S.init(false);  T.init(false);  rev_path.init(-1);
        }

    } // for match_cnt

    if (debug)
    {
        // log matches
        for(var x=1; x<mat.nr; x++) {
            if (mat.cost(x, xy[x]) != mat.cost(x-1, xy[x]-1)) {
                var c = mat.cost(x,xy[x]);
                console.log(''.concat('cost(', x, ',', xy[x], ') = ', c, '\n-> ', mat.a.slice(x, x+c), '\n-> ', mat.b.slice(xy[x], xy[x]+c)));
                console.log('+++++++++++++++++++++++++++++++++++++++++++');
            }
        }

        // log highest marked positions
        var mark_pos_id = Array(mat.nr);
        for (var i=0; i<mark_pos_id.length; i++) mark_pos_id[i] = i;
        mark_pos_id.sort(function(x,y) {return mark_pos[y]-mark_pos[x];});
        for (var i=0; i<10; i++) console.log(mark_pos_id[i] + ': ' + mark_pos[mark_pos_id[i]]);
    }

    var total_cost = 0, total_match = 0;
    for(var x=0; x<mat.nr; x++) {
        if (xy[x] == -1) continue;
        var c = mat.cost(x, xy[x]);
        total_cost += c;
        total_match += c > 0 ? 1 : 0;
    }

    console.log(''.concat('upper: ', stat_upper, ', mid: ', stat_mid, ', improve: ', stat_improve,
        ', lower: ', stat_lower, ', marks: ', stat_marks));
    console.log(''.concat('early stopping at ', Math.round(10000 * match_cnt/mat.nr)/100,
        ' %  saved ', (mat.nr - match_cnt), ' cycles, stopped with ', match_cnt, ' matches'));
    console.log(''.concat('total cost: ', total_cost, ', total match: ', total_match, ', nr: ', mat.nr, ', nc: ', mat.nc,
        ' minMatch: ', minMatch, mat.swap ? ' swapped': ''));

    return {xy: xy, yx: yx, cost: total_cost};
}


// ----------------------------------------------------------------------------------------
// --------------------------- program
// ----------------------------------------------------------------------------------------
var debug = false;
var early_stop = true;
var sort_by_cost = true;

// small
var textA = " Lorem ipsum dolor sit amet,  adipiscing elit. Pellentesque  eros, sodales in massa ac, cursus elementum lorem. In risus vitae lacus rhoncus ultricies non tellus. Aenean scelerisque varius elit a tempus. ornare vel tortor eget lobortis. Suspendisse velit ut metus commodo placerat nec eu risus. Suspendisse sit amet sapien, cursus eros vel, accumsan risus. fringilla imperdiet libero at lobortis tristique eros egestas quam pellentesque porttitor. venenatis nec urna a ultrices. In luctus, nisi vitae  ultricies justo, a sodales magna tempus consectetur, sapien lacus dui et arcu. Sed ac egestas nibh. Curabitur sit amet lectus feugiat, egestas dolor in, condimentum ipsum. Mauris ut elementum magna varius urna. Duis vel arcu at orci fermentum rutrum. Suspendisse varius tincidunt lectus eu pulvinar. Fusce tristique non in nunc. Sed maximus eu nulla ut sodales. Curabitur metus odio, faucibus quis ullamcorper eu,  odio non tincidunt. Vestibulum a orci vel ipsum sagittis mollis tempor vitae massa. Donec sit amet vehicula augue, nec mattis mi. Nulla ut vulputate ante, vitae tempor est. In eu pellentesque dui. Donec pulvinar dolor at pellentesque convallis. Maecenas risus neque, vulputate eu ipsum quis, laoreet ornare velit. Ut nec dapibus ipsum, sed sagittis ipsum.Maecenas ac tempus nunc. In pretium diam in lectus volutpat, et faucibus neque tempus. Nullam lacinia bibendum leo sit amet ornare. Etiam tincidunt dui sit amet scelerisque tempor. Sed efficitur orci luctus blandit facilisis. Pellentesque sed bibendum neque. Nullam id lacus eros. Sed eu quam non nisl efficitur tincidunt ac eu tortor. Vivamus accumsan mauris eget velit semper tempor eu cursus sit amet risus.";
var textB = " Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque lectus eros, sodales in massa ac, cursus lorem. In eget risus vitae lacus ultricies ac non tellus. Aenean scelerisque varius elit a. Proin ornare vel tortor eget lobortis. Suspendisse et velit ut metus commodo placerat nec eu. Suspendisse sit amet sapien porttitor, cursus eros vel, accumsan risus. Etiam imperdiet libero at lobortis. Vivamus tristique eros egestas quam  porttitor. Proin venenatis nec urna a ultrices. In luctus, nisi tempus consectetur, sapien lacus ultricies justo, a sodales magna dui et. Curabitur sit amet lectus feugiat arcu. Sed ac egestas nibh, egestas dolor in, condimentum ipsum. Mauris ut elementum, consectetur varius urna. Duis vel arcu at orci fermentum rutrum. Suspendisse varius tincidunt lectus eu pulvinar. Fusce tristique non odio non tincidunt. Vestibulum a orci vel ipsum sagittis mollis tempor vitae massa. Donec sit amet vehicula augue, nec mattis mi. Nulla ut vulputate ante, vitae tempor est. In eu pellentesque dui. Donec pulvinar dolor at pellentesque convallis. Maecenas risus neque, vulputate eu ipsum quis, laoreet ornare velit. Ut nec dapibus ipsum, sed sagittis ipsum.Maecenas ac tempus nunc. In pretium diam in lectus volutpat, et faucibus neque tempus. Nullam lacinia bibendum leo sit amet ornare. Etiam tincidunt dui sit amet scelerisque tempor. Sed efficitur orci luctus blandit facilisis. Pellentesque sed bibendum neque. Nullam id lacus eros. Sed eu quam non nisl efficitur tincidunt ac eu tortor. Vivamus accumsan mauris eget velit semper tempor eu in nunc. Sed maximus eu nulla ut sodales. Curabitur metus odio, faucibus quis ullamcorper eu, cursus sit ";

for(var i=0; i<0; i++) {
    textA += textA;
    textB += textB;
}

function main()
{
    console.log(textA)
    console.log(textB)

    mat = makeCost( textA, textB, 0);
    before = new Date().getTime();
    maps = max_cost_assignment(mat, true);
    c_org = maps.cost;
    maps = max_cost_assignment(mat, false);
    after = new Date().getTime();

    console.log('xy '.concat(maps.xy));
    console.log('yx '.concat(maps.yx));

    for (var x=mat.nr; x>= 0; x--) {
        var y = maps.xy[x];
        console.log('x ' + x + ' ' + textA[x] + ' xy[x] ' + y + ' ' + textB[y] +
            ' y[x] ' + mat.y[x] + ' cost ' + (typeof(mat.y[x]) == "undefined" || mat.c[x][mat.y[x].indexOf(y)]));
    }

    for (var forward=1; forward>=0; forward--)
    {
        s = sequencer(mat, maps, forward, forward ? textA : textB);
        console.log( (forward ? 'sxy with len ' : 'syx with len ') + s.start.length );
    }

    console.log('cost ' + c_org + ' / ' + maps.cost)
    if (mat.swap) console.log('Careful: swapped strings');

    console.log('time in sec: ', (after - before)/1000)
}
