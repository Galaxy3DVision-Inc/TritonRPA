var g_api = null;
function gotmsg(recvTime,msgs) {
    document.getElementById("idMsg").value += "id=" + msgs["Id"]
        +" time=" + recvTime
        + "\r\nContent=" + msgs["Content"]
        + "\r\n";
}
document.addEventListener("DOMContentLoaded", function () {
    var ws = new WsConnect();
    ws.connect();
    var weapi = new WeApi(ws);
    weapi.onMsg = function (recvTime,msgs) {
        gotmsg(recvTime,msgs);
    };
    g_api = weapi;
}, false);

function SendFrame(id,msg,callback) {
    if (g_api != null) {
        g_api.sendMsg(id, msg, callback);
    }
}
function Query(dbName, sql, callback) {
    if (g_api != null) {
        g_api.Query(dbName, sql, callback);
    }
}

