src="bs_ex_files/jquery.js";

var mat, maps;
var minMatch;
var up2date = false;
var label;
var match_str;

var colorScheme = [
    ['#FFE6E3', '#E2BBE8', '#D6D6FF', '#C2E2E8', '#D3FFDF'],
    ['#FFE8CC', '#F5CBC7', '#FBDAFF', '#D9D7FA', '#C2F0FF'],
    ['#C0E2FF', '#C2E8DB', '#D9FFD0', '#E8E5B3', '#FFF2DA'], [null,null,null,null,null]];

var colorSchemeHl = [
    ['#FFC4BE', '#DB9AE8', '#B1B4FF', '#88D9E8', '#AFFFC1'],
    ['#FFD4A4', '#F5A8A1', '#F5B2FF', '#B2B0FA', '#9AE9FF'],
    ['#A7D4FF', '#ACE8D7', '#C2FFB8', '#E8E59D', '#FFEAC2'],
    ['#FFD4A4', '#FFD4A4', '#FFD4A4', '#FFD4A4', '#FFD4A4']];

var colorSchemeId = 0;

function handleResize() {
    var window_height = $(window).height();
    var content_height = window_height - document.getElementById('contentrow').offsetTop;
    $('.difftext').height(content_height);
}

function handleFileSelect(evt)
{
    var f = evt.target.files[0]; // FileList object
    var span = $(evt.target.id=="lfile" ? '#lfilename' : '#rfilename');
    span.text(f.name);

    var reader = new FileReader();
    reader.readAsText(f, 'UTF-8');
    var loaded = function(e)
    {
        var text = e.target.result; //.replace(/\n */g, '\n');
        var node = document.getElementById(evt.target.id=="lfile" ? 'ltext' : 'rtext');
        writeTextToNode(text, node)
    };
    reader.onloadend = loaded;
};

function writeTextToNode(text, node)
{
    var span = document.createElement('span');
    span.textContent = text;
    while (node.firstChild) node.removeChild(node.firstChild);
    node.appendChild(span, null);
}

function collapseText(text, regex)
{
    var collaptor = '¿';  // to be used as unique character; replaced if present in text
    var tmptext = text.replace(RegExp(collaptor, 'gm'), '?');
    var res = {
        text: tmptext.replace(regex, collaptor),
        repl: tmptext.match(regex) || Array(),
        collaptor: collaptor
    };

    if (text.length != res.text.length - res.repl.length + res.repl.join('').length) {
        console.log('there was an error in collapseText');
        console.log(res);
    }

    return res;
}

function handleDiff(evt)
{
    var lc, rc;

    var mm = parseInt($('#minmatch').val());
    minMatch = isNaN(mm) || mm < 1 ? 5 : mm;
    $('#minmatch').val(minMatch)

    var regex;
    try {
        var raw_regex = $('#collapse').val();
        if (raw_regex == '') {
            regex = RegExp('$^', 'gm');
        } else {
            regex = RegExp(raw_regex, 'gm');
        }
    } catch (e) {
        alert('Could not parse regex. Replacing nothing instead.');
        regex = RegExp('$^', 'gm');
    }

    lc = collapseText($('#ltext').text(), regex);
    rc = collapseText($('#rtext').text(), regex);

    if (!(lc.text && rc.text)) return;  // not ready

    var before = new Date().getTime();

    var json_result

    if ($('#go_backend').hasClass('active')) {
        $.ajax({
            type: "GET",
            url: "http://localhost:8080/solve",
            // data: JSON.stringify({ person:{ firstName: "Denny", lastName: "Cherian", department: "Microsoft PSS", address: { addressline1: "Microsoft India GTSC", addressline2: "PSS - DSI", city: "Bangalore", state: "Karnataka", country: "India", pin: "560028" }, technologies: ["IIS", "ASP.NET", "JavaScript", "AJAX"] }}),
            data: {a: lc.text, b: rc.text, minMatch:minMatch},
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                json_result = res;
            },
            error: function (request, status, errorThrown) {
                alert(status);
            },
            async: false
        });
        mat = json_result["mca"]
        maps = json_result["sol"]
    } else {
        mat = makeCost(lc.text, rc.text, minMatch);
        maps = max_cost_assignment(mat);
    }

    var after = new Date().getTime();

    up2date = true;

    renderText(lc, rc);

    console.log('time in sec: ', (after - before)/1000)
};

function renderText(lc, rc)
{
    var backw_id = mat.swap ? 1 : 0;
    var forw_id  = mat.swap ? 0 : 1;

    var syxxy = sequencer(mat, maps, mat.swap ? [lc.text, rc.text] : [rc.text, lc.text], minMatch);
    buildText('ltext', lc, syxxy[forw_id]);
    buildText('rtext', rc, syxxy[backw_id]);

    if ($('#syntax').hasClass('active')) {
        $('code pre').each(function(i, block) {
            hljs.highlightBlock(block);
        });
    }

    highlightText(syxxy[backw_id].id, 'l');
    highlightText(syxxy[backw_id].id, 'r');
}

function buildText(text_id, c, s)
{
    var node = document.getElementById(text_id);
    while (node.firstChild) node.removeChild(node.firstChild);

    function addNode(txt, is_match, id)
    {
        var span = document.createElement('span');
        span.textContent = txt;
        span.numId = id;
        span.style.borderRight = 'orange 1px solid';
        span.style.background = is_match ? colorScheme[colorSchemeId][id % 5] : '#FFFFFF';
        span.classList.add( is_match ? 'match-col-' + (id % 5) : 'no-match' );
        if (is_match) {
            span.id = text_id + '-match-span-' + id;
        }

        node.appendChild(span);
    }

    function expandText(start, end)
    {
        var part = text.slice(start, end).split(c.collaptor);
        var exp = part.shift();
        while(part.length > 0) exp += (repl.shift() + part.shift());
        return exp;
        // return text.slice(start, end);
    }

    var p=0;
    var text = c.text;
    var repl = c.repl.slice();
    for(var i=0; i<s.start.length; i++) {
        if (s.start[i] > p) {
            addNode(expandText(p, s.start[i]), false);
            p = s.start[i];
        }
        var span = document.createElement('span');
        addNode(expandText(s.start[i], s.end[i]), true, s.id[i]);
        p = s.end[i];
    }
    if (p < text.length)
        addNode(expandText(p, text.length), false);
}

function highlightText(ids, side)
{
    function highlight_func(span_id, id_num, on)
    {
        return function() {
            var scheme = on ? colorSchemeHl : colorScheme;
            try {
                document.getElementById(span_id).style.background =
                    on ? scheme[colorSchemeId][id_num % 5] : scheme[colorSchemeId][id_num % 5];
            } catch(e) {}
        }
    }

    function scroll_to_func(div_id, span_id)
    {
        return function() {
            try {
                var span = document.getElementById(span_id);
                var div = document.getElementById(div_id);
                var pos = span.offsetTop;
                document.getElementById(div_id).scrollTop = pos  - 20;
            } catch(e) {}
        }
    }

    for (var i=0; i<ids.length; i++) {
        var id = ids[i];
        var span_id = side+"text-match-span-"+id;
        var span = document.getElementById(span_id);
        var other_side = side == 'l' ? 'r' : 'l';
        var other_div_id = other_side + 'div';
        var other_span_id = other_side + 'text-match-span-' + id;
        span.addEventListener('mouseover', highlight_func(other_span_id, id, true), false);
        span.addEventListener('mouseout', highlight_func(other_span_id, id, false), false);
        span.addEventListener('click', scroll_to_func(other_div_id, other_span_id), false);
    }
}

function handleColorScheme(id)
{
    colorSchemeId = id;

    for (var c=0; c<5; c++) {
        var elems = document.getElementsByClassName('match-col-' + c);
        for (var e=0; e<elems.length; e++) {
            elems[e].style.background = colorScheme[colorSchemeId][c];
        }
    }

    $('#color-text').text('Colors ' + (id < 3 ? id+1 : 'off'));
}

function handleSyntax()
{
    $(this).toggleClass('active');
}

function handleGoBackend()
{
    $(this).toggleClass('active');
}

function handleWrap()
{
    $(this).toggleClass('active');
    $("#lcode").toggleClass('cls-code-nowrap');
    $("#rcode").toggleClass('cls-code-nowrap');
}

function handleUpdate()
{
    up2date = false;
}

function handleSwap()
{
    var ltext = $('#ltext').text();
    var rtext = $('#rtext').text();
    $('#ltext').text(rtext);
    $('#rtext').text(ltext);
}

function handleShuf()
{
    var rtext = $('#rtext').text();
    if (!rtext) return;  // not ready

    var ltext = shuffle(rtext, 10, Math.floor(rtext.length/30));
    var lnode = document.getElementById('ltext');
    writeTextToNode(ltext, lnode)
}
