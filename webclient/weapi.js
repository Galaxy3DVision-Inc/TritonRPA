

class WeApi
{
    constructor(ws)
    {
        this.callMap = new Map();
        this.ws = ws;
        this.onMsg = null;
        this.refid = 0;
        this.sourceId = 1000;
        this.lastFrameTime = 0;

        self = this;
        ws.onopen = function ()
        {
            ws.RegisterFrameTypesToPascal(
                [
                    [0, ws.MedType("nmsg")],
                    [0, ws.MedType("wret")]
                ]
            );
        };
        ws.onframe = function (frm)
        {
            if (frm.startTime <= self.lastFrameTime) {
               // console.log("wrong\n");
            }
            self.lastFrameTime = frm.startTime;

            if (frm.type == ws.MedType("wret"))
            {
                var dec = new TextDecoder("utf-8");
                var strJson = dec.decode(frm.data);
                const retObj = JSON.parse(strJson);
                if (frm.refID > 0)
                {
                    if (self.callMap.has(frm.refID))
                    {
                        self.callMap[frm.refID](retObj["code"], retObj["Desc"]);
                    }
                }
            }
            else if (frm.type == ws.MedType("nmsg"))
            {
                var dec = new TextDecoder("utf-8");
                var strJson = dec.decode(frm.data);
                const msgObj = JSON.parse(strJson);
                var dataObj = msgObj["Data"];
                for (var idx in dataObj)
                {
                    var obj = dataObj[idx];
                    if (self.onMsg != null)
                    {
                        self.onMsg(frm.startTime,obj);
                    }
                }
            }
        };
        ws.onclose = function ()
        {
        };
    }
    //callback(code,desc)
    sendMsg(idOrName, msg,callback)
    {
        var cmdObj =
        {
            name: "SendMessage",
            id: "1",
            param1: idOrName,
            param2: msg
        };
        var cmdJson = JSON.stringify([cmdObj]);
        var frm = new DataFrame();
        frm.type = this.ws.MedType("wcmd");
        frm.sourceId = this.sourceId;
        var d = new Date();
        frm.startTime = d.getTime();
        frm.refID = ++this.refid;
        if (callback != null && callback != undefined) {
            this.callMap.set(frm.refID, callback);
        }
        var aryData = new TextEncoder().encode(cmdJson);
        frm.data = aryData;
        frm.dataSize = aryData.length;
        this.ws.send(frm);
    }
}